import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { AuditWriterService } from '../auth/audit-writer.service';
import { AuthorizationService } from '../auth/authorization.service';
import {
  IdempotencyPayloadConflictError,
  InvalidIdempotencyKeyError,
  PayrollPeriodClosureIdempotencyPolicy,
} from './domain/payroll-period-closure-idempotency';
import { PayrollPeriodClosureManifestBuilder } from './domain/payroll-period-closure-manifest';
import { PayrollPeriodClosureHttpException } from './payroll-period-closure.errors';
import { PayrollPeriodClosureRepository } from './payroll-period-closure.repository';
import type {
  ClosePayrollPeriodCommandDto,
  ClosePayrollPeriodResponseDto,
} from './payroll-period-operational-closure.dto';
import { PayrollPeriodReadinessService } from './payroll-period-readiness.service';

const EXECUTE_CAPABILITY = 'payroll.period.close.execute';

const evidenceSelect = {
  id: true,
  sequence: true,
  engineVersion: true,
  parameterVersion: true,
  employees: {
    select: { employmentContractId: true, grossAmount: true, netAmount: true },
  },
  reviewCycles: {
    select: {
      id: true,
      reviewRound: true,
      decisions: {
        where: { decision: 'APPROVED', invalidation: null },
        select: { id: true, reviewRound: true, submissionNumber: true },
      },
      findings: { select: { id: true, severity: true, status: true } },
    },
  },
} satisfies Prisma.PayrollRunSelect;

type EvidenceRun = Prisma.PayrollRunGetPayload<{ select: typeof evidenceSelect }>;

@Injectable()
export class PayrollPeriodOperationalClosureService {
  private readonly idempotency = new PayrollPeriodClosureIdempotencyPolicy();
  private readonly manifestBuilder = new PayrollPeriodClosureManifestBuilder();

  constructor(
    private readonly repository: PayrollPeriodClosureRepository,
    private readonly readiness: PayrollPeriodReadinessService,
    private readonly audit: AuditWriterService,
    private readonly authorization: AuthorizationService,
  ) {}

  async close(
    payrollPeriodId: string,
    dto: ClosePayrollPeriodCommandDto,
    idempotencyKey: string | undefined,
    principal: AuthenticatedPrincipal,
  ): Promise<ClosePayrollPeriodResponseDto> {
    this.authorization.requireCapability(principal, EXECUTE_CAPABILITY);
    if (!idempotencyKey) {
      throw new PayrollPeriodClosureHttpException(
        'IDEMPOTENCY_KEY_REQUIRED',
        'Idempotency-Key is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    let keyHash: string;
    try {
      keyHash = this.idempotency.hashKey(idempotencyKey);
    } catch (error: unknown) {
      if (error instanceof InvalidIdempotencyKeyError) {
        throw new PayrollPeriodClosureHttpException(
          'IDEMPOTENCY_KEY_INVALID',
          error.message,
          HttpStatus.BAD_REQUEST,
        );
      }
      throw error;
    }
    const requestPayload = {
      payrollRunId: dto.payrollRunId,
      expectedConsistencyToken: dto.expectedConsistencyToken,
      warningAcknowledgements: dto.warningAcknowledgements
        .map((item) => ({
          warningCode: item.warningCode,
          acknowledged: item.acknowledged,
          ...(item.reason ? { reason: item.reason } : {}),
        }))
        .sort((left, right) => left.warningCode.localeCompare(right.warningCode)),
      ...(dto.note ? { note: dto.note } : {}),
      ...(dto.expectedClosureVersion === undefined
        ? {}
        : { expectedClosureVersion: dto.expectedClosureVersion }),
    } as const;
    const requestFingerprint = this.idempotency.fingerprint({
      operation: 'CLOSE',
      payload: requestPayload,
    });

    try {
      return await this.audit.transaction(
        async (tx) => {
          const scope = await tx.payrollPeriod.findFirst({
            where: { id: payrollPeriodId, companyId: principal.activeCompanyId! },
            select: { id: true, companyId: true },
          });
          if (!scope) throw new NotFoundException('Competência não encontrada');

          await this.repository.lockPeriod(tx, scope.companyId, scope.id);
          const idempotency = await tx.payrollPeriodClosureIdempotency.findUnique({
            where: {
              companyId_payrollPeriodId_operationType_idempotencyKeyHash: {
                companyId: scope.companyId,
                payrollPeriodId: scope.id,
                operationType: 'CLOSE',
                idempotencyKeyHash: keyHash,
              },
            },
          });
          if (idempotency) {
            try {
              this.idempotency.assertSamePayload(
                idempotency.requestFingerprint,
                requestFingerprint,
              );
            } catch (error: unknown) {
              if (error instanceof IdempotencyPayloadConflictError) {
                throw new PayrollPeriodClosureHttpException(
                  'IDEMPOTENCY_PAYLOAD_CONFLICT',
                  error.message,
                  HttpStatus.CONFLICT,
                );
              }
              throw error;
            }
            if (idempotency.status === 'COMPLETED' && idempotency.responseReference) {
              return this.replay(tx, scope.companyId, scope.id, idempotency.responseReference);
            }
            throw new PayrollPeriodClosureHttpException(
              'IDEMPOTENCY_OPERATION_IN_PROGRESS',
              'Idempotent operation is not available for replay',
              HttpStatus.CONFLICT,
            );
          }

          const reservation = await this.repository.reserveIdempotency(tx, {
            companyId: scope.companyId,
            payrollPeriodId: scope.id,
            operationType: 'CLOSE',
            idempotencyKeyHash: keyHash,
            requestFingerprint,
          });
          const readiness = await this.readiness.evaluateInTransaction(
            tx,
            scope.id,
            dto.payrollRunId,
            principal,
          );
          if (readiness.consistencyToken !== dto.expectedConsistencyToken) {
            throw new PayrollPeriodClosureHttpException(
              'CONSISTENCY_TOKEN_MISMATCH',
              'Readiness changed; query closure-readiness again',
              HttpStatus.CONFLICT,
            );
          }
          if (!readiness.isReady) {
            const alreadyClosed = readiness.blockers.some(
              (blocker) => blocker.code === 'PERIOD_ALREADY_CLOSED',
            );
            throw new PayrollPeriodClosureHttpException(
              alreadyClosed ? 'PERIOD_ALREADY_CLOSED' : 'CLOSURE_READINESS_NOT_MET',
              alreadyClosed ? 'Payroll period is already closed' : 'Closure readiness is not met',
              alreadyClosed ? HttpStatus.CONFLICT : HttpStatus.UNPROCESSABLE_ENTITY,
              { blockers: readiness.blockers },
            );
          }
          if (!readiness.selectedPayrollRun || !readiness.linkedReviewCycle) {
            throw new PayrollPeriodClosureHttpException(
              'CLOSURE_READINESS_NOT_MET',
              'Closure evidence is incomplete',
              HttpStatus.UNPROCESSABLE_ENTITY,
            );
          }

          const acknowledgementCodes = this.validateAcknowledgements(
            dto,
            readiness.warnings.map((warning) => warning.code),
            readiness.acknowledgementsRequired,
          );
          const active = await this.repository.getActive(scope.companyId, scope.id, tx);
          const isReopenedVersion = Boolean(
            active &&
            active.status === 'OPEN' &&
            active.previousClosureVersionId &&
            !active.selectedPayrollRunId &&
            !active.linkedReviewCycleId,
          );
          if (active && !isReopenedVersion) {
            throw new PayrollPeriodClosureHttpException(
              'PERIOD_ALREADY_CLOSED',
              'An operational closure version already exists',
              HttpStatus.CONFLICT,
            );
          }
          const expectedBusinessVersion = active?.version ?? 0;
          if (
            dto.expectedClosureVersion !== undefined &&
            dto.expectedClosureVersion !== expectedBusinessVersion
          ) {
            throw new PayrollPeriodClosureHttpException(
              'OPTIMISTIC_VERSION_CONFLICT',
              'Expected closure version does not match',
              HttpStatus.CONFLICT,
            );
          }

          const run = await tx.payrollRun.findFirst({
            where: { id: dto.payrollRunId, payrollPeriodId: scope.id },
            select: evidenceSelect,
          });
          if (!run) throw new NotFoundException('Evidência de fechamento não encontrada');
          const review = run.reviewCycles.find(
            (item) => item.id === readiness.linkedReviewCycle!.id,
          );
          if (!review) throw new NotFoundException('Evidência de conferência não encontrada');

          const closure =
            active ??
            (await this.repository.createVersion(tx, {
              id: randomUUID(),
              companyId: scope.companyId,
              payrollPeriodId: scope.id,
              selectedPayrollRunId: run.id,
              linkedReviewCycleId: review.id,
              linkedReviewRound: review.reviewRound,
              consistencyToken: dto.expectedConsistencyToken,
              createdBy: principal.actorId,
            }));
          const startingOptimisticVersion = closure.optimisticVersion ?? 1;
          await this.assertOptimisticUpdate(
            tx,
            closure.id,
            scope.companyId,
            startingOptimisticVersion,
            {
              status: 'CLOSING',
              ...(active
                ? {
                    selectedPayrollRunId: run.id,
                    linkedReviewCycleId: review.id,
                    linkedReviewRound: review.reviewRound,
                    consistencyToken: dto.expectedConsistencyToken,
                  }
                : {}),
            },
          );
          await this.appendEvent(
            tx,
            scope.companyId,
            closure.id,
            'PERIOD_CLOSURE_STARTED',
            {
              payrollRunId: run.id,
              reviewCycleId: review.id,
              previousState: 'OPEN',
              nextState: 'CLOSING',
            },
            principal,
          );

          for (const acknowledgement of dto.warningAcknowledgements) {
            const payload = {
              acknowledged: true,
              ...(acknowledgement.reason ? { reason: acknowledgement.reason } : {}),
            };
            await this.repository.appendWarningAcknowledgement(tx, {
              companyId: scope.companyId,
              payrollPeriodClosureId: closure.id,
              warningCode: acknowledgement.warningCode,
              acknowledgementPayload: payload,
              acknowledgedBy: principal.actorId,
              traceId: principal.traceId,
              sessionId: principal.sessionId,
              ipAddress: principal.ipAddress,
              userAgent: principal.userAgent,
            });
            await this.appendEvent(
              tx,
              scope.companyId,
              closure.id,
              'VARIABLE_PAY_WARNING_ACKNOWLEDGED',
              { warningCode: acknowledgement.warningCode, ...payload },
              principal,
            );
          }

          const now = new Date();
          const totals = this.totals(run);
          const manifest = this.manifestBuilder.build({
            companyId: scope.companyId,
            payrollPeriodId: scope.id,
            closureId: closure.id,
            closureVersion: closure.version,
            payrollRunId: run.id,
            payrollRunSequence: run.sequence,
            reviewCycleId: review.id,
            reviewRound: review.reviewRound,
            validDecisionReferences: review.decisions
              .filter((decision) => decision.reviewRound === review.reviewRound)
              .map((decision) => decision.id),
            relevantFindingReferences: review.findings.map((finding) => finding.id),
            consolidatedTotals: totals,
            safeEmployeeReferences: run.employees.map((employee) => employee.employmentContractId),
            previousStatus: 'OPEN',
            intendedStatus: 'CLOSED',
            variablePayWarnings: readiness.warnings.map((warning) => warning.code),
            warningAcknowledgements: acknowledgementCodes,
            actorContext: { actorId: principal.actorId, activeCompanyId: scope.companyId },
            evaluatedAt: readiness.evaluatedAt,
            traceId: principal.traceId,
            sessionId: principal.sessionId,
            generatedAt: now.toISOString(),
          });
          const storedManifest = await this.repository.appendManifest(tx, {
            companyId: scope.companyId,
            payrollPeriodClosureId: closure.id,
            manifestVersion: 1,
            payload: manifest.payload as unknown as Prisma.InputJsonValue,
            payloadHash: manifest.payloadHash,
            hashAlgorithmVersion: manifest.hashAlgorithmVersion,
            createdBy: principal.actorId,
            traceId: principal.traceId,
            sessionId: principal.sessionId,
            ipAddress: principal.ipAddress,
            userAgent: principal.userAgent,
          });
          const closedPeriod = await tx.payrollPeriod.update({
            where: { id: scope.id },
            data: {
              status: 'CLOSED',
              closedAt: now,
              engineVersion: run.engineVersion,
              parameterVersion: run.parameterVersion,
            },
            select: { updatedAt: true },
          });
          await this.assertOptimisticUpdate(
            tx,
            closure.id,
            scope.companyId,
            startingOptimisticVersion + 1,
            {
              status: 'CLOSED',
              closedAt: now,
            },
          );
          await this.appendEvent(
            tx,
            scope.companyId,
            closure.id,
            'PERIOD_CLOSED',
            {
              payrollRunId: run.id,
              reviewCycleId: review.id,
              manifestId: storedManifest.id,
              manifestHash: manifest.payloadHash,
              previousState: 'CLOSING',
              nextState: 'CLOSED',
              warningAcknowledgements: acknowledgementCodes,
            },
            principal,
          );
          await this.audit.append(
            {
              principal,
              action: 'PAYROLL_PERIOD_CLOSED',
              entityType: 'PayrollPeriod',
              entityId: scope.id,
              previousState: { status: 'OPEN' },
              nextState: { status: 'CLOSED', closureVersion: closure.version },
              reason: dto.note,
              metadata: {
                closureId: closure.id,
                manifestId: storedManifest.id,
                manifestHash: manifest.payloadHash,
                hashAlgorithmVersion: manifest.hashAlgorithmVersion,
                payrollRunId: run.id,
                reviewCycleId: review.id,
                warningAcknowledgements: acknowledgementCodes,
              },
            },
            tx,
          );
          await this.repository.completeIdempotency(tx, reservation.id, closure.id, now);

          return {
            payrollPeriodId: scope.id,
            closureId: closure.id,
            closureVersion: closure.version,
            status: 'CLOSED',
            payrollRunId: run.id,
            reviewCycleId: review.id,
            reviewRound: review.reviewRound,
            manifestId: storedManifest.id,
            manifestHash: manifest.payloadHash,
            hashAlgorithmVersion: manifest.hashAlgorithmVersion,
            warningsAcknowledged: acknowledgementCodes,
            closedAt: now.toISOString(),
            closedBy: principal.actorId,
            consistencyToken: closedPeriod.updatedAt.toISOString(),
            traceId: principal.traceId,
            idempotentReplay: false,
          };
        },
        {
          maxWait: 5_000,
          timeout: 15_000,
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        },
      );
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === 'P2034' ||
          (error.code === 'P2010' &&
            typeof error.meta?.code === 'string' &&
            error.meta.code === '55P03'))
      ) {
        throw new PayrollPeriodClosureHttpException(
          'CONCURRENT_CLOSURE_CONFLICT',
          'Concurrent closure operation detected',
          HttpStatus.CONFLICT,
        );
      }
      throw error;
    }
  }

  private validateAcknowledgements(
    dto: ClosePayrollPeriodCommandDto,
    warningCodes: readonly string[],
    requiredCodes: readonly string[],
  ): string[] {
    const provided = dto.warningAcknowledgements.map((item) => item.warningCode);
    if (
      new Set(provided).size !== provided.length ||
      provided.some((code) => !warningCodes.includes(code) || !requiredCodes.includes(code))
    ) {
      throw new PayrollPeriodClosureHttpException(
        'WARNING_ACKNOWLEDGEMENT_INVALID',
        'Warning acknowledgement is duplicated or does not match an authoritative warning',
        HttpStatus.UNPROCESSABLE_ENTITY,
        { warningCodes: provided },
      );
    }
    const missing = requiredCodes.filter((code) => !provided.includes(code));
    if (missing.length > 0) {
      throw new PayrollPeriodClosureHttpException(
        'WARNING_ACKNOWLEDGEMENT_REQUIRED',
        'Required warning acknowledgement is missing',
        HttpStatus.UNPROCESSABLE_ENTITY,
        { warningCodes: missing },
      );
    }
    return [...provided].sort();
  }

  private async assertOptimisticUpdate(
    tx: Prisma.TransactionClient,
    id: string,
    companyId: string,
    expectedVersion: number,
    data: Prisma.PayrollPeriodClosureVersionUncheckedUpdateManyInput,
  ): Promise<void> {
    const result = await this.repository.updateOptimistically(
      tx,
      id,
      companyId,
      expectedVersion,
      data,
    );
    if (result.count !== 1) {
      throw new PayrollPeriodClosureHttpException(
        'OPTIMISTIC_VERSION_CONFLICT',
        'Operational closure version changed concurrently',
        HttpStatus.CONFLICT,
      );
    }
  }

  private appendEvent(
    tx: Prisma.TransactionClient,
    companyId: string,
    closureId: string,
    eventType: 'PERIOD_CLOSURE_STARTED' | 'VARIABLE_PAY_WARNING_ACKNOWLEDGED' | 'PERIOD_CLOSED',
    payload: Prisma.InputJsonObject,
    principal: AuthenticatedPrincipal,
  ) {
    return this.repository.appendEvent(tx, {
      companyId,
      payrollPeriodClosureId: closureId,
      eventType,
      payload,
      actorUserId: principal.actorId,
      traceId: principal.traceId,
      sessionId: principal.sessionId,
      ipAddress: principal.ipAddress,
      userAgent: principal.userAgent,
    });
  }

  private totals(run: EvidenceRun): Readonly<Record<string, string>> {
    const gross = run.employees.reduce(
      (sum, employee) => sum.add(employee.grossAmount),
      new Prisma.Decimal(0),
    );
    const net = run.employees.reduce(
      (sum, employee) => sum.add(employee.netAmount),
      new Prisma.Decimal(0),
    );
    return {
      employeeCount: String(run.employees.length),
      gross: gross.toFixed(2),
      net: net.toFixed(2),
    };
  }

  private async replay(
    tx: Prisma.TransactionClient,
    companyId: string,
    payrollPeriodId: string,
    closureId: string,
  ): Promise<ClosePayrollPeriodResponseDto> {
    const closure = await tx.payrollPeriodClosureVersion.findFirst({
      where: { id: closureId, companyId, payrollPeriodId, status: 'CLOSED' },
      include: { manifests: { orderBy: { manifestVersion: 'desc' }, take: 1 } },
    });
    const period = await tx.payrollPeriod.findFirst({
      where: { id: payrollPeriodId, companyId },
      select: { updatedAt: true },
    });
    const manifest = closure?.manifests[0];
    if (
      !closure ||
      !manifest ||
      !period ||
      !closure.selectedPayrollRunId ||
      !closure.linkedReviewCycleId ||
      !closure.linkedReviewRound ||
      !closure.closedAt
    ) {
      throw new PayrollPeriodClosureHttpException(
        'IDEMPOTENCY_OPERATION_IN_PROGRESS',
        'Persisted idempotent result is unavailable',
        HttpStatus.CONFLICT,
      );
    }
    const payload = manifest.payload as Record<string, unknown>;
    const acknowledgements = Array.isArray(payload.warningAcknowledgements)
      ? payload.warningAcknowledgements.filter((item): item is string => typeof item === 'string')
      : [];
    return {
      payrollPeriodId,
      closureId: closure.id,
      closureVersion: closure.version,
      status: 'CLOSED',
      payrollRunId: closure.selectedPayrollRunId,
      reviewCycleId: closure.linkedReviewCycleId,
      reviewRound: closure.linkedReviewRound,
      manifestId: manifest.id,
      manifestHash: manifest.payloadHash,
      hashAlgorithmVersion: manifest.hashAlgorithmVersion,
      warningsAcknowledged: acknowledgements,
      closedAt: closure.closedAt.toISOString(),
      closedBy: closure.createdBy,
      consistencyToken: period.updatedAt.toISOString(),
      traceId: manifest.traceId,
      idempotentReplay: true,
    };
  }
}

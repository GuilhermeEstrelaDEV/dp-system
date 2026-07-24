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
import {
  PayrollPeriodClosureHttpException,
  type PayrollPeriodClosureErrorCode,
} from './payroll-period-closure.errors';
import { PayrollPeriodClosureRepository } from './payroll-period-closure.repository';
import type { ReopenPayrollPeriodResponseDto } from './payroll-period-controlled-reopening.dto';
import type { ReopenPayrollPeriodDto } from './payroll-periods.dto';

const REOPEN_CAPABILITY = 'payroll.period.close.reopen';

@Injectable()
export class PayrollPeriodControlledReopeningService {
  private readonly idempotency = new PayrollPeriodClosureIdempotencyPolicy();

  constructor(
    private readonly repository: PayrollPeriodClosureRepository,
    private readonly audit: AuditWriterService,
    private readonly authorization: AuthorizationService,
  ) {}

  async reopen(
    payrollPeriodId: string,
    dto: ReopenPayrollPeriodDto,
    idempotencyKey: string | undefined,
    principal: AuthenticatedPrincipal,
  ): Promise<ReopenPayrollPeriodResponseDto> {
    this.authorization.requireCapability(principal, REOPEN_CAPABILITY);
    if (!idempotencyKey) this.fail('IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key is required', 400);

    let keyHash: string;
    try {
      keyHash = this.idempotency.hashKey(idempotencyKey!);
    } catch (error: unknown) {
      if (error instanceof InvalidIdempotencyKeyError) {
        this.fail('IDEMPOTENCY_KEY_INVALID', error.message, 400);
      }
      throw error;
    }
    const reason = dto.reason.trim();
    if (!reason) this.fail('REOPEN_REASON_REQUIRED', 'Reopen reason is required', 400);
    const requestFingerprint = this.idempotency.fingerprint({
      operation: 'REOPEN',
      payload: {
        reason,
        expectedConsistencyToken: dto.expectedConsistencyToken,
        expectedClosureVersion: dto.expectedClosureVersion,
        ...(dto.note ? { note: dto.note } : {}),
      },
    });

    try {
      return await this.audit.transaction(
        async (tx) => {
          const period = await tx.payrollPeriod.findFirst({
            where: { id: payrollPeriodId, companyId: principal.activeCompanyId! },
            select: { id: true, companyId: true, status: true, updatedAt: true },
          });
          if (!period) throw new NotFoundException('Competência não encontrada');

          await this.repository.lockPeriod(tx, period.companyId, period.id);
          const existing = await tx.payrollPeriodClosureIdempotency.findUnique({
            where: {
              companyId_payrollPeriodId_operationType_idempotencyKeyHash: {
                companyId: period.companyId,
                payrollPeriodId: period.id,
                operationType: 'REOPEN',
                idempotencyKeyHash: keyHash,
              },
            },
          });
          if (existing) {
            try {
              this.idempotency.assertSamePayload(existing.requestFingerprint, requestFingerprint);
            } catch (error: unknown) {
              if (error instanceof IdempotencyPayloadConflictError) {
                this.fail('IDEMPOTENCY_PAYLOAD_CONFLICT', error.message, 409);
              }
              throw error;
            }
            if (existing.status === 'COMPLETED' && existing.responseReference) {
              return this.replay(tx, period.companyId, period.id, existing.responseReference);
            }
            this.fail(
              'IDEMPOTENCY_OPERATION_IN_PROGRESS',
              'Idempotent operation is not available for replay',
              409,
            );
          }

          const reservation = await this.repository.reserveIdempotency(tx, {
            companyId: period.companyId,
            payrollPeriodId: period.id,
            operationType: 'REOPEN',
            idempotencyKeyHash: keyHash,
            requestFingerprint,
          });
          const reloaded = await tx.payrollPeriod.findUniqueOrThrow({
            where: { id: period.id },
            select: { status: true, updatedAt: true },
          });
          if (reloaded.updatedAt.toISOString() !== dto.expectedConsistencyToken) {
            this.fail(
              'CONSISTENCY_TOKEN_MISMATCH',
              'Payroll period changed; query readiness again',
              409,
            );
          }
          const closure = await tx.payrollPeriodClosureVersion.findFirst({
            where: { companyId: period.companyId, payrollPeriodId: period.id, supersededAt: null },
            include: {
              manifests: { orderBy: { manifestVersion: 'desc' }, take: 1 },
              events: { where: { eventType: 'PERIOD_CLOSED' }, take: 1 },
            },
          });
          if (closure?.status === 'OPEN' && closure.previousClosureVersionId) {
            this.fail(
              'PERIOD_REOPEN_ALREADY_COMPLETED',
              'Payroll period reopening is already completed',
              409,
            );
          }
          if (closure?.status === 'REOPENING') {
            this.fail('PERIOD_REOPEN_IN_PROGRESS', 'Payroll period reopening is in progress', 409);
          }
          if (!closure || reloaded.status !== 'CLOSED' || closure.status !== 'CLOSED') {
            this.fail('PERIOD_NOT_CLOSED', 'Payroll period is not closed', 409);
          }
          if (closure.version !== dto.expectedClosureVersion) {
            this.fail(
              'EXPECTED_CLOSURE_VERSION_MISMATCH',
              'Expected closure version does not match',
              409,
            );
          }
          const manifest = closure.manifests[0];
          if (!manifest || closure.events.length === 0) {
            this.fail(
              'CLOSURE_EVIDENCE_INTEGRITY_ERROR',
              'Closure manifest or PERIOD_CLOSED event is missing',
              409,
            );
          }

          await this.optimistic(tx, closure.id, period.companyId, closure.optimisticVersion, {
            status: 'REOPENING',
          });
          const common = {
            payrollPeriodId: period.id,
            previousClosureId: closure.id,
            previousClosureVersion: closure.version,
            actorUserId: principal.actorId,
            reason,
          };
          await this.event(
            tx,
            period.companyId,
            closure.id,
            'PERIOD_REOPENING_STARTED',
            {
              ...common,
              previousState: 'CLOSED',
              nextState: 'REOPENING',
            },
            principal,
          );
          await this.event(
            tx,
            period.companyId,
            closure.id,
            'CLOSURE_EVIDENCE_INVALIDATED',
            {
              ...common,
              manifestId: manifest.id,
              payrollRunId: closure.selectedPayrollRunId,
              reviewCycleId: closure.linkedReviewCycleId,
              invalidation: 'OPERATIONAL_USE_ONLY',
            },
            principal,
          );

          const reopenedAt = new Date();
          await this.optimistic(tx, closure.id, period.companyId, closure.optimisticVersion + 1, {
            status: 'CLOSED',
            supersededAt: reopenedAt,
            reopenedAt,
          });
          const updatedPeriod = await tx.payrollPeriod.update({
            where: { id: period.id },
            data: { status: 'OPEN', reopenedAt },
            select: { updatedAt: true },
          });
          const next = await this.repository.createVersion(tx, {
            id: randomUUID(),
            companyId: period.companyId,
            payrollPeriodId: period.id,
            consistencyToken: updatedPeriod.updatedAt.toISOString(),
            createdBy: principal.actorId,
            previousClosureVersionId: closure.id,
          });
          await this.event(
            tx,
            period.companyId,
            next.id,
            'PERIOD_REOPENED',
            {
              ...common,
              newClosureId: next.id,
              newClosureVersion: next.version,
              previousState: 'REOPENING',
              nextState: 'OPEN',
              requiresNewPayrollRun: true,
              requiresNewPayrollReview: true,
            },
            principal,
          );
          await this.audit.append(
            {
              principal,
              action: 'PAYROLL_PERIOD_REOPENED',
              entityType: 'PayrollPeriod',
              entityId: period.id,
              previousState: { status: 'CLOSED', closureVersion: closure.version },
              nextState: { status: 'OPEN', closureVersion: next.version },
              reason,
              metadata: {
                outcome: {
                  previousClosureId: closure.id,
                  newClosureId: next.id,
                  previousManifestId: manifest.id,
                  invalidatedPayrollRunId: closure.selectedPayrollRunId,
                  invalidatedReviewCycleId: closure.linkedReviewCycleId,
                },
              },
            },
            tx,
          );
          await this.repository.completeIdempotency(tx, reservation.id, next.id, reopenedAt);
          return this.response(
            period.id,
            closure,
            next.id,
            next.version,
            manifest,
            reason,
            reopenedAt,
            principal.actorId,
            updatedPeriod.updatedAt.toISOString(),
            principal.traceId,
            false,
          );
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
        (error.code === 'P2034' || (error.code === 'P2010' && error.meta?.code === '55P03'))
      ) {
        this.fail('CONCURRENT_REOPEN_CONFLICT', 'Concurrent reopen operation detected', 409);
      }
      throw error;
    }
  }

  private async replay(
    tx: Prisma.TransactionClient,
    companyId: string,
    payrollPeriodId: string,
    newClosureId: string,
  ): Promise<ReopenPayrollPeriodResponseDto> {
    const next = await tx.payrollPeriodClosureVersion.findFirst({
      where: { id: newClosureId, companyId, payrollPeriodId, status: 'OPEN' },
      include: {
        previousClosureVersion: {
          include: { manifests: { orderBy: { manifestVersion: 'desc' }, take: 1 } },
        },
      },
    });
    const period = await tx.payrollPeriod.findFirst({
      where: { id: payrollPeriodId, companyId },
      select: { updatedAt: true },
    });
    const previous = next?.previousClosureVersion;
    const manifest = previous?.manifests[0];
    if (!next || !previous || !manifest || !next.createdAt) {
      this.fail(
        'IDEMPOTENCY_OPERATION_IN_PROGRESS',
        'Persisted idempotent result is unavailable',
        409,
      );
    }
    const reopenedEvent = await tx.payrollPeriodClosureEvent.findFirst({
      where: { payrollPeriodClosureId: next.id, eventType: 'PERIOD_REOPENED' },
      orderBy: { createdAt: 'desc' },
    });
    const payload = reopenedEvent?.payload as Record<string, unknown> | undefined;
    return this.response(
      payrollPeriodId,
      previous,
      next.id,
      next.version,
      manifest,
      typeof payload?.reason === 'string' ? payload.reason : '',
      previous.reopenedAt ?? next.createdAt,
      reopenedEvent?.actorUserId ?? next.createdBy,
      period!.updatedAt.toISOString(),
      reopenedEvent?.traceId ?? '',
      true,
    );
  }

  private response(
    payrollPeriodId: string,
    previous: { id: string; version: number },
    newClosureId: string,
    newClosureVersion: number,
    manifest: { id: string; payloadHash: string },
    reason: string,
    reopenedAt: Date,
    reopenedBy: string,
    consistencyToken: string,
    traceId: string,
    idempotentReplay: boolean,
  ): ReopenPayrollPeriodResponseDto {
    return {
      payrollPeriodId,
      previousClosureId: previous.id,
      previousClosureVersion: previous.version,
      newClosureId,
      newClosureVersion,
      status: 'OPEN',
      previousManifestId: manifest.id,
      previousManifestHash: manifest.payloadHash,
      reason,
      reopenedAt: reopenedAt.toISOString(),
      reopenedBy,
      consistencyToken,
      requiresNewPayrollRun: true,
      requiresNewPayrollReview: true,
      traceId,
      idempotentReplay,
    };
  }

  private async optimistic(
    tx: Prisma.TransactionClient,
    id: string,
    companyId: string,
    version: number,
    data: Prisma.PayrollPeriodClosureVersionUncheckedUpdateManyInput,
  ) {
    const result = await this.repository.updateOptimistically(tx, id, companyId, version, data);
    if (result.count !== 1)
      this.fail('OPTIMISTIC_VERSION_CONFLICT', 'Closure changed concurrently', 409);
  }

  private event(
    tx: Prisma.TransactionClient,
    companyId: string,
    closureId: string,
    eventType: 'PERIOD_REOPENING_STARTED' | 'CLOSURE_EVIDENCE_INVALIDATED' | 'PERIOD_REOPENED',
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

  private fail(code: PayrollPeriodClosureErrorCode, message: string, status: number): never {
    throw new PayrollPeriodClosureHttpException(code, message, status as HttpStatus);
  }
}

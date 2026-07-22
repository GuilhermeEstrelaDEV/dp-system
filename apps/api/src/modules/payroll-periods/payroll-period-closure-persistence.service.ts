import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type PayrollPeriodClosureOperationType } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { AuditWriterService } from '../auth/audit-writer.service';
import { AuthorizationService } from '../auth/authorization.service';
import { PayrollPeriodClosureIdempotencyPolicy } from './domain/payroll-period-closure-idempotency';
import {
  PayrollPeriodClosureManifestBuilder,
  type BuildPayrollPeriodClosureManifestInput,
  type CanonicalJsonValue,
} from './domain/payroll-period-closure-manifest';
import { PayrollPeriodClosureRepository } from './payroll-period-closure.repository';

const CAPABILITIES = {
  execute: 'payroll.period.close.execute',
  reopen: 'payroll.period.close.reopen',
} as const;

export interface CreateClosureFoundationInput {
  readonly payrollPeriodId: string;
  readonly selectedPayrollRunId: string;
  readonly linkedReviewCycleId: string;
  readonly linkedReviewRound: number;
  readonly consistencyToken: string;
  readonly manifest: Omit<
    BuildPayrollPeriodClosureManifestInput,
    | 'companyId'
    | 'payrollPeriodId'
    | 'closureId'
    | 'closureVersion'
    | 'payrollRunId'
    | 'reviewCycleId'
    | 'reviewRound'
    | 'actorContext'
    | 'traceId'
    | 'sessionId'
  >;
  readonly warningAcknowledgements: readonly {
    readonly code: string;
    readonly payload: CanonicalJsonValue;
  }[];
}

export interface ReserveClosureIdempotencyInput {
  readonly payrollPeriodId: string;
  readonly operationType: PayrollPeriodClosureOperationType;
  readonly idempotencyKey: string;
  readonly requestPayload: CanonicalJsonValue;
}

@Injectable()
export class PayrollPeriodClosurePersistenceService {
  private readonly manifestBuilder = new PayrollPeriodClosureManifestBuilder();
  private readonly idempotency = new PayrollPeriodClosureIdempotencyPolicy();

  constructor(
    private readonly repository: PayrollPeriodClosureRepository,
    private readonly audit: AuditWriterService,
    private readonly authorization: AuthorizationService,
  ) {}

  async createFoundationVersion(
    input: CreateClosureFoundationInput,
    principal: AuthenticatedPrincipal,
  ) {
    this.authorization.requireCapability(principal, CAPABILITIES.execute);
    return this.audit.transaction(async (tx) => {
      const scope = await tx.payrollPeriod.findFirst({
        where: { id: input.payrollPeriodId, companyId: principal.activeCompanyId! },
        select: {
          id: true,
          companyId: true,
          updatedAt: true,
          runs: {
            where: { id: input.selectedPayrollRunId },
            select: {
              id: true,
              reviewCycles: {
                where: { id: input.linkedReviewCycleId, companyId: principal.activeCompanyId! },
                select: { id: true, reviewRound: true },
              },
            },
          },
        },
      });
      if (!scope || scope.runs.length !== 1 || scope.runs[0]!.reviewCycles.length !== 1) {
        throw new NotFoundException('Evidência de fechamento não encontrada');
      }
      const observedToken = scope.updatedAt.toISOString();
      if (observedToken !== input.consistencyToken) {
        throw new ConflictException('Readiness observada está desatualizada');
      }
      const review = scope.runs[0]!.reviewCycles[0]!;
      if (review.reviewRound !== input.linkedReviewRound) {
        throw new ConflictException('Rodada de conferência está desatualizada');
      }

      const closureId = randomUUID();
      const closure = await this.repository.createVersion(tx, {
        id: closureId,
        companyId: scope.companyId,
        payrollPeriodId: scope.id,
        selectedPayrollRunId: input.selectedPayrollRunId,
        linkedReviewCycleId: input.linkedReviewCycleId,
        linkedReviewRound: input.linkedReviewRound,
        consistencyToken: input.consistencyToken,
        createdBy: principal.actorId,
      });
      const manifest = this.manifestBuilder.build({
        ...input.manifest,
        companyId: scope.companyId,
        payrollPeriodId: scope.id,
        closureId: closure.id,
        closureVersion: closure.version,
        payrollRunId: input.selectedPayrollRunId,
        reviewCycleId: input.linkedReviewCycleId,
        reviewRound: input.linkedReviewRound,
        actorContext: { actorId: principal.actorId, activeCompanyId: scope.companyId },
        traceId: principal.traceId,
        sessionId: principal.sessionId ?? null,
      });
      await this.repository.appendManifest(tx, {
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
      await this.repository.appendEvent(tx, {
        companyId: scope.companyId,
        payrollPeriodClosureId: closure.id,
        eventType: 'PERIOD_READINESS_EVALUATED',
        payload: { consistencyToken: input.consistencyToken },
        actorUserId: principal.actorId,
        traceId: principal.traceId,
        sessionId: principal.sessionId,
        ipAddress: principal.ipAddress,
        userAgent: principal.userAgent,
      });
      for (const acknowledgement of input.warningAcknowledgements) {
        await this.repository.appendWarningAcknowledgement(tx, {
          companyId: scope.companyId,
          payrollPeriodClosureId: closure.id,
          warningCode: acknowledgement.code,
          acknowledgementPayload: acknowledgement.payload as Prisma.InputJsonValue,
          acknowledgedBy: principal.actorId,
          traceId: principal.traceId,
          sessionId: principal.sessionId,
          ipAddress: principal.ipAddress,
          userAgent: principal.userAgent,
        });
      }
      await this.audit.append(
        {
          principal,
          action: 'PAYROLL_PERIOD_CLOSURE_FOUNDATION_CREATED',
          entityType: 'PayrollPeriodClosureVersion',
          entityId: closure.id,
          nextState: { status: closure.status, version: closure.version },
          metadata: {
            payrollPeriodId: scope.id,
            payrollRunId: input.selectedPayrollRunId,
            reviewCycleId: input.linkedReviewCycleId,
          },
        },
        tx,
      );
      return closure;
    });
  }

  async reserveIdempotency(
    input: ReserveClosureIdempotencyInput,
    principal: AuthenticatedPrincipal,
  ) {
    this.authorization.requireCapability(
      principal,
      input.operationType === 'CLOSE' ? CAPABILITIES.execute : CAPABILITIES.reopen,
    );
    const keyHash = this.idempotency.hashKey(input.idempotencyKey);
    const requestFingerprint = this.idempotency.fingerprint({
      operation: input.operationType,
      payload: input.requestPayload,
    });
    return this.audit.transaction(async (tx) => {
      const period = await tx.payrollPeriod.findFirst({
        where: { id: input.payrollPeriodId, companyId: principal.activeCompanyId! },
        select: { id: true, companyId: true },
      });
      if (!period) throw new NotFoundException('Competência não encontrada');
      try {
        return await this.repository.reserveIdempotency(tx, {
          companyId: period.companyId,
          payrollPeriodId: period.id,
          operationType: input.operationType,
          idempotencyKeyHash: keyHash,
          requestFingerprint,
        });
      } catch (error: unknown) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
          throw error;
        }
        const existing = await tx.payrollPeriodClosureIdempotency.findUniqueOrThrow({
          where: {
            companyId_payrollPeriodId_operationType_idempotencyKeyHash: {
              companyId: period.companyId,
              payrollPeriodId: period.id,
              operationType: input.operationType,
              idempotencyKeyHash: keyHash,
            },
          },
        });
        this.idempotency.assertSamePayload(existing.requestFingerprint, requestFingerprint);
        return existing;
      }
    });
  }

  async completeIdempotency(
    id: string,
    responseReference: string,
    client: Prisma.TransactionClient,
  ): Promise<void> {
    const result = await this.repository.completeIdempotency(
      client,
      id,
      responseReference,
      new Date(),
    );
    if (result.count !== 1) throw new ConflictException('Idempotência não está em andamento');
  }

  async failIdempotency(
    id: string,
    failureCode: string,
    client: Prisma.TransactionClient,
  ): Promise<void> {
    const result = await this.repository.failIdempotency(client, id, failureCode, new Date());
    if (result.count !== 1) throw new ConflictException('Idempotência não está em andamento');
  }

  async updateOptimistically(
    id: string,
    companyId: string,
    expectedVersion: number,
    data: Prisma.PayrollPeriodClosureVersionUncheckedUpdateManyInput,
    client: Prisma.TransactionClient,
  ): Promise<void> {
    const result = await this.repository.updateOptimistically(
      client,
      id,
      companyId,
      expectedVersion,
      data,
    );
    if (result.count !== 1) throw new ConflictException('Versão otimista desatualizada');
  }
}

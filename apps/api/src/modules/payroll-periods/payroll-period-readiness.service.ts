import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthorizationService } from '../auth/authorization.service';
import {
  PayrollPeriodClosureReadinessPolicy,
  type PayrollPeriodReadinessSnapshot,
  type PayrollReviewCycleReadinessSnapshot,
  type PayrollRunReadinessSnapshot,
} from './domain/payroll-period-closure-readiness';
import type { PayrollPeriodClosureReadinessResponseDto } from './payroll-period-readiness.dto';

const READINESS_CAPABILITY = 'payroll.period.close.readiness';

const readinessPeriodSelect = {
  id: true,
  companyId: true,
  referenceDate: true,
  status: true,
  updatedAt: true,
  closureVersions: {
    where: { supersededAt: null },
    take: 1,
    select: {
      previousClosureVersion: {
        select: { selectedPayrollRun: { select: { sequence: true } } },
      },
    },
  },
  runs: {
    orderBy: { sequence: 'desc' },
    select: {
      id: true,
      payrollPeriodId: true,
      sequence: true,
      status: true,
      completedAt: true,
      engineVersion: true,
      parameterVersion: true,
      messages: {
        where: { resolvedAt: null },
        select: { severity: true },
      },
      employees: {
        select: { id: true, grossAmount: true, netAmount: true },
      },
      reviewCycles: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          companyId: true,
          payrollRunId: true,
          status: true,
          reviewRound: true,
          submissionNumber: true,
          createdAt: true,
          approvalStages: { select: { id: true } },
          decisions: {
            select: {
              approvalStageId: true,
              submissionNumber: true,
              reviewRound: true,
              decision: true,
              invalidation: { select: { id: true } },
            },
          },
          findings: {
            where: { severity: 'BLOCKING', status: 'OPEN' },
            select: { id: true },
          },
          events: {
            where: { eventType: { in: ['REVIEW_CLOSED', 'REVIEW_REOPENED'] } },
            orderBy: [{ occurredAt: 'asc' }, { id: 'asc' }],
            select: { eventType: true, metadata: true, occurredAt: true },
          },
        },
      },
    },
  },
} satisfies Prisma.PayrollPeriodSelect;

type ReadinessPeriodRecord = Prisma.PayrollPeriodGetPayload<{
  select: typeof readinessPeriodSelect;
}>;

@Injectable()
export class PayrollPeriodReadinessService {
  private readonly policy = new PayrollPeriodClosureReadinessPolicy();

  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: AuthorizationService,
  ) {}

  async evaluate(
    payrollPeriodId: string,
    payrollRunId: string | undefined,
    principal: AuthenticatedPrincipal,
  ): Promise<PayrollPeriodClosureReadinessResponseDto> {
    this.authorization.requireCapability(principal, READINESS_CAPABILITY);
    return this.evaluateWithClient(this.prisma, payrollPeriodId, payrollRunId, principal);
  }

  async evaluateInTransaction(
    client: Prisma.TransactionClient,
    payrollPeriodId: string,
    payrollRunId: string,
    principal: AuthenticatedPrincipal,
  ): Promise<PayrollPeriodClosureReadinessResponseDto> {
    this.authorization.requireCapability(principal, 'payroll.period.close.execute');
    return this.evaluateWithClient(client, payrollPeriodId, payrollRunId, principal);
  }

  private async evaluateWithClient(
    client: Prisma.TransactionClient | PrismaService,
    payrollPeriodId: string,
    payrollRunId: string | undefined,
    principal: AuthenticatedPrincipal,
  ): Promise<PayrollPeriodClosureReadinessResponseDto> {
    const companyId = principal.activeCompanyId!;
    const period = await client.payrollPeriod.findFirst({
      where: { id: payrollPeriodId, companyId },
      select: readinessPeriodSelect,
    });
    if (!period) throw new NotFoundException('Competência não encontrada');

    const pendingVariablePayItems = await this.countPendingVariablePayItems(
      client,
      companyId,
      period.referenceDate,
    );
    const snapshot = this.toSnapshot(period, pendingVariablePayItems);
    const evaluation = this.policy.evaluate(snapshot, payrollRunId);
    const evaluatedAt = new Date();

    return {
      payrollPeriodId: period.id,
      companyId: period.companyId,
      referenceDate: period.referenceDate.toISOString().slice(0, 10),
      currentStatus: period.status,
      isReady: evaluation.blockers.length === 0,
      evaluatedAt: evaluatedAt.toISOString(),
      selectedPayrollRun: evaluation.selectedRun
        ? {
            id: evaluation.selectedRun.id,
            sequence: evaluation.selectedRun.sequence,
            status: evaluation.selectedRun.status,
            completedAt: evaluation.selectedRun.completedAt?.toISOString() ?? null,
            engineVersion: evaluation.selectedRun.engineVersion,
            parameterVersion: evaluation.selectedRun.parameterVersion,
          }
        : null,
      linkedReviewCycle: evaluation.linkedReviewCycle
        ? {
            id: evaluation.linkedReviewCycle.id,
            status: evaluation.linkedReviewCycle.status,
            reviewRound: evaluation.linkedReviewCycle.reviewRound,
            submissionNumber: evaluation.linkedReviewCycle.submissionNumber,
          }
        : null,
      blockers: [...evaluation.blockers],
      warnings: [...evaluation.warnings],
      acknowledgementsRequired: evaluation.warnings
        .filter((warning) => warning.acknowledgementRequired)
        .map((warning) => warning.code),
      consistencyToken: period.updatedAt.toISOString(),
      traceId: principal.traceId,
      unavailableWarningChecks: ['EXTERNAL_INTEGRATIONS_PENDING'],
    };
  }

  private async countPendingVariablePayItems(
    client: Prisma.TransactionClient | PrismaService,
    companyId: string,
    referenceDate: Date,
  ) {
    const employmentContract = { companyId };
    const [events, advances, offCyclePayments] = await Promise.all([
      client.variableCompensationEvent.count({
        where: { referencePeriod: referenceDate, approvalStatus: 'PENDING', employmentContract },
      }),
      client.salaryAdvance.count({
        where: { referencePeriod: referenceDate, status: 'PENDING', employmentContract },
      }),
      client.offCyclePayment.count({
        where: { referencePeriod: referenceDate, approvalStatus: 'PENDING', employmentContract },
      }),
    ]);
    return events + advances + offCyclePayments;
  }

  private toSnapshot(
    period: ReadinessPeriodRecord,
    pendingVariablePayItems: number,
  ): PayrollPeriodReadinessSnapshot {
    return {
      id: period.id,
      companyId: period.companyId,
      referenceDate: period.referenceDate,
      status: period.status,
      updatedAt: period.updatedAt,
      pendingVariablePayItems,
      runs: period.runs
        .filter((run) => {
          const previousSequence =
            period.closureVersions?.[0]?.previousClosureVersion?.selectedPayrollRun?.sequence;
          return previousSequence === undefined || run.sequence > previousSequence;
        })
        .map((run) => this.toRunSnapshot(period.companyId, run)),
    };
  }

  private toRunSnapshot(
    companyId: string,
    run: ReadinessPeriodRecord['runs'][number],
  ): PayrollRunReadinessSnapshot {
    return {
      id: run.id,
      companyId,
      payrollPeriodId: run.payrollPeriodId,
      sequence: run.sequence,
      status: run.status,
      completedAt: run.completedAt,
      engineVersion: run.engineVersion,
      parameterVersion: run.parameterVersion,
      openBlockingErrors: run.messages.filter((message) => message.severity === 'BLOCKING_ERROR')
        .length,
      operationalWarnings: run.messages.filter((message) => message.severity === 'WARNING').length,
      hasRequiredTotals: run.employees.length > 0,
      reviewCycles: run.reviewCycles.map((cycle) => this.toReviewSnapshot(cycle)),
    };
  }

  private toReviewSnapshot(
    cycle: ReadinessPeriodRecord['runs'][number]['reviewCycles'][number],
  ): PayrollReviewCycleReadinessSnapshot {
    const closeEvents = cycle.events.filter((event) => event.eventType === 'REVIEW_CLOSED');
    const latestClose = closeEvents.at(-1);
    const latestReopen = cycle.events
      .filter((event) => event.eventType === 'REVIEW_REOPENED')
      .at(-1);
    return {
      id: cycle.id,
      companyId: cycle.companyId,
      payrollRunId: cycle.payrollRunId,
      status: cycle.status,
      reviewRound: cycle.reviewRound,
      submissionNumber: cycle.submissionNumber,
      createdAt: cycle.createdAt,
      approvalStageIds: cycle.approvalStages.map((stage) => stage.id),
      decisions: cycle.decisions.map((decision) => ({
        approvalStageId: decision.approvalStageId,
        submissionNumber: decision.submissionNumber,
        reviewRound: decision.reviewRound,
        decision: decision.decision,
        invalidated: decision.invalidation !== null,
      })),
      openBlockingFindings: cycle.findings.length,
      closedEventRound: this.readRound(latestClose?.metadata),
      reopenedAfterClose: Boolean(
        latestClose && latestReopen && latestReopen.occurredAt >= latestClose.occurredAt,
      ),
    };
  }

  private readRound(metadata: Prisma.JsonValue | undefined): number | null {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
    const round = metadata.round;
    return typeof round === 'number' && Number.isInteger(round) ? round : null;
  }
}

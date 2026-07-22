export const PAYROLL_PERIOD_READINESS_BLOCKER_CODES = [
  'PERIOD_ALREADY_CLOSED',
  'CLOSURE_IN_PROGRESS',
  'PAYROLL_RUN_NOT_FOUND',
  'PAYROLL_RUN_NOT_COMPLETED',
  'PAYROLL_RUN_NOT_CANONICAL',
  'PAYROLL_RUN_CANCELLED_OR_INVALIDATED',
  'PAYROLL_RUN_AMBIGUOUS',
  'REVIEW_CYCLE_NOT_FOUND',
  'REVIEW_CYCLE_RUN_MISMATCH',
  'REVIEW_CYCLE_NOT_CLOSED',
  'REVIEW_ROUND_OUTDATED',
  'REVIEW_DECISIONS_INVALID',
  'OPEN_BLOCKING_FINDINGS',
  'COMPANY_PERIOD_RUN_REVIEW_MISMATCH',
  'REQUIRED_TOTALS_UNAVAILABLE',
  'CONCURRENT_OPERATION_DETECTED',
] as const;

export const PAYROLL_PERIOD_READINESS_WARNING_CODES = [
  'VARIABLE_PAY_PENDING',
  'EXTERNAL_INTEGRATIONS_PENDING',
  'NON_CRITICAL_OPERATIONAL_ALERTS',
  'AUXILIARY_INFORMATION_INCOMPLETE',
] as const;

export type PayrollPeriodReadinessBlockerCode =
  (typeof PAYROLL_PERIOD_READINESS_BLOCKER_CODES)[number];
export type PayrollPeriodReadinessWarningCode =
  (typeof PAYROLL_PERIOD_READINESS_WARNING_CODES)[number];
export type ReadinessMetadata = Readonly<Record<string, string | number | boolean>>;

export interface PayrollPeriodReadinessBlocker {
  readonly code: PayrollPeriodReadinessBlockerCode;
  readonly category: 'PERIOD' | 'RUN' | 'REVIEW' | 'CALCULATION' | 'CONCURRENCY';
  readonly message: string;
  readonly severity: 'BLOCKING';
  readonly source: 'PAYROLL_PERIOD' | 'PAYROLL_RUN' | 'PAYROLL_REVIEW';
  readonly relatedEntityType?: 'PayrollPeriod' | 'PayrollRun' | 'PayrollReviewCycle';
  readonly relatedEntityId?: string;
  readonly metadata?: ReadinessMetadata;
}

export interface PayrollPeriodReadinessWarning {
  readonly code: PayrollPeriodReadinessWarningCode;
  readonly category: 'VARIABLE_PAY' | 'INTEGRATION' | 'OPERATIONAL' | 'AUXILIARY_DATA';
  readonly message: string;
  readonly acknowledgementRequired: boolean;
  readonly source: 'VARIABLE_COMPENSATION' | 'PAYROLL_RUN';
  readonly relatedEntityType?: 'PayrollPeriod' | 'PayrollRun';
  readonly relatedEntityId?: string;
  readonly metadata?: ReadinessMetadata;
}

export interface PayrollReviewDecisionSnapshot {
  readonly approvalStageId: string;
  readonly submissionNumber: number;
  readonly reviewRound: number;
  readonly decision: 'APPROVED' | 'REJECTED';
  readonly invalidated: boolean;
}

export interface PayrollReviewCycleReadinessSnapshot {
  readonly id: string;
  readonly companyId: string;
  readonly payrollRunId: string;
  readonly status: string;
  readonly reviewRound: number;
  readonly submissionNumber: number;
  readonly createdAt: Date;
  readonly approvalStageIds: readonly string[];
  readonly decisions: readonly PayrollReviewDecisionSnapshot[];
  readonly openBlockingFindings: number;
  readonly closedEventRound: number | null;
  readonly reopenedAfterClose: boolean;
}

export interface PayrollRunReadinessSnapshot {
  readonly id: string;
  readonly companyId: string;
  readonly payrollPeriodId: string;
  readonly sequence: number;
  readonly status: string;
  readonly completedAt: Date | null;
  readonly engineVersion: string;
  readonly parameterVersion: string | null;
  readonly openBlockingErrors: number;
  readonly operationalWarnings: number;
  readonly hasRequiredTotals: boolean;
  readonly reviewCycles: readonly PayrollReviewCycleReadinessSnapshot[];
}

export interface PayrollPeriodReadinessSnapshot {
  readonly id: string;
  readonly companyId: string;
  readonly referenceDate: Date;
  readonly status: string;
  readonly updatedAt: Date;
  readonly runs: readonly PayrollRunReadinessSnapshot[];
  readonly pendingVariablePayItems: number;
}

export interface PayrollPeriodReadinessEvaluation {
  readonly selectedRun: PayrollRunReadinessSnapshot | null;
  readonly linkedReviewCycle: PayrollReviewCycleReadinessSnapshot | null;
  readonly blockers: readonly PayrollPeriodReadinessBlocker[];
  readonly warnings: readonly PayrollPeriodReadinessWarning[];
}

export class PayrollPeriodClosureReadinessPolicy {
  evaluate(
    snapshot: PayrollPeriodReadinessSnapshot,
    requestedPayrollRunId?: string,
  ): PayrollPeriodReadinessEvaluation {
    const blockers: PayrollPeriodReadinessBlocker[] = [];
    const warnings: PayrollPeriodReadinessWarning[] = [];
    const selectedRun = this.selectRun(snapshot, requestedPayrollRunId, blockers);

    if (snapshot.status === 'CLOSED') {
      blockers.push(
        this.blocker(
          'PERIOD_ALREADY_CLOSED',
          'PERIOD',
          'A competência já está fechada.',
          'PAYROLL_PERIOD',
          'PayrollPeriod',
          snapshot.id,
        ),
      );
    }

    if (snapshot.runs.some((run) => run.status === 'RUNNING')) {
      blockers.push(
        this.blocker(
          'CONCURRENT_OPERATION_DETECTED',
          'CONCURRENCY',
          'Existe execução de folha em andamento para a competência.',
          'PAYROLL_RUN',
          'PayrollPeriod',
          snapshot.id,
        ),
      );
    }

    const linkedReviewCycle = selectedRun
      ? this.evaluateRunAndReview(snapshot, selectedRun, blockers, warnings)
      : null;

    if (snapshot.pendingVariablePayItems > 0) {
      warnings.push({
        code: 'VARIABLE_PAY_PENDING',
        category: 'VARIABLE_PAY',
        message: 'Existem itens de remuneração variável pendentes na competência.',
        acknowledgementRequired: true,
        source: 'VARIABLE_COMPENSATION',
        relatedEntityType: 'PayrollPeriod',
        relatedEntityId: snapshot.id,
        metadata: { pendingItems: snapshot.pendingVariablePayItems },
      });
    }

    return { selectedRun, linkedReviewCycle, blockers, warnings };
  }

  private selectRun(
    snapshot: PayrollPeriodReadinessSnapshot,
    requestedPayrollRunId: string | undefined,
    blockers: PayrollPeriodReadinessBlocker[],
  ): PayrollRunReadinessSnapshot | null {
    if (requestedPayrollRunId) {
      const requested = snapshot.runs.find((run) => run.id === requestedPayrollRunId);
      if (!requested) {
        blockers.push(
          this.blocker(
            'PAYROLL_RUN_NOT_FOUND',
            'RUN',
            'A execução selecionada não foi encontrada na competência e empresa ativas.',
            'PAYROLL_RUN',
            'PayrollRun',
            requestedPayrollRunId,
          ),
        );
        return null;
      }
      return requested;
    }

    if (snapshot.runs.length === 0) {
      blockers.push(
        this.blocker(
          'PAYROLL_RUN_NOT_FOUND',
          'RUN',
          'A competência não possui execução de folha para avaliação.',
          'PAYROLL_RUN',
          'PayrollPeriod',
          snapshot.id,
        ),
      );
      return null;
    }

    const completedRuns = snapshot.runs.filter((run) => run.status === 'COMPLETED');
    const candidatePool = completedRuns.length > 0 ? completedRuns : snapshot.runs;
    const highestSequence = Math.max(...candidatePool.map((run) => run.sequence));
    const highestRuns = candidatePool.filter((run) => run.sequence === highestSequence);
    if (highestRuns.length !== 1) {
      blockers.push(
        this.blocker(
          'PAYROLL_RUN_AMBIGUOUS',
          'RUN',
          'Não existe uma única execução canônica para avaliação.',
          'PAYROLL_RUN',
          'PayrollPeriod',
          snapshot.id,
          { candidateCount: highestRuns.length, sequence: highestSequence },
        ),
      );
      return null;
    }
    return highestRuns[0]!;
  }

  private evaluateRunAndReview(
    snapshot: PayrollPeriodReadinessSnapshot,
    run: PayrollRunReadinessSnapshot,
    blockers: PayrollPeriodReadinessBlocker[],
    warnings: PayrollPeriodReadinessWarning[],
  ): PayrollReviewCycleReadinessSnapshot | null {
    if (run.companyId !== snapshot.companyId || run.payrollPeriodId !== snapshot.id) {
      blockers.push(
        this.blocker(
          'COMPANY_PERIOD_RUN_REVIEW_MISMATCH',
          'RUN',
          'A execução não corresponde à empresa e competência avaliadas.',
          'PAYROLL_RUN',
          'PayrollRun',
          run.id,
        ),
      );
    }

    if (run.status === 'CANCELLED' || run.status === 'INVALIDATED') {
      blockers.push(
        this.blocker(
          'PAYROLL_RUN_CANCELLED_OR_INVALIDATED',
          'RUN',
          'A execução selecionada está cancelada ou invalidada.',
          'PAYROLL_RUN',
          'PayrollRun',
          run.id,
        ),
      );
    } else if (run.status !== 'COMPLETED') {
      blockers.push(
        this.blocker(
          'PAYROLL_RUN_NOT_COMPLETED',
          'RUN',
          'A execução selecionada não está concluída.',
          'PAYROLL_RUN',
          'PayrollRun',
          run.id,
          { status: run.status },
        ),
      );
    }

    const laterCompletedRuns = snapshot.runs.filter(
      (candidate) => candidate.sequence > run.sequence && candidate.status === 'COMPLETED',
    );
    if (laterCompletedRuns.length > 0) {
      blockers.push(
        this.blocker(
          'PAYROLL_RUN_NOT_CANONICAL',
          'RUN',
          'Existe execução concluída posterior à execução selecionada.',
          'PAYROLL_RUN',
          'PayrollRun',
          run.id,
          { latestCompletedSequence: Math.max(...laterCompletedRuns.map((item) => item.sequence)) },
        ),
      );
    }

    if (run.openBlockingErrors > 0) {
      blockers.push(
        this.blocker(
          'PAYROLL_RUN_NOT_COMPLETED',
          'CALCULATION',
          'A execução possui erros técnicos bloqueantes abertos.',
          'PAYROLL_RUN',
          'PayrollRun',
          run.id,
          { blockingErrors: run.openBlockingErrors },
        ),
      );
    }

    if (!run.hasRequiredTotals) {
      blockers.push(
        this.blocker(
          'REQUIRED_TOTALS_UNAVAILABLE',
          'CALCULATION',
          'Os totais obrigatórios da execução não estão disponíveis.',
          'PAYROLL_RUN',
          'PayrollRun',
          run.id,
        ),
      );
    }

    if (run.operationalWarnings > 0) {
      warnings.push({
        code: 'NON_CRITICAL_OPERATIONAL_ALERTS',
        category: 'OPERATIONAL',
        message: 'A execução possui alertas operacionais não críticos.',
        acknowledgementRequired: false,
        source: 'PAYROLL_RUN',
        relatedEntityType: 'PayrollRun',
        relatedEntityId: run.id,
        metadata: { warningCount: run.operationalWarnings },
      });
    }

    if (!run.parameterVersion) {
      warnings.push({
        code: 'AUXILIARY_INFORMATION_INCOMPLETE',
        category: 'AUXILIARY_DATA',
        message: 'A execução não informa versão de parâmetros.',
        acknowledgementRequired: false,
        source: 'PAYROLL_RUN',
        relatedEntityType: 'PayrollRun',
        relatedEntityId: run.id,
        metadata: { missingParameterVersion: true },
      });
    }

    return this.evaluateReview(snapshot, run, blockers);
  }

  private evaluateReview(
    snapshot: PayrollPeriodReadinessSnapshot,
    run: PayrollRunReadinessSnapshot,
    blockers: PayrollPeriodReadinessBlocker[],
  ): PayrollReviewCycleReadinessSnapshot | null {
    if (run.reviewCycles.length === 0) {
      blockers.push(
        this.blocker(
          'REVIEW_CYCLE_NOT_FOUND',
          'REVIEW',
          'A execução selecionada não possui ciclo de conferência.',
          'PAYROLL_REVIEW',
          'PayrollRun',
          run.id,
        ),
      );
      return null;
    }

    const review = [...run.reviewCycles].sort(
      (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
    )[0]!;
    if (review.payrollRunId !== run.id) {
      blockers.push(
        this.blocker(
          'REVIEW_CYCLE_RUN_MISMATCH',
          'REVIEW',
          'O ciclo de conferência não pertence à execução selecionada.',
          'PAYROLL_REVIEW',
          'PayrollReviewCycle',
          review.id,
        ),
      );
    }
    if (review.companyId !== snapshot.companyId) {
      blockers.push(
        this.blocker(
          'COMPANY_PERIOD_RUN_REVIEW_MISMATCH',
          'REVIEW',
          'O ciclo de conferência não pertence à empresa avaliada.',
          'PAYROLL_REVIEW',
          'PayrollReviewCycle',
          review.id,
        ),
      );
    }
    if (review.status !== 'CLOSED') {
      blockers.push(
        this.blocker(
          'REVIEW_CYCLE_NOT_CLOSED',
          'REVIEW',
          'O ciclo de conferência não está fechado.',
          'PAYROLL_REVIEW',
          'PayrollReviewCycle',
          review.id,
          { status: review.status },
        ),
      );
    }
    if (review.closedEventRound !== review.reviewRound || review.reopenedAfterClose) {
      blockers.push(
        this.blocker(
          'REVIEW_ROUND_OUTDATED',
          'REVIEW',
          'A rodada fechada do ciclo não corresponde à rodada vigente.',
          'PAYROLL_REVIEW',
          'PayrollReviewCycle',
          review.id,
          { currentRound: review.reviewRound, closedEventRound: review.closedEventRound ?? 0 },
        ),
      );
    }

    const validApprovalStageIds = new Set(
      review.decisions
        .filter(
          (decision) =>
            decision.reviewRound === review.reviewRound &&
            decision.submissionNumber === review.submissionNumber &&
            decision.decision === 'APPROVED' &&
            !decision.invalidated,
        )
        .map((decision) => decision.approvalStageId),
    );
    const decisionsValid =
      review.approvalStageIds.length > 0 &&
      review.approvalStageIds.every((stageId) => validApprovalStageIds.has(stageId));
    if (!decisionsValid) {
      blockers.push(
        this.blocker(
          'REVIEW_DECISIONS_INVALID',
          'REVIEW',
          'O ciclo não possui todas as decisões finais válidas para a rodada vigente.',
          'PAYROLL_REVIEW',
          'PayrollReviewCycle',
          review.id,
          {
            requiredStages: review.approvalStageIds.length,
            validStages: validApprovalStageIds.size,
          },
        ),
      );
    }
    if (review.openBlockingFindings > 0) {
      blockers.push(
        this.blocker(
          'OPEN_BLOCKING_FINDINGS',
          'REVIEW',
          'O ciclo possui achados bloqueantes abertos.',
          'PAYROLL_REVIEW',
          'PayrollReviewCycle',
          review.id,
          { openBlockingFindings: review.openBlockingFindings },
        ),
      );
    }
    return review;
  }

  private blocker(
    code: PayrollPeriodReadinessBlockerCode,
    category: PayrollPeriodReadinessBlocker['category'],
    message: string,
    source: PayrollPeriodReadinessBlocker['source'],
    relatedEntityType?: PayrollPeriodReadinessBlocker['relatedEntityType'],
    relatedEntityId?: string,
    metadata?: ReadinessMetadata,
  ): PayrollPeriodReadinessBlocker {
    return {
      code,
      category,
      message,
      severity: 'BLOCKING',
      source,
      ...(relatedEntityType ? { relatedEntityType } : {}),
      ...(relatedEntityId ? { relatedEntityId } : {}),
      ...(metadata ? { metadata } : {}),
    };
  }
}

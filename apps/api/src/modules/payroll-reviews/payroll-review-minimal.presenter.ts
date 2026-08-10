import type {
  PayrollReviewCycleStatus,
  PayrollReviewDecisionType,
  PayrollReviewEventType,
  PayrollReviewFindingSeverity,
  PayrollReviewFindingStatus,
  Prisma,
} from '@prisma/client';

type CycleSource = {
  id: string;
  payrollRunId: string;
  status: PayrollReviewCycleStatus;
  createdAt: Date;
  submissionNumber: number;
  currentApprovalStage: number;
  reviewRound: number;
};

type FindingSource = {
  id: string;
  reviewCycleId: string;
  payrollRunId: string;
  severity: PayrollReviewFindingSeverity;
  status: PayrollReviewFindingStatus;
  code: string;
  createdAt: Date;
  resolvedAt: Date | null;
};

type EventSource = {
  id: string;
  findingId: string | null;
  eventType: PayrollReviewEventType;
  previousState: Prisma.JsonValue | null;
  nextState: Prisma.JsonValue;
  occurredAt: Date;
};

function presentPayrollReviewEventState(source: Prisma.JsonValue | null) {
  if (!source || typeof source !== 'object' || Array.isArray(source))
    return source === null ? null : {};
  const state: {
    status?: string;
    severity?: string;
    blocking?: boolean;
    validApprovals?: number;
  } = {};
  if (typeof source.status === 'string') state.status = source.status;
  if (typeof source.severity === 'string') state.severity = source.severity;
  if (typeof source.blocking === 'boolean') state.blocking = source.blocking;
  if (typeof source.validApprovals === 'number') state.validApprovals = source.validApprovals;
  return state;
}

type ApprovalStageSource = {
  id: string;
  sequence: number;
  code: string;
  requiredCapability: string;
  createdAt: Date;
};

type DecisionSource = {
  id: string;
  approvalStageId: string;
  submissionNumber: number;
  reviewRound: number;
  decision: PayrollReviewDecisionType;
  occurredAt: Date;
};

type InvalidationSource = {
  id: string;
  decisionId: string;
  causedByEventId: string;
  reviewRound: number;
  invalidatedAt: Date;
};

export function presentPayrollReviewCycle(source: CycleSource) {
  return {
    id: source.id,
    payrollRunId: source.payrollRunId,
    status: source.status,
    createdAt: source.createdAt.toISOString(),
    submissionNumber: source.submissionNumber,
    currentApprovalStage: source.currentApprovalStage,
    reviewRound: source.reviewRound,
  };
}

export function presentPayrollReviewFinding(source: FindingSource) {
  return {
    id: source.id,
    reviewCycleId: source.reviewCycleId,
    payrollRunId: source.payrollRunId,
    severity: source.severity,
    status: source.status,
    code: source.code,
    createdAt: source.createdAt.toISOString(),
    resolvedAt: source.resolvedAt?.toISOString() ?? null,
  };
}

export function presentPayrollReviewEvent(source: EventSource) {
  return {
    id: source.id,
    ...(source.findingId ? { findingId: source.findingId } : {}),
    eventType: source.eventType,
    previousState: presentPayrollReviewEventState(source.previousState),
    nextState: presentPayrollReviewEventState(source.nextState),
    occurredAt: source.occurredAt.toISOString(),
  };
}

export function presentPayrollReviewApprovalStage(source: ApprovalStageSource) {
  return {
    id: source.id,
    sequence: source.sequence,
    code: source.code,
    requiredCapability: source.requiredCapability,
    createdAt: source.createdAt.toISOString(),
  };
}

export function presentPayrollReviewDecision(source: DecisionSource) {
  return {
    id: source.id,
    approvalStageId: source.approvalStageId,
    submissionNumber: source.submissionNumber,
    reviewRound: source.reviewRound,
    decision: source.decision,
    occurredAt: source.occurredAt.toISOString(),
  };
}

export function presentPayrollReviewInvalidation(source: InvalidationSource) {
  return {
    id: source.id,
    decisionId: source.decisionId,
    causedByEventId: source.causedByEventId,
    reviewRound: source.reviewRound,
    invalidatedAt: source.invalidatedAt.toISOString(),
  };
}

type ReviewDetailsSource = CycleSource & {
  findings: readonly FindingSource[];
  events: readonly EventSource[];
  approvalStages: readonly ApprovalStageSource[];
  decisions: readonly DecisionSource[];
};

export function presentPayrollReviewDetails(source: ReviewDetailsSource) {
  return {
    ...presentPayrollReviewCycle(source),
    findings: source.findings.map(presentPayrollReviewFinding),
    events: source.events.map(presentPayrollReviewEvent),
    approvalStages: source.approvalStages.map(presentPayrollReviewApprovalStage),
    decisions: source.decisions.map(presentPayrollReviewDecision),
  };
}

type ReviewHistorySource = ReviewDetailsSource & {
  invalidations: readonly InvalidationSource[];
};

export function presentPayrollReviewHistory(source: ReviewHistorySource) {
  const timeline = source.events.map(presentPayrollReviewEvent);
  return {
    currentState: source.status,
    timeline,
    findings: source.findings.map(presentPayrollReviewFinding),
    approvalStages: source.approvalStages.map(presentPayrollReviewApprovalStage),
    decisions: source.decisions.map(presentPayrollReviewDecision),
    invalidations: source.invalidations.map(presentPayrollReviewInvalidation),
  };
}

export const PAYROLL_REVIEW_CYCLE_STATUSES = [
  'OPEN',
  'IN_REVIEW',
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
] as const;

export type PayrollReviewCycleStatus = (typeof PAYROLL_REVIEW_CYCLE_STATUSES)[number];

export class PayrollReviewWorkflowInvariantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PayrollReviewWorkflowInvariantError';
  }
}

export class PayrollReviewWorkflowFoundation {
  start(status: PayrollReviewCycleStatus): 'IN_REVIEW' {
    if (status !== 'OPEN' && status !== 'REJECTED') {
      throw new PayrollReviewWorkflowInvariantError('Review can only start from OPEN or REJECTED');
    }
    return 'IN_REVIEW';
  }

  submit(status: PayrollReviewCycleStatus, openBlockingFindings: number): 'SUBMITTED' {
    if (status !== 'IN_REVIEW') {
      throw new PayrollReviewWorkflowInvariantError('Review can only be submitted from IN_REVIEW');
    }
    if (openBlockingFindings > 0) {
      throw new PayrollReviewWorkflowInvariantError('Open blocking findings prevent submission');
    }
    return 'SUBMITTED';
  }

  approve(status: PayrollReviewCycleStatus, isFinalStage: boolean): PayrollReviewCycleStatus {
    if (status !== 'SUBMITTED') {
      throw new PayrollReviewWorkflowInvariantError('Review can only be approved from SUBMITTED');
    }
    return isFinalStage ? 'APPROVED' : 'SUBMITTED';
  }

  reject(status: PayrollReviewCycleStatus, reason: string): 'REJECTED' {
    if (status !== 'SUBMITTED') {
      throw new PayrollReviewWorkflowInvariantError('Review can only be rejected from SUBMITTED');
    }
    if (!reason.trim()) {
      throw new PayrollReviewWorkflowInvariantError('Rejection reason is required');
    }
    return 'REJECTED';
  }
}

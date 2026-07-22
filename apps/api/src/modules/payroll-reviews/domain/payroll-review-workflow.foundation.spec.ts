import {
  PayrollReviewWorkflowFoundation,
  PayrollReviewWorkflowInvariantError,
  type PayrollReviewCycleStatus,
} from './payroll-review-workflow.foundation';

describe('PayrollReviewWorkflowFoundation', () => {
  const workflow = new PayrollReviewWorkflowFoundation();

  it('accepts the complete approval and rejection/resubmission flows', () => {
    expect(workflow.start('OPEN')).toBe('IN_REVIEW');
    expect(workflow.submit('IN_REVIEW', 0)).toBe('SUBMITTED');
    expect(workflow.approve('SUBMITTED', false)).toBe('SUBMITTED');
    expect(workflow.approve('SUBMITTED', true)).toBe('APPROVED');
    expect(workflow.reject('SUBMITTED', 'Correction required')).toBe('REJECTED');
    expect(workflow.start('REJECTED')).toBe('IN_REVIEW');
  });

  it.each([
    ['start', 'IN_REVIEW'],
    ['start', 'SUBMITTED'],
    ['start', 'APPROVED'],
    ['submit', 'OPEN'],
    ['submit', 'SUBMITTED'],
    ['submit', 'APPROVED'],
    ['approve', 'OPEN'],
    ['approve', 'IN_REVIEW'],
    ['approve', 'APPROVED'],
    ['reject', 'OPEN'],
    ['reject', 'IN_REVIEW'],
    ['reject', 'APPROVED'],
  ] as const)('rejects invalid %s transition from %s', (operation, status) => {
    const execute = () => {
      if (operation === 'start') workflow.start(status);
      if (operation === 'submit') workflow.submit(status, 0);
      if (operation === 'approve') workflow.approve(status, false);
      if (operation === 'reject') workflow.reject(status, 'Reason');
    };
    expect(execute).toThrow(PayrollReviewWorkflowInvariantError);
  });

  it('blocks submission with an open BLOCKING finding and blank rejection reason', () => {
    expect(() => workflow.submit('IN_REVIEW', 1)).toThrow(
      new PayrollReviewWorkflowInvariantError('Open blocking findings prevent submission'),
    );
    expect(() => workflow.reject('SUBMITTED', '  ')).toThrow(
      new PayrollReviewWorkflowInvariantError('Rejection reason is required'),
    );
  });

  it('never exposes unsupported states', () => {
    const statuses: readonly PayrollReviewCycleStatus[] = [
      'OPEN',
      'IN_REVIEW',
      'SUBMITTED',
      'APPROVED',
      'REJECTED',
    ];
    expect(statuses).not.toContain('CLOSED');
    expect(statuses).not.toContain('REOPENED');
  });
});

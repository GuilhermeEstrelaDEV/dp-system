import {
  PAYROLL_PERIOD_READINESS_BLOCKER_CODES,
  PAYROLL_PERIOD_READINESS_WARNING_CODES,
  PayrollPeriodClosureReadinessPolicy,
  type PayrollPeriodReadinessSnapshot,
  type PayrollReviewCycleReadinessSnapshot,
  type PayrollRunReadinessSnapshot,
} from './payroll-period-closure-readiness';

const companyId = '00000000-0000-4000-8000-000000000001';
const periodId = '00000000-0000-4000-8000-000000000002';
const runId = '00000000-0000-4000-8000-000000000003';
const reviewId = '00000000-0000-4000-8000-000000000004';

function review(
  overrides: Partial<PayrollReviewCycleReadinessSnapshot> = {},
): PayrollReviewCycleReadinessSnapshot {
  return {
    id: reviewId,
    companyId,
    payrollRunId: runId,
    status: 'CLOSED',
    reviewRound: 1,
    submissionNumber: 1,
    createdAt: new Date('2026-07-20T10:00:00.000Z'),
    approvalStageIds: ['stage-1', 'stage-2'],
    decisions: [
      {
        approvalStageId: 'stage-1',
        submissionNumber: 1,
        reviewRound: 1,
        decision: 'APPROVED',
        invalidated: false,
      },
      {
        approvalStageId: 'stage-2',
        submissionNumber: 1,
        reviewRound: 1,
        decision: 'APPROVED',
        invalidated: false,
      },
    ],
    openBlockingFindings: 0,
    closedEventRound: 1,
    reopenedAfterClose: false,
    ...overrides,
  };
}

function run(overrides: Partial<PayrollRunReadinessSnapshot> = {}): PayrollRunReadinessSnapshot {
  return {
    id: runId,
    companyId,
    payrollPeriodId: periodId,
    sequence: 1,
    status: 'COMPLETED',
    completedAt: new Date('2026-07-20T09:00:00.000Z'),
    engineVersion: 'engine-v1',
    parameterVersion: 'parameters-v1',
    openBlockingErrors: 0,
    operationalWarnings: 0,
    hasRequiredTotals: true,
    reviewCycles: [review()],
    ...overrides,
  };
}

function snapshot(
  overrides: Partial<PayrollPeriodReadinessSnapshot> = {},
): PayrollPeriodReadinessSnapshot {
  return {
    id: periodId,
    companyId,
    referenceDate: new Date('2026-07-01T00:00:00.000Z'),
    status: 'OPEN',
    updatedAt: new Date('2026-07-20T11:00:00.000Z'),
    runs: [run()],
    pendingVariablePayItems: 0,
    ...overrides,
  };
}

function codes(result: ReturnType<PayrollPeriodClosureReadinessPolicy['evaluate']>) {
  return result.blockers.map((blocker) => blocker.code);
}

describe('PayrollPeriodClosureReadinessPolicy', () => {
  const policy = new PayrollPeriodClosureReadinessPolicy();

  it('returns a ready result for the unique canonical run and closed valid review', () => {
    const result = policy.evaluate(snapshot());
    expect(result.blockers).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.selectedRun?.id).toBe(runId);
    expect(result.linkedReviewCycle?.id).toBe(reviewId);
  });

  it('publishes the complete stable blocker and warning code catalogs', () => {
    expect(PAYROLL_PERIOD_READINESS_BLOCKER_CODES).toHaveLength(16);
    expect(PAYROLL_PERIOD_READINESS_WARNING_CODES).toEqual([
      'VARIABLE_PAY_PENDING',
      'EXTERNAL_INTEGRATIONS_PENDING',
      'NON_CRITICAL_OPERATIONAL_ALERTS',
      'AUXILIARY_INFORMATION_INCOMPLETE',
    ]);
  });

  it('blocks a closed period and a period without runs', () => {
    expect(codes(policy.evaluate(snapshot({ status: 'CLOSED', runs: [] })))).toEqual([
      'PAYROLL_RUN_NOT_FOUND',
      'PERIOD_ALREADY_CLOSED',
    ]);
  });

  it('returns PAYROLL_RUN_NOT_FOUND for an explicit run outside the scoped period', () => {
    expect(codes(policy.evaluate(snapshot(), '00000000-0000-4000-8000-000000000099'))).toContain(
      'PAYROLL_RUN_NOT_FOUND',
    );
  });

  it('blocks ambiguous highest completed runs', () => {
    const duplicate = run({ id: '00000000-0000-4000-8000-000000000005' });
    expect(codes(policy.evaluate(snapshot({ runs: [run(), duplicate] })))).toEqual([
      'PAYROLL_RUN_AMBIGUOUS',
    ]);
  });

  it('blocks a non-completed, cancelled or invalidated run', () => {
    expect(codes(policy.evaluate(snapshot({ runs: [run({ status: 'FAILED' })] })))).toContain(
      'PAYROLL_RUN_NOT_COMPLETED',
    );
    expect(codes(policy.evaluate(snapshot({ runs: [run({ status: 'INVALIDATED' })] })))).toContain(
      'PAYROLL_RUN_CANCELLED_OR_INVALIDATED',
    );
  });

  it('blocks an explicitly selected old run when a later completed run exists', () => {
    const newer = run({
      id: '00000000-0000-4000-8000-000000000005',
      sequence: 2,
      reviewCycles: [],
    });
    const result = policy.evaluate(snapshot({ runs: [run(), newer] }), runId);
    expect(codes(result)).toContain('PAYROLL_RUN_NOT_CANONICAL');
  });

  it('detects a visible concurrent execution without locks or mutations', () => {
    const running = run({
      id: '00000000-0000-4000-8000-000000000005',
      sequence: 2,
      status: 'RUNNING',
      reviewCycles: [],
    });
    expect(codes(policy.evaluate(snapshot({ runs: [run(), running] })))).toContain(
      'CONCURRENT_OPERATION_DETECTED',
    );
  });

  it('blocks missing totals and open technical errors', () => {
    const result = policy.evaluate(
      snapshot({ runs: [run({ hasRequiredTotals: false, openBlockingErrors: 2 })] }),
    );
    expect(codes(result)).toEqual(
      expect.arrayContaining(['PAYROLL_RUN_NOT_COMPLETED', 'REQUIRED_TOTALS_UNAVAILABLE']),
    );
  });

  it('blocks a missing, mismatched or non-closed review', () => {
    expect(codes(policy.evaluate(snapshot({ runs: [run({ reviewCycles: [] })] })))).toContain(
      'REVIEW_CYCLE_NOT_FOUND',
    );
    expect(
      codes(
        policy.evaluate(
          snapshot({
            runs: [
              run({
                reviewCycles: [
                  review({
                    payrollRunId: '00000000-0000-4000-8000-000000000099',
                    status: 'APPROVED',
                  }),
                ],
              }),
            ],
          }),
        ),
      ),
    ).toEqual(expect.arrayContaining(['REVIEW_CYCLE_RUN_MISMATCH', 'REVIEW_CYCLE_NOT_CLOSED']));
  });

  it('blocks company scope mismatch between period, run and review', () => {
    const otherCompany = '00000000-0000-4000-8000-000000000099';
    const result = policy.evaluate(
      snapshot({
        runs: [
          run({ companyId: otherCompany, reviewCycles: [review({ companyId: otherCompany })] }),
        ],
      }),
    );
    expect(codes(result)).toContain('COMPANY_PERIOD_RUN_REVIEW_MISMATCH');
  });

  it('blocks an outdated round or reopen after the last close', () => {
    const result = policy.evaluate(
      snapshot({
        runs: [run({ reviewCycles: [review({ closedEventRound: 0, reopenedAfterClose: true })] })],
      }),
    );
    expect(codes(result)).toContain('REVIEW_ROUND_OUTDATED');
  });

  it('blocks invalid decisions and open blocking findings', () => {
    const invalidReview = review({
      decisions: [
        {
          approvalStageId: 'stage-1',
          submissionNumber: 1,
          reviewRound: 1,
          decision: 'APPROVED',
          invalidated: true,
        },
      ],
      openBlockingFindings: 1,
    });
    const result = policy.evaluate(snapshot({ runs: [run({ reviewCycles: [invalidReview] })] }));
    expect(codes(result)).toEqual(
      expect.arrayContaining(['REVIEW_DECISIONS_INVALID', 'OPEN_BLOCKING_FINDINGS']),
    );
  });

  it('emits real warnings without turning variable pay into a blocker', () => {
    const result = policy.evaluate(
      snapshot({
        pendingVariablePayItems: 3,
        runs: [run({ operationalWarnings: 2, parameterVersion: null })],
      }),
    );
    expect(result.blockers).toEqual([]);
    expect(result.warnings.map((warning) => warning.code)).toEqual([
      'NON_CRITICAL_OPERATIONAL_ALERTS',
      'AUXILIARY_INFORMATION_INCOMPLETE',
      'VARIABLE_PAY_PENDING',
    ]);
    expect(result.warnings.at(-1)?.acknowledgementRequired).toBe(true);
  });

  it('does not mutate the supplied snapshot', () => {
    const input = snapshot();
    const originalRuns = input.runs;
    const originalReviews = input.runs[0]!.reviewCycles;
    policy.evaluate(input);
    expect(input.runs).toBe(originalRuns);
    expect(input.runs[0]!.reviewCycles).toBe(originalReviews);
  });
});

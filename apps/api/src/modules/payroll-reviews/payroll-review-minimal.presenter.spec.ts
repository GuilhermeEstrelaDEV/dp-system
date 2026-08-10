import {
  presentPayrollReviewCycle,
  presentPayrollReviewEvent,
  presentPayrollReviewFinding,
} from './payroll-review-minimal.presenter';

describe('payroll review approved minimal presenter', () => {
  it('omits identities, trace and free text from cycles and findings', () => {
    const createdAt = new Date('2026-08-08T12:00:00.000Z');
    const cycleSource = {
      id: 'cycle',
      payrollRunId: 'run',
      status: 'OPEN' as const,
      createdAt,
      submissionNumber: 0,
      currentApprovalStage: 0,
      reviewRound: 1,
      companyId: 'company',
      createdBy: 'actor',
      traceId: 'trace',
    };
    const cycle = presentPayrollReviewCycle(cycleSource);
    const findingSource = {
      id: 'finding',
      reviewCycleId: 'cycle',
      payrollRunId: 'run',
      employmentContractId: 'contract-blocked',
      payrollCalculationItemId: 'item-blocked',
      severity: 'BLOCKING' as const,
      status: 'OPEN' as const,
      code: 'BLOCK',
      createdAt,
      resolvedAt: null,
      title: 'blocked title',
      description: 'blocked description',
      createdBy: 'actor',
      traceId: 'trace',
    };
    const finding = presentPayrollReviewFinding(findingSource);
    expect(cycle).not.toHaveProperty('companyId');
    expect(cycle).not.toHaveProperty('createdBy');
    expect(cycle).not.toHaveProperty('traceId');
    expect(finding).not.toHaveProperty('title');
    expect(finding).not.toHaveProperty('description');
    expect(finding).not.toHaveProperty('createdBy');
    expect(finding).not.toHaveProperty('traceId');
    expect(finding).not.toHaveProperty('employmentContractId');
    expect(finding).not.toHaveProperty('payrollCalculationItemId');
  });

  it('omits event actor, reason, trace, metadata and review-cycle reference', () => {
    const source = {
      id: 'event',
      reviewCycleId: 'cycle',
      findingId: 'finding',
      eventType: 'FINDING_RESOLVED' as const,
      previousState: { status: 'OPEN', reason: 'private', actorId: 'actor' },
      nextState: { status: 'RESOLVED', metadata: { internal: true }, traceId: 'trace' },
      occurredAt: new Date('2026-08-08T12:00:00.000Z'),
      actorId: 'actor',
      traceId: 'trace',
      reason: 'blocked reason',
      metadata: { secret: true },
    };
    const event = presentPayrollReviewEvent(source);
    expect(event).toEqual({
      id: 'event',
      findingId: 'finding',
      eventType: 'FINDING_RESOLVED',
      previousState: { status: 'OPEN' },
      nextState: { status: 'RESOLVED' },
      occurredAt: '2026-08-08T12:00:00.000Z',
    });
  });
});

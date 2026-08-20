import {
  DEMO_CLOSURE_FIXTURE,
  DemoClosureFixtureSnapshot,
  validateDemoClosureFixture,
} from './demo-closure-fixture';

function preparedSnapshot(): DemoClosureFixtureSnapshot {
  return {
    periodStatus: 'OPEN',
    payrollRunStatus: 'COMPLETED',
    employeeCount: DEMO_CLOSURE_FIXTURE.employeeCount,
    reviewStatus: 'CLOSED',
    approvalStageCount: DEMO_CLOSURE_FIXTURE.approvalStageCount,
    approvedDecisionCount: DEMO_CLOSURE_FIXTURE.approvalStageCount,
    invalidatedDecisionCount: 0,
    openBlockingFindingCount: 0,
    closedEventRound: DEMO_CLOSURE_FIXTURE.reviewRound,
    hasLaterReviewReopenedEvent: false,
    closureVersions: [],
  };
}

describe('demo closure fixture', () => {
  it('accepts the prepared fixture without pre-seeded closure artifacts', () => {
    expect(validateDemoClosureFixture(preparedSnapshot())).toBe('PREPARED');
  });

  it('accepts a closure produced by the canonical runtime', () => {
    expect(
      validateDemoClosureFixture({
        ...preparedSnapshot(),
        periodStatus: 'CLOSED',
        closureVersions: [
          {
            version: 1,
            status: 'CLOSED',
            superseded: false,
            manifestCount: 1,
            eventTypes: ['PERIOD_CLOSING_STARTED', 'PERIOD_CLOSED'],
          },
        ],
      }),
    ).toBe('CLOSED');
  });

  it('accepts the canonical successor after controlled reopening', () => {
    expect(
      validateDemoClosureFixture({
        ...preparedSnapshot(),
        closureVersions: [
          {
            version: 1,
            status: 'CLOSED',
            superseded: true,
            manifestCount: 1,
            eventTypes: [
              'PERIOD_CLOSED',
              'PERIOD_REOPENING_STARTED',
              'CLOSURE_EVIDENCE_INVALIDATED',
            ],
          },
          {
            version: 2,
            status: 'OPEN',
            superseded: false,
            manifestCount: 0,
            eventTypes: ['PERIOD_REOPENED'],
          },
        ],
      }),
    ).toBe('REOPENED');
  });

  it.each([
    ['missing employees', { employeeCount: 0 }],
    ['open blocking finding', { openBlockingFindingCount: 1 }],
    ['invalidated approval', { invalidatedDecisionCount: 1 }],
    ['pre-seeded closure artifact', { closureVersions: [], periodStatus: 'CLOSED' }],
  ])('rejects %s', (_caseName, patch) => {
    expect(() => validateDemoClosureFixture({ ...preparedSnapshot(), ...patch })).toThrow(
      'Fixture canônico de fechamento inválido',
    );
  });
});

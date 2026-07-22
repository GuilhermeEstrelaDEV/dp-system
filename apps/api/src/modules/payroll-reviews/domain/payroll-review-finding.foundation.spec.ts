import {
  PayrollReviewFindingFoundation,
  PayrollReviewFindingInvariantError,
  type PayrollReviewFindingChange,
} from './payroll-review-finding.foundation';

describe('PayrollReviewFindingFoundation', () => {
  const foundation = new PayrollReviewFindingFoundation();
  const openedAt = new Date('2026-07-21T12:00:00.000Z');

  function open(): PayrollReviewFindingChange {
    return foundation.open({
      findingId: 'finding-1',
      eventId: 'event-1',
      companyId: 'company-1',
      payrollRunId: 'run-1',
      severity: 'BLOCKING',
      description: 'Configured result requires technical review',
      reference: { employmentContractId: 'contract-1' },
      traceId: 'trace-1',
      occurredAt: openedAt,
    });
  }

  it('opens a neutral finding with its first append-only event', () => {
    expect(open()).toEqual({
      finding: {
        id: 'finding-1',
        companyId: 'company-1',
        payrollRunId: 'run-1',
        severity: 'BLOCKING',
        description: 'Configured result requires technical review',
        reference: { employmentContractId: 'contract-1' },
        status: 'OPEN',
        createdAt: openedAt,
      },
      history: [
        {
          id: 'event-1',
          findingId: 'finding-1',
          companyId: 'company-1',
          type: 'OPENED',
          reason: null,
          traceId: 'trace-1',
          occurredAt: openedAt,
        },
      ],
    });
  });

  it('resolves and reopens findings without mutating prior history', () => {
    const opened = open();
    const resolved = foundation.resolve(opened.finding, opened.history, {
      eventId: 'event-2',
      companyId: 'company-1',
      reason: 'Evidence was reviewed',
      traceId: 'trace-2',
      occurredAt: new Date('2026-07-21T12:10:00.000Z'),
    });
    const reopened = foundation.reopen(resolved.finding, resolved.history, {
      eventId: 'event-3',
      companyId: 'company-1',
      reason: 'New technical evidence was attached',
      traceId: 'trace-3',
      occurredAt: new Date('2026-07-21T12:20:00.000Z'),
    });

    expect(opened.history).toHaveLength(1);
    expect(resolved.finding.status).toBe('RESOLVED');
    expect(resolved.history.map((event) => event.type)).toEqual(['OPENED', 'RESOLVED']);
    expect(reopened.finding.status).toBe('OPEN');
    expect(reopened.history.map((event) => event.type)).toEqual(['OPENED', 'RESOLVED', 'REOPENED']);
  });

  it('rejects a transition from another company', () => {
    const opened = open();
    expect(() =>
      foundation.resolve(opened.finding, opened.history, {
        eventId: 'event-2',
        companyId: 'company-2',
        reason: 'Cross-company attempt',
        traceId: 'trace-2',
        occurredAt: new Date('2026-07-21T12:10:00.000Z'),
      }),
    ).toThrow(new PayrollReviewFindingInvariantError('Finding belongs to another company'));
  });

  it('requires a reason for resolution and reopening', () => {
    const opened = open();
    expect(() =>
      foundation.resolve(opened.finding, opened.history, {
        eventId: 'event-2',
        companyId: 'company-1',
        reason: '  ',
        traceId: 'trace-2',
        occurredAt: new Date('2026-07-21T12:10:00.000Z'),
      }),
    ).toThrow(new PayrollReviewFindingInvariantError('reason is required'));
  });

  it('rejects invalid state transitions without defining approval decisions', () => {
    const opened = open();
    expect(() =>
      foundation.reopen(opened.finding, opened.history, {
        eventId: 'event-2',
        companyId: 'company-1',
        reason: 'Invalid transition',
        traceId: 'trace-2',
        occurredAt: new Date('2026-07-21T12:10:00.000Z'),
      }),
    ).toThrow(new PayrollReviewFindingInvariantError('Finding must be RESOLVED before REOPENED'));
  });

  it('rejects duplicate, foreign and non-chronological history events', () => {
    const opened = open();
    const baseCommand = {
      companyId: 'company-1',
      reason: 'Evidence was reviewed',
      traceId: 'trace-2',
      occurredAt: new Date('2026-07-21T12:10:00.000Z'),
    };

    expect(() =>
      foundation.resolve(opened.finding, opened.history, {
        ...baseCommand,
        eventId: 'event-1',
      }),
    ).toThrow(new PayrollReviewFindingInvariantError('Finding event id must be unique'));
    expect(() =>
      foundation.resolve(opened.finding, [{ ...opened.history[0]!, companyId: 'company-2' }], {
        ...baseCommand,
        eventId: 'event-2',
      }),
    ).toThrow(new PayrollReviewFindingInvariantError('Finding history has a foreign event'));
    expect(() =>
      foundation.resolve(opened.finding, opened.history, {
        ...baseCommand,
        eventId: 'event-2',
        occurredAt: new Date('2026-07-21T11:59:00.000Z'),
      }),
    ).toThrow(new PayrollReviewFindingInvariantError('Finding events must be chronological'));
  });

  it('rejects missing history and invalid timestamps', () => {
    const opened = open();
    const command = {
      eventId: 'event-2',
      companyId: 'company-1',
      reason: 'Evidence was reviewed',
      traceId: 'trace-2',
      occurredAt: new Date('2026-07-21T12:10:00.000Z'),
    };

    expect(() => foundation.resolve(opened.finding, [], command)).toThrow(
      new PayrollReviewFindingInvariantError('Finding history cannot be empty'),
    );
    expect(() =>
      foundation.open({
        findingId: 'finding-2',
        eventId: 'event-2',
        companyId: 'company-1',
        payrollRunId: 'run-1',
        severity: 'INFORMATIONAL',
        description: 'Technical note',
        traceId: 'trace-2',
        occurredAt: new Date('invalid'),
      }),
    ).toThrow(new PayrollReviewFindingInvariantError('occurredAt must be a valid date'));
  });

  it('rejects persisted status and history inconsistencies', () => {
    const opened = open();
    expect(() =>
      foundation.assertCoherence({ ...opened.finding, status: 'RESOLVED' }, opened.history),
    ).toThrow(new PayrollReviewFindingInvariantError('Finding status must match its latest event'));
    expect(() =>
      foundation.assertCoherence(opened.finding, [...opened.history, opened.history[0]!]),
    ).toThrow(new PayrollReviewFindingInvariantError('Finding event id must be unique'));
    expect(() =>
      foundation.assertCoherence(opened.finding, [
        opened.history[0]!,
        { ...opened.history[0]!, id: 'event-2', occurredAt: new Date('2026-07-21T11:59:00Z') },
      ]),
    ).toThrow(new PayrollReviewFindingInvariantError('Finding events must be chronological'));
  });
});

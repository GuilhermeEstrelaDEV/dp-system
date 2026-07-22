export const PAYROLL_REVIEW_FINDING_SEVERITIES = ['INFORMATIONAL', 'BLOCKING'] as const;
export type PayrollReviewFindingSeverity = (typeof PAYROLL_REVIEW_FINDING_SEVERITIES)[number];

export const PAYROLL_REVIEW_FINDING_STATUSES = ['OPEN', 'RESOLVED'] as const;
export type PayrollReviewFindingStatus = (typeof PAYROLL_REVIEW_FINDING_STATUSES)[number];

export const PAYROLL_REVIEW_FINDING_EVENT_TYPES = ['OPENED', 'RESOLVED', 'REOPENED'] as const;
export type PayrollReviewFindingEventType = (typeof PAYROLL_REVIEW_FINDING_EVENT_TYPES)[number];

export type PayrollReviewFindingReference = Readonly<{
  employmentContractId?: string;
  payrollCalculationItemId?: string;
}>;

export type PayrollReviewFinding = Readonly<{
  id: string;
  companyId: string;
  payrollRunId: string;
  severity: PayrollReviewFindingSeverity;
  description: string;
  reference: PayrollReviewFindingReference;
  status: PayrollReviewFindingStatus;
  createdAt: Date;
}>;

export type PayrollReviewFindingEvent = Readonly<{
  id: string;
  findingId: string;
  companyId: string;
  type: PayrollReviewFindingEventType;
  reason: string | null;
  traceId: string;
  occurredAt: Date;
}>;

export type OpenPayrollReviewFinding = Readonly<{
  findingId: string;
  eventId: string;
  companyId: string;
  payrollRunId: string;
  severity: PayrollReviewFindingSeverity;
  description: string;
  reference?: PayrollReviewFindingReference;
  traceId: string;
  occurredAt: Date;
}>;

export type TransitionPayrollReviewFinding = Readonly<{
  eventId: string;
  companyId: string;
  reason: string;
  traceId: string;
  occurredAt: Date;
}>;

export type PayrollReviewFindingChange = Readonly<{
  finding: PayrollReviewFinding;
  history: readonly PayrollReviewFindingEvent[];
}>;

export class PayrollReviewFindingInvariantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PayrollReviewFindingInvariantError';
  }
}

export class PayrollReviewFindingFoundation {
  assertCoherence(
    finding: PayrollReviewFinding,
    history: readonly PayrollReviewFindingEvent[],
  ): void {
    if (history.length === 0) {
      throw new PayrollReviewFindingInvariantError('Finding history cannot be empty');
    }
    const uniqueIds = new Set<string>();
    let previousOccurredAt = Number.NEGATIVE_INFINITY;
    for (const event of history) {
      if (event.findingId !== finding.id || event.companyId !== finding.companyId) {
        throw new PayrollReviewFindingInvariantError('Finding history has a foreign event');
      }
      if (uniqueIds.has(event.id)) {
        throw new PayrollReviewFindingInvariantError('Finding event id must be unique');
      }
      uniqueIds.add(event.id);
      if (event.occurredAt.getTime() < previousOccurredAt) {
        throw new PayrollReviewFindingInvariantError('Finding events must be chronological');
      }
      previousOccurredAt = event.occurredAt.getTime();
    }
    const expectedStatus = history.at(-1)?.type === 'RESOLVED' ? 'RESOLVED' : 'OPEN';
    if (finding.status !== expectedStatus) {
      throw new PayrollReviewFindingInvariantError('Finding status must match its latest event');
    }
  }

  open(command: OpenPayrollReviewFinding): PayrollReviewFindingChange {
    const findingId = this.required(command.findingId, 'findingId');
    const companyId = this.required(command.companyId, 'companyId');
    const occurredAt = this.validDate(command.occurredAt, 'occurredAt');
    const finding = Object.freeze({
      id: findingId,
      companyId,
      payrollRunId: this.required(command.payrollRunId, 'payrollRunId'),
      severity: command.severity,
      description: this.required(command.description, 'description'),
      reference: Object.freeze({ ...(command.reference ?? {}) }),
      status: 'OPEN' as const,
      createdAt: occurredAt,
    });
    const event = this.event({
      eventId: command.eventId,
      findingId,
      companyId,
      type: 'OPENED',
      reason: null,
      traceId: command.traceId,
      occurredAt,
    });
    return Object.freeze({ finding, history: Object.freeze([event]) });
  }

  resolve(
    finding: PayrollReviewFinding,
    history: readonly PayrollReviewFindingEvent[],
    command: TransitionPayrollReviewFinding,
  ): PayrollReviewFindingChange {
    return this.transition(finding, history, command, 'OPEN', 'RESOLVED', 'RESOLVED');
  }

  reopen(
    finding: PayrollReviewFinding,
    history: readonly PayrollReviewFindingEvent[],
    command: TransitionPayrollReviewFinding,
  ): PayrollReviewFindingChange {
    return this.transition(finding, history, command, 'RESOLVED', 'OPEN', 'REOPENED');
  }

  private transition(
    finding: PayrollReviewFinding,
    history: readonly PayrollReviewFindingEvent[],
    command: TransitionPayrollReviewFinding,
    expectedStatus: PayrollReviewFindingStatus,
    nextStatus: PayrollReviewFindingStatus,
    eventType: PayrollReviewFindingEventType,
  ): PayrollReviewFindingChange {
    if (finding.status !== expectedStatus) {
      throw new PayrollReviewFindingInvariantError(
        `Finding must be ${expectedStatus} before ${eventType}`,
      );
    }
    const companyId = this.required(command.companyId, 'companyId');
    if (finding.companyId !== companyId) {
      throw new PayrollReviewFindingInvariantError('Finding belongs to another company');
    }
    this.assertHistory(finding, history, command.eventId, command.occurredAt);
    const event = this.event({
      eventId: command.eventId,
      findingId: finding.id,
      companyId,
      type: eventType,
      reason: this.required(command.reason, 'reason'),
      traceId: command.traceId,
      occurredAt: command.occurredAt,
    });
    return Object.freeze({
      finding: Object.freeze({ ...finding, status: nextStatus }),
      history: Object.freeze([...history, event]),
    });
  }

  private assertHistory(
    finding: PayrollReviewFinding,
    history: readonly PayrollReviewFindingEvent[],
    eventId: string,
    occurredAt: Date,
  ): void {
    const nextOccurredAt = this.validDate(occurredAt, 'occurredAt');
    this.assertCoherence(finding, history);
    for (const event of history) {
      if (event.findingId !== finding.id || event.companyId !== finding.companyId) {
        throw new PayrollReviewFindingInvariantError('Finding history has a foreign event');
      }
      if (event.id === eventId) {
        throw new PayrollReviewFindingInvariantError('Finding event id must be unique');
      }
    }
    const lastEvent = history.at(-1);
    if (lastEvent && lastEvent.occurredAt.getTime() > nextOccurredAt.getTime()) {
      throw new PayrollReviewFindingInvariantError('Finding events must be chronological');
    }
  }

  private event(input: {
    eventId: string;
    findingId: string;
    companyId: string;
    type: PayrollReviewFindingEventType;
    reason: string | null;
    traceId: string;
    occurredAt: Date;
  }): PayrollReviewFindingEvent {
    return Object.freeze({
      id: this.required(input.eventId, 'eventId'),
      findingId: input.findingId,
      companyId: input.companyId,
      type: input.type,
      reason: input.reason === null ? null : this.required(input.reason, 'reason'),
      traceId: this.required(input.traceId, 'traceId'),
      occurredAt: this.validDate(input.occurredAt, 'occurredAt'),
    });
  }

  private required(value: string, field: string): string {
    const normalized = value.trim();
    if (!normalized) throw new PayrollReviewFindingInvariantError(`${field} is required`);
    return normalized;
  }

  private validDate(value: Date, field: string): Date {
    if (Number.isNaN(value.getTime())) {
      throw new PayrollReviewFindingInvariantError(`${field} must be a valid date`);
    }
    return new Date(value.getTime());
  }
}

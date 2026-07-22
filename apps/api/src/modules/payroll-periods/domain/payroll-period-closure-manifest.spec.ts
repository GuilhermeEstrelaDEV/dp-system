import {
  PAYROLL_PERIOD_CLOSURE_HASH_ALGORITHM_VERSION,
  PAYROLL_PERIOD_CLOSURE_MANIFEST_SCHEMA_VERSION,
  PayrollPeriodClosureManifestBuilder,
  canonicalizeJson,
  hashCanonicalJson,
} from './payroll-period-closure-manifest';

const baseInput = () => ({
  companyId: 'company-1',
  payrollPeriodId: 'period-1',
  closureId: 'closure-1',
  closureVersion: 1,
  payrollRunId: 'run-1',
  payrollRunSequence: 2,
  reviewCycleId: 'review-1',
  reviewRound: 3,
  validDecisionReferences: ['decision-b', 'decision-a'],
  relevantFindingReferences: ['finding-b', 'finding-a'],
  consolidatedTotals: { net: '80.00', gross: '100.00' },
  safeEmployeeReferences: ['contract-b', 'contract-a'],
  previousStatus: 'OPEN',
  intendedStatus: 'CLOSED',
  variablePayWarnings: ['warning-b', 'warning-a'],
  warningAcknowledgements: ['warning-b', 'warning-a'],
  actorContext: { actorId: 'actor-1', activeCompanyId: 'company-1' },
  evaluatedAt: '2026-07-22T12:00:00.000Z',
  traceId: 'trace-1',
  sessionId: 'session-1',
  generatedAt: '2026-07-22T12:01:00.000Z',
});

describe('PayrollPeriodClosureManifestBuilder', () => {
  const builder = new PayrollPeriodClosureManifestBuilder();

  it('creates a versioned SHA-256 manifest with a minimal actor context', () => {
    const result = builder.build(baseInput());
    expect(result.payload.schemaVersion).toBe(PAYROLL_PERIOD_CLOSURE_MANIFEST_SCHEMA_VERSION);
    expect(result.hashAlgorithmVersion).toBe(PAYROLL_PERIOD_CLOSURE_HASH_ALGORITHM_VERSION);
    expect(result.payloadHash).toMatch(/^[0-9a-f]{64}$/);
    expect(result.payload.actorContext).toEqual({
      actorId: 'actor-1',
      activeCompanyId: 'company-1',
    });
    expect(result.canonicalPayload).not.toContain('email');
    expect(result.canonicalPayload).not.toContain('displayName');
  });

  it('is deterministic for different object and reference ordering', () => {
    const first = builder.build(baseInput());
    const second = builder.build({
      ...baseInput(),
      consolidatedTotals: { gross: '100.00', net: '80.00' },
      validDecisionReferences: ['decision-a', 'decision-b'],
      relevantFindingReferences: ['finding-a', 'finding-b'],
      safeEmployeeReferences: ['contract-a', 'contract-b'],
      variablePayWarnings: ['warning-a', 'warning-b'],
      warningAcknowledgements: ['warning-a', 'warning-b'],
    });
    expect(second.canonicalPayload).toBe(first.canonicalPayload);
    expect(second.payloadHash).toBe(first.payloadHash);
    expect(hashCanonicalJson({ b: 2, a: 1 })).toBe(hashCanonicalJson({ a: 1, b: 2 }));
  });

  it('changes the hash when a value or schema version changes', () => {
    const original = builder.build(baseInput());
    const changed = builder.build({ ...baseInput(), payrollRunSequence: 3 });
    expect(changed.payloadHash).not.toBe(original.payloadHash);
    expect(hashCanonicalJson({ ...original.payload, schemaVersion: '2.0' })).not.toBe(
      original.payloadHash,
    );
  });

  it('rejects non-finite numeric values', () => {
    expect(() => canonicalizeJson({ value: Number.NaN })).toThrow(TypeError);
  });
});

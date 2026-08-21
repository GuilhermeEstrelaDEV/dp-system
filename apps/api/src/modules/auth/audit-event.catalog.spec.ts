import {
  AUDIT_EVENT_CATALOG,
  AUDIT_EVENT_CODES,
  auditEventDescriptor,
} from './audit-event.catalog';

describe('authorization audit event catalog', () => {
  it('is immutable, unique and bounded by the persisted action contract', () => {
    expect(Object.isFrozen(AUDIT_EVENT_CATALOG)).toBe(true);
    expect(new Set(AUDIT_EVENT_CODES).size).toBe(AUDIT_EVENT_CODES.length);
    for (const code of AUDIT_EVENT_CODES) {
      expect(code.length).toBeLessThanOrEqual(50);
      expect(AUDIT_EVENT_CATALOG[code].code).toBe(code);
      expect(AUDIT_EVENT_CATALOG[code].version).toBe(1);
      expect(Object.isFrozen(AUDIT_EVENT_CATALOG[code])).toBe(true);
    }
  });

  it('requires atomic writes for every assignment, grant and payroll mutation', () => {
    const nonAtomic = AUDIT_EVENT_CODES.filter(
      (code) =>
        AUDIT_EVENT_CATALOG[code].category !== 'AUTHENTICATION' &&
        code !== 'ACCESS_GRANTS_VIEWED' &&
        AUDIT_EVENT_CATALOG[code].atomicity !== 'REQUIRED',
    );
    expect(nonAtomic).toEqual([]);
    expect(AUDIT_EVENT_CATALOG.ACCESS_GRANTS_VIEWED.atomicity).toBe('OPTIONAL');
  });

  it('rejects an event code outside the closed catalog at runtime', () => {
    expect(() => auditEventDescriptor('FORGED_EVENT')).toThrow(
      'Unknown audit event code: FORGED_EVENT',
    );
  });

  it('keeps PAYROLL_PERIOD_CLOSED on the approved metadata contract', () => {
    expect(AUDIT_EVENT_CODES).toHaveLength(60);
    expect(AUDIT_EVENT_CATALOG.PAYROLL_PERIOD_CLOSED.allowedMetadata).toEqual([
      'closureId',
      'manifestId',
      'manifestHash',
      'selectedPayrollRunId',
      'linkedReviewCycleId',
      'warnings',
    ]);
    expect(AUDIT_EVENT_CATALOG.PAYROLL_PERIOD_CLOSED.allowedMetadata).not.toContain(
      'hashAlgorithmVersion',
    );
  });
});

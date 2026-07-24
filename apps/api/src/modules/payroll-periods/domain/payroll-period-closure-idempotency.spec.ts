import {
  IdempotencyPayloadConflictError,
  InvalidIdempotencyKeyError,
  PayrollPeriodClosureIdempotencyPolicy,
} from './payroll-period-closure-idempotency';

describe('PayrollPeriodClosureIdempotencyPolicy', () => {
  const policy = new PayrollPeriodClosureIdempotencyPolicy();
  const key = '123E4567-E89B-42D3-A456-426614174000';

  it('normalizes and hashes a UUID key without retaining its clear value', () => {
    expect(policy.normalizeKey(` ${key} `)).toBe(key.toLowerCase());
    expect(policy.hashKey(key)).toMatch(/^[0-9a-f]{64}$/);
    expect(policy.hashKey(key)).not.toContain(key.toLowerCase());
  });

  it.each(['', 'not-a-uuid', '123e4567-e89b-02d3-a456-426614174000', 'x'.repeat(65)])(
    'rejects invalid key %s',
    (invalid) => expect(() => policy.normalizeKey(invalid)).toThrow(InvalidIdempotencyKeyError),
  );

  it('creates deterministic fingerprints scoped by operation and payload', () => {
    const close = policy.fingerprint({ operation: 'CLOSE', payload: { b: 2, a: 1 } });
    expect(close).toBe(policy.fingerprint({ operation: 'CLOSE', payload: { a: 1, b: 2 } }));
    expect(close).not.toBe(policy.fingerprint({ operation: 'REOPEN', payload: { a: 1, b: 2 } }));
  });

  it('accepts replay with the same fingerprint and rejects a divergent payload', () => {
    expect(() => policy.assertSamePayload('same', 'same')).not.toThrow();
    expect(() => policy.assertSamePayload('first', 'second')).toThrow(
      IdempotencyPayloadConflictError,
    );
  });
});

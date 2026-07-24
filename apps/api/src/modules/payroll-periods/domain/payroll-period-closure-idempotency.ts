import { hashCanonicalJson, type CanonicalJsonValue } from './payroll-period-closure-manifest';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type PayrollPeriodClosureOperation = 'CLOSE' | 'REOPEN';

export interface IdempotencyFingerprintInput {
  readonly operation: PayrollPeriodClosureOperation;
  readonly payload: CanonicalJsonValue;
}

export class InvalidIdempotencyKeyError extends Error {
  constructor(message = 'Idempotency-Key must be a UUID') {
    super(message);
    this.name = 'InvalidIdempotencyKeyError';
  }
}

export class IdempotencyPayloadConflictError extends Error {
  constructor() {
    super('Idempotency-Key was already used with a different payload');
    this.name = 'IdempotencyPayloadConflictError';
  }
}

export class PayrollPeriodClosureIdempotencyPolicy {
  normalizeKey(value: string): string {
    const normalized = value.trim().toLowerCase();
    if (normalized.length > 64 || !UUID_PATTERN.test(normalized)) {
      throw new InvalidIdempotencyKeyError();
    }
    return normalized;
  }

  hashKey(value: string): string {
    return hashCanonicalJson(this.normalizeKey(value));
  }

  fingerprint(input: IdempotencyFingerprintInput): string {
    return hashCanonicalJson({ operation: input.operation, payload: input.payload });
  }

  assertSamePayload(existingFingerprint: string, requestedFingerprint: string): void {
    if (existingFingerprint !== requestedFingerprint) {
      throw new IdempotencyPayloadConflictError();
    }
  }
}

import { createHash } from 'node:crypto';

export const PAYROLL_PERIOD_CLOSURE_MANIFEST_SCHEMA_VERSION = '1.0';
export const PAYROLL_PERIOD_CLOSURE_HASH_ALGORITHM_VERSION = 'sha256-canonical-json-v1';

export type CanonicalJsonPrimitive = string | number | boolean | null;
export type CanonicalJsonValue =
  | CanonicalJsonPrimitive
  | readonly CanonicalJsonValue[]
  | { readonly [key: string]: CanonicalJsonValue };

export interface PayrollPeriodClosureManifestPayload {
  readonly schemaVersion: string;
  readonly companyId: string;
  readonly payrollPeriodId: string;
  readonly closureId: string;
  readonly closureVersion: number;
  readonly payrollRunId: string;
  readonly payrollRunSequence: number;
  readonly reviewCycleId: string;
  readonly reviewRound: number;
  readonly validDecisionReferences: readonly string[];
  readonly relevantFindingReferences: readonly string[];
  readonly consolidatedTotals: Readonly<Record<string, string>>;
  readonly safeEmployeeReferences: readonly string[];
  readonly previousStatus: string;
  readonly intendedStatus: string;
  readonly variablePayWarnings: readonly string[];
  readonly warningAcknowledgements: readonly string[];
  readonly actorContext: {
    readonly actorId: string;
    readonly activeCompanyId: string;
  };
  readonly evaluatedAt: string;
  readonly traceId: string;
  readonly sessionId: string | null;
  readonly generatedAt: string;
}

export interface HashedPayrollPeriodClosureManifest {
  readonly payload: PayrollPeriodClosureManifestPayload;
  readonly canonicalPayload: string;
  readonly payloadHash: string;
  readonly hashAlgorithmVersion: typeof PAYROLL_PERIOD_CLOSURE_HASH_ALGORITHM_VERSION;
}

export type BuildPayrollPeriodClosureManifestInput = Omit<
  PayrollPeriodClosureManifestPayload,
  'schemaVersion'
>;

export function canonicalizeJson(value: CanonicalJsonValue): string {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return JSON.stringify(value);
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value))
      throw new TypeError('Canonical JSON does not accept non-finite numbers');
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalizeJson(item)).join(',')}]`;
  }
  const objectValue = value as Readonly<Record<string, CanonicalJsonValue>>;
  const entries = Object.keys(objectValue)
    .sort((left, right) => left.localeCompare(right))
    .map((key) => `${JSON.stringify(key)}:${canonicalizeJson(objectValue[key]!)}`);
  return `{${entries.join(',')}}`;
}

export function hashCanonicalJson(value: CanonicalJsonValue): string {
  return createHash('sha256').update(canonicalizeJson(value), 'utf8').digest('hex');
}

export class PayrollPeriodClosureManifestBuilder {
  build(input: BuildPayrollPeriodClosureManifestInput): HashedPayrollPeriodClosureManifest {
    const payload: PayrollPeriodClosureManifestPayload = {
      ...input,
      schemaVersion: PAYROLL_PERIOD_CLOSURE_MANIFEST_SCHEMA_VERSION,
      validDecisionReferences: [...input.validDecisionReferences].sort(),
      relevantFindingReferences: [...input.relevantFindingReferences].sort(),
      safeEmployeeReferences: [...input.safeEmployeeReferences].sort(),
      variablePayWarnings: [...input.variablePayWarnings].sort(),
      warningAcknowledgements: [...input.warningAcknowledgements].sort(),
      consolidatedTotals: Object.fromEntries(
        Object.entries(input.consolidatedTotals).sort(([left], [right]) =>
          left.localeCompare(right),
        ),
      ),
    };
    const canonicalPayload = canonicalizeJson(payload as unknown as CanonicalJsonValue);
    return {
      payload,
      canonicalPayload,
      payloadHash: createHash('sha256').update(canonicalPayload, 'utf8').digest('hex'),
      hashAlgorithmVersion: PAYROLL_PERIOD_CLOSURE_HASH_ALGORITHM_VERSION,
    };
  }
}

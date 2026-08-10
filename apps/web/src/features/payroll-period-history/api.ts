import { apiRequest } from '@/lib/api';

export type ClosureEvent = {
  id: string;
  type: string;
  occurredAt: string;
};
export type ClosureVersion = {
  id: string;
  version: number;
  status: 'OPEN' | 'CLOSING' | 'CLOSED' | 'REOPENING';
  isActive: boolean;
  openedAt: string;
  closedAt: string | null;
  reopenedAt: string | null;
  supersededAt: string | null;
  payrollRun: { id: string; sequence: number; status: string } | null;
  review: { id: string; reviewRound: number; status: string } | null;
  predecessor: { id: string; version: number } | null;
  successor: { id: string; version: number } | null;
  manifest: {
    id: string;
    version: number;
    hash: string;
    algorithm: string;
    createdAt: string;
  } | null;
  events: ClosureEvent[];
};
export type ClosureHistory = { payrollPeriodId: string; versions: ClosureVersion[] };
export type SafeManifest = {
  payrollPeriodId: string;
  closureVersion: number;
  manifestId: string;
  manifestVersion: number;
  hash: string;
  algorithm: string;
  createdAt: string;
  schemaVersion: string | null;
  summary: Record<string, string | number | null>;
  warnings: string[];
  acknowledgements: Array<{ warningCode: string; acknowledgedAt: string }>;
  references: {
    payrollRunId: string | null;
    reviewCycleId: string | null;
  };
};
export type Readiness = {
  isReady: boolean;
  consistencyToken: string;
  selectedPayrollRun: { id: string; sequence?: number } | null;
  blockers: Array<{ code: string }>;
  warnings: Array<{ code: string }>;
  acknowledgementsRequired: string[];
};

export const createPayrollClosureIdempotencyKey = () => globalThis.crypto.randomUUID();
export const payrollPeriodHistoryApi = {
  list: (periodId: string) => apiRequest<ClosureHistory>(`/payroll-periods/${periodId}/history`),
  version: (periodId: string, version: number) =>
    apiRequest<ClosureVersion>(`/payroll-periods/${periodId}/history/${version}`),
  events: (periodId: string, version: number) =>
    apiRequest<{ events: ClosureEvent[] }>(
      `/payroll-periods/${periodId}/history/${version}/events`,
    ),
  manifest: (periodId: string, version: number) =>
    apiRequest<SafeManifest>(`/payroll-periods/${periodId}/history/${version}/manifest`),
  readiness: (periodId: string, payrollRunId?: string) => {
    const query = payrollRunId ? `?${new URLSearchParams({ payrollRunId })}` : '';
    return apiRequest<Readiness>(`/payroll-periods/${periodId}/closure-readiness${query}`);
  },
  close: (input: {
    periodId: string;
    payrollRunId: string;
    readiness: Readiness;
    expectedClosureVersion: number;
    warningAcknowledgements: readonly string[];
    idempotencyKey: string;
    note?: string;
  }) => {
    if (!input.payrollRunId) throw new Error('A execução precisa ser selecionada explicitamente.');
    return apiRequest(`/payroll-periods/${input.periodId}/close`, {
      method: 'POST',
      headers: { 'Idempotency-Key': input.idempotencyKey },
      body: JSON.stringify({
        payrollRunId: input.payrollRunId,
        expectedConsistencyToken: input.readiness.consistencyToken,
        expectedClosureVersion: input.expectedClosureVersion,
        warningAcknowledgements: input.warningAcknowledgements.map((warningCode) => ({
          warningCode,
          acknowledged: true,
        })),
        ...(input.note ? { note: input.note } : {}),
      }),
    });
  },
  reopen: (input: {
    periodId: string;
    reason: string;
    consistencyToken: string;
    expectedClosureVersion: number;
    idempotencyKey: string;
  }) =>
    apiRequest(`/payroll-periods/${input.periodId}/reopen`, {
      method: 'POST',
      headers: { 'Idempotency-Key': input.idempotencyKey },
      body: JSON.stringify({
        reason: input.reason,
        expectedConsistencyToken: input.consistencyToken,
        expectedClosureVersion: input.expectedClosureVersion,
      }),
    }),
};

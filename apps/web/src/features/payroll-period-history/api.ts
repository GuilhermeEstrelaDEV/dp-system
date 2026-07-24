import { apiRequest } from '@/lib/api';

export type ClosureActor = { id: string; displayName: string };
export type ClosureEvent = {
  id: string;
  type: string;
  occurredAt: string;
  actor: ClosureActor;
  traceId?: string;
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
  actor: ClosureActor;
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
  totals: Record<string, string>;
  references: {
    payrollRunId: string | null;
    reviewCycleId: string | null;
    decisions: string[];
    findings: string[];
    employees: string[];
  };
};
export type Readiness = {
  isReady: boolean;
  consistencyToken: string;
  selectedPayrollRun: { id: string } | null;
  blockers: Array<{ code: string; message: string }>;
  warnings: Array<{ code: string; message: string }>;
  acknowledgementsRequired: string[];
};

const key = () => globalThis.crypto.randomUUID();
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
  readiness: (periodId: string) =>
    apiRequest<Readiness>(`/payroll-periods/${periodId}/closure-readiness`),
  close: (periodId: string, readiness: Readiness, expectedClosureVersion: number) => {
    if (!readiness.selectedPayrollRun) throw new Error('Nova execução completa é obrigatória.');
    return apiRequest(`/payroll-periods/${periodId}/close`, {
      method: 'POST',
      headers: { 'Idempotency-Key': key() },
      body: JSON.stringify({
        payrollRunId: readiness.selectedPayrollRun.id,
        expectedConsistencyToken: readiness.consistencyToken,
        expectedClosureVersion,
        warningAcknowledgements: readiness.acknowledgementsRequired.map((warningCode) => ({
          warningCode,
          acknowledged: true,
        })),
      }),
    });
  },
  reopen: (periodId: string, reason: string, token: string, version: number) =>
    apiRequest(`/payroll-periods/${periodId}/reopen`, {
      method: 'POST',
      headers: { 'Idempotency-Key': key() },
      body: JSON.stringify({
        reason,
        expectedConsistencyToken: token,
        expectedClosureVersion: version,
      }),
    }),
};

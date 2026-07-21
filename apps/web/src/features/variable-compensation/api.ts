import { apiRequest } from '@/lib/api';

export type CompensationRecord = {
  id: string;
  employmentContractId?: string;
  payrollRunId?: string;
  referencePeriod?: string;
  type?: string;
  amount?: string;
  differenceAmount?: string;
  status?: string;
  approvalStatus?: string;
  reason?: string;
};

export type RecordKind = 'events' | 'advances' | 'off-cycle-payments' | 'reconciliations';

export const variableCompensationApi = {
  list: (kind: RecordKind, query: URLSearchParams) =>
    apiRequest<CompensationRecord[]>(`/variable-compensation/${kind}?${query}`),
  create: (kind: RecordKind, body: Record<string, string>) =>
    apiRequest<CompensationRecord>(`/variable-compensation/${kind}`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

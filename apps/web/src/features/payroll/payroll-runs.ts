import { apiRequest } from '@/lib/api';

export type PayrollRunMessage = {
  id: string;
  severity: 'WARNING' | 'BLOCKING_ERROR';
  code: string;
  message: string;
};
export type PayrollRun = {
  id: string;
  payrollPeriodId: string;
  sequence: number;
  status: 'DRAFT' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  engineVersion: string;
  parameterVersion?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  messages: PayrollRunMessage[];
};
export type PayrollRunPage = {
  items: PayrollRun[];
  pagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
};
export type CreatePayrollRun = {
  payrollPeriodId: string;
  engineVersion: string;
  parameterSnapshotVersion?: string;
  parameterSnapshot?: Record<string, unknown>;
  technicalNotes?: string;
};

export const payrollRunsApi = {
  list: (query: URLSearchParams) => apiRequest<PayrollRunPage>(`/payroll-runs?${query}`),
  find: (id: string) => apiRequest<PayrollRun>(`/payroll-runs/${id}`),
  create: (body: CreatePayrollRun) =>
    apiRequest<PayrollRun>('/payroll-runs', { method: 'POST', body: JSON.stringify(body) }),
  messages: (id: string) => apiRequest<PayrollRunMessage[]>(`/payroll-runs/${id}/messages`),
  addMessage: (id: string, body: Pick<PayrollRunMessage, 'severity' | 'code' | 'message'>) =>
    apiRequest<PayrollRunMessage>(`/payroll-runs/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

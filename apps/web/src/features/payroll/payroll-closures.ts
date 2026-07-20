import { apiRequest } from '@/lib/api';

export type PayrollClosure = {
  id: string;
  payrollPeriodId: string;
  action: 'CLOSED' | 'REOPENED';
  reason?: string | null;
  engineVersion: string;
  parameterVersion?: string | null;
  occurredAt: string;
};
export type PayrollClosurePage = {
  items: PayrollClosure[];
  pagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
};
export const payrollClosuresApi = {
  list: (query: URLSearchParams) => apiRequest<PayrollClosurePage>(`/payroll-closures?${query}`),
  find: (id: string) => apiRequest<PayrollClosure>(`/payroll-closures/${id}`),
  close: (payrollPeriodId: string, reason?: string) =>
    apiRequest<PayrollClosure>('/payroll-closures', {
      method: 'POST',
      body: JSON.stringify({ payrollPeriodId, ...(reason ? { reason } : {}) }),
    }),
  reopen: (payrollPeriodId: string, reason: string) =>
    apiRequest<PayrollClosure>(`/payroll-closures/${payrollPeriodId}/reopen`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
};

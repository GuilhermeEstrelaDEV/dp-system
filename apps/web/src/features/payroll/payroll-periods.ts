import { apiRequest } from '@/lib/api';

export type PayrollPeriodStatus = 'OPEN' | 'CLOSED' | 'VALIDATING';
export type PayrollPeriod = {
  id: string;
  companyId: string;
  payrollCalendarId: string;
  referenceDate: string;
  type: string;
  status: PayrollPeriodStatus;
  engineVersion: string;
  parameterVersion?: string | null;
  openedAt: string;
  closedAt?: string | null;
  reopenedAt?: string | null;
};
export type PayrollPeriodPage = {
  items: PayrollPeriod[];
  pagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
};
export type CreatePayrollPeriod = {
  companyId: string;
  payrollCalendarId: string;
  referenceDate: string;
  type?: string;
};
export type UpdatePayrollPeriod = Pick<
  CreatePayrollPeriod,
  'payrollCalendarId' | 'referenceDate' | 'type'
>;

export const payrollPeriodsApi = {
  list: (query: URLSearchParams) => apiRequest<PayrollPeriodPage>(`/payroll-periods?${query}`),
  find: (id: string) => apiRequest<PayrollPeriod>(`/payroll-periods/${id}`),
  create: (body: CreatePayrollPeriod) =>
    apiRequest<PayrollPeriod>('/payroll-periods', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: UpdatePayrollPeriod) =>
    apiRequest<PayrollPeriod>(`/payroll-periods/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  validate: (id: string) =>
    apiRequest<{ periodId: string; valid: boolean; blockingErrors: number }>(
      `/payroll-periods/${id}/validate`,
      { method: 'POST' },
    ),
  close: (id: string) =>
    apiRequest<PayrollPeriod>(`/payroll-periods/${id}/close`, { method: 'POST' }),
  reopen: (id: string, reason: string) =>
    apiRequest<PayrollPeriod>(`/payroll-periods/${id}/reopen`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
};

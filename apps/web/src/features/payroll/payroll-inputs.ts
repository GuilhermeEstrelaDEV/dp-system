import { apiRequest } from '@/lib/api';

export type PayrollInputStatus = 'PENDING' | 'INACTIVE';
export type PayrollInput = {
  id: string;
  payrollPeriodId: string;
  employmentContractId: string;
  payrollRubricId: string;
  amount: string;
  quantity?: string | null;
  source: string;
  sourceKey?: string | null;
  status: PayrollInputStatus;
  payrollPeriod: { referenceDate: string; status: string };
  payrollRubric: { code: string; name: string };
};
export type PayrollInputPage = {
  items: PayrollInput[];
  pagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
};
export type CreatePayrollInput = {
  payrollPeriodId: string;
  employeeId: string;
  employmentContractId: string;
  payrollRubricId: string;
  amount: string;
  quantity?: string;
  sourceKey?: string;
  sourceType?: string;
  technicalNotes?: string;
};

export const payrollInputsApi = {
  list: (query: URLSearchParams) => apiRequest<PayrollInputPage>(`/payroll-inputs?${query}`),
  find: (id: string) => apiRequest<PayrollInput>(`/payroll-inputs/${id}`),
  create: (body: CreatePayrollInput) =>
    apiRequest<PayrollInput>('/payroll-inputs', { method: 'POST', body: JSON.stringify(body) }),
  update: (
    id: string,
    body: {
      amount?: string;
      quantity?: string;
      technicalNotes?: string;
      status?: PayrollInputStatus;
    },
  ) =>
    apiRequest<PayrollInput>(`/payroll-inputs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
};

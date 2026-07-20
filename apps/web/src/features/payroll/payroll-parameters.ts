import { apiRequest } from '@/lib/api';

export type PayrollParameterStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE';
export type PayrollParameter = {
  id: string;
  companyId?: string | null;
  code: string;
  name: string;
  category: string;
  version: string;
  validFrom: string;
  validTo?: string | null;
  definition?: Record<string, unknown> | null;
  status: PayrollParameterStatus;
};
export type PayrollParameterPage = {
  items: PayrollParameter[];
  pagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
};
export type CreatePayrollParameter = {
  companyId?: string;
  code: string;
  name: string;
  category: string;
  version: string;
  validFrom: string;
  validTo?: string;
  definition?: Record<string, unknown>;
  sourceReference?: string;
};

export const payrollParametersApi = {
  list: (query: URLSearchParams) =>
    apiRequest<PayrollParameterPage>(`/payroll-parameters?${query}`),
  find: (id: string) => apiRequest<PayrollParameter>(`/payroll-parameters/${id}`),
  create: (body: CreatePayrollParameter) =>
    apiRequest<PayrollParameter>('/payroll-parameters', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  update: (
    id: string,
    body: {
      name?: string;
      definition?: Record<string, unknown>;
      status?: PayrollParameterStatus;
    },
  ) =>
    apiRequest<PayrollParameter>(`/payroll-parameters/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
};

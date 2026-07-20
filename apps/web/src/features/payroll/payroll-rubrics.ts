import { apiRequest } from '@/lib/api';

export type PayrollRubricStatus = 'ACTIVE' | 'INACTIVE';
export type PayrollRubricVersion = {
  id: string;
  version: string;
  validFrom: string;
  validTo?: string | null;
  incidenceConfiguration?: Record<string, unknown> | null;
};
export type PayrollRubric = {
  id: string;
  companyId: string;
  code: string;
  name: string;
  status: PayrollRubricStatus;
  payrollRubricCategory: { name: string; nature: string };
  versions: PayrollRubricVersion[];
};
export type PayrollRubricPage = {
  items: PayrollRubric[];
  pagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
};
export type CreatePayrollRubric = {
  companyId: string;
  payrollRubricCategoryId: string;
  code: string;
  name: string;
  version: string;
  validFrom: string;
  validTo?: string;
  incidenceConfiguration?: Record<string, unknown>;
};

export const payrollRubricsApi = {
  list: (query: URLSearchParams) => apiRequest<PayrollRubricPage>(`/payroll-rubrics?${query}`),
  find: (id: string) => apiRequest<PayrollRubric>(`/payroll-rubrics/${id}`),
  create: (body: CreatePayrollRubric) =>
    apiRequest<PayrollRubric>('/payroll-rubrics', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: { name?: string; status?: PayrollRubricStatus }) =>
    apiRequest<PayrollRubric>(`/payroll-rubrics/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
};

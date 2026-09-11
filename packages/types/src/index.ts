export interface ApiSuccessResponse<TData> {
  data: TData;
  meta: {
    correlationId: string;
    timestamp: string;
    path: string;
  };
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  meta: {
    correlationId: string;
    timestamp: string;
    path: string;
  };
}

export interface HealthStatus {
  status: 'ok';
  database: 'connected';
}

export type RecordStatus = 'ACTIVE' | 'INACTIVE';

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedResult<TItem> {
  items: TItem[];
  pagination: PaginationMeta;
}

export interface CompanyContract {
  id: string;
  legalName: string;
  tradeName: string;
  taxId: string;
  status: RecordStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BranchContract {
  id: string;
  companyId: string;
  code: string;
  name: string;
  taxId: string | null;
  address: Record<string, string> | null;
  status: RecordStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentContract {
  id: string;
  companyId: string;
  branchId: string | null;
  code: string;
  name: string;
  status: RecordStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PositionContract {
  id: string;
  companyId: string;
  code: string;
  name: string;
  description: string | null;
  status: RecordStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CostCenterContract {
  id: string;
  companyId: string;
  code: string;
  name: string;
  status: RecordStatus;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeContract {
  id: string;
  legalName: string;
  preferredName: string | null;
  cpf?: string | null;
  birthDate?: string | null;
  maritalStatus?: MaritalStatus | null;
  nationality?: string | null;
  placeOfBirth?: string | null;
  status: RecordStatus;
  createdAt: string;
  updatedAt: string;
}

export type MaritalStatus = 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED' | 'SEPARATED' | 'OTHER';

export interface EmployeeAddressContract {
  id: string;
  employeeId: string;
  postalCode: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
}

export interface EmployeeEmergencyContactContract {
  id: string;
  employeeId: string;
  name: string;
  relationship: string;
  phone: string;
}

export interface EmployeeContactContract {
  id: string;
  employeeId: string;
  type: 'EMAIL' | 'PHONE';
  value: string;
  isPrimary: boolean;
  status: RecordStatus;
}

export interface EmploymentContractContract {
  id: string;
  employeeId: string;
  companyId: string;
  branchId: string | null;
  departmentId: string | null;
  positionId: string;
  costCenterId: string | null;
  registrationNumber: string;
  contractType: string;
  employmentRegime: string;
  startDate: string;
  endDate: string | null;
  weeklyHours: number;
  status: RecordStatus;
}

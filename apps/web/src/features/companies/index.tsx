import type { CompanyContract } from '@dp-system/types';
import { ResourcePage } from '@/features/shared/ResourcePage';
export function CompaniesPage() {
  return (
    <ResourcePage<CompanyContract>
      title="Empresas"
      endpoint="/companies"
      manageCapability="company.manage"
      fields={[
        ['legalName', 'Razão social'],
        ['tradeName', 'Nome fantasia'],
        ['taxId', 'CNPJ fictício'],
      ]}
    />
  );
}

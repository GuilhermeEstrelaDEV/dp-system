import type { CompanyContract } from '@dp-system/types';
import { ResourcePage } from '@/features/shared/ResourcePage';
import { OrganizationNavigation } from '@/features/shared/OrganizationNavigation';
export function CompaniesPage() {
  return (
    <>
      <OrganizationNavigation />
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
    </>
  );
}

import type { BranchContract } from '@dp-system/types';
import { ResourcePage } from '@/features/shared/ResourcePage';
import { OrganizationNavigation } from '@/features/shared/OrganizationNavigation';
export function BranchesPage() {
  return (
    <>
      <OrganizationNavigation />
      <ResourcePage<BranchContract>
        title="Filiais"
        endpoint="/branches"
        companyScoped
        manageCapability="organization.manage"
        fields={[
          ['code', 'Código'],
          ['name', 'Nome'],
          ['taxId', 'CNPJ fictício'],
        ]}
      />
    </>
  );
}

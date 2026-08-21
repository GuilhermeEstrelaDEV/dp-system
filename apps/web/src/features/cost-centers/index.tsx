import type { CostCenterContract } from '@dp-system/types';
import { ResourcePage } from '@/features/shared/ResourcePage';
import { OrganizationNavigation } from '@/features/shared/OrganizationNavigation';
export function CostCentersPage() {
  return (
    <>
      <OrganizationNavigation />
      <ResourcePage<CostCenterContract>
        title="Centros de custo"
        endpoint="/cost-centers"
        companyScoped
        manageCapability="organization.manage"
        fields={[
          ['code', 'Código'],
          ['name', 'Nome'],
        ]}
      />
    </>
  );
}

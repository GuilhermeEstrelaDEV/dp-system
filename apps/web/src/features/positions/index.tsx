import type { PositionContract } from '@dp-system/types';
import { ResourcePage } from '@/features/shared/ResourcePage';
import { OrganizationNavigation } from '@/features/shared/OrganizationNavigation';
export function PositionsPage() {
  return (
    <>
      <OrganizationNavigation />
      <ResourcePage<PositionContract>
        title="Cargos"
        endpoint="/positions"
        companyScoped
        manageCapability="organization.manage"
        fields={[
          ['code', 'Código'],
          ['name', 'Nome'],
          ['description', 'Descrição'],
        ]}
      />
    </>
  );
}

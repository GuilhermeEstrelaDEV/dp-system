import type { PositionContract } from '@dp-system/types';
import { ResourcePage } from '@/features/shared/ResourcePage';
import { OrganizationNavigation } from '@/features/shared/OrganizationNavigation';
export function PositionsPage() {
  return (
    <>
      <OrganizationNavigation />
      <ResourcePage<PositionContract>
        createLabel="Novo cargo"
        description="Mantenha o catálogo administrativo de cargos da empresa ativa."
        title="Cargos"
        endpoint="/positions"
        companyScoped
        manageCapability="organization.manage"
        fields={[
          ['code', 'Código'],
          ['name', 'Nome'],
          ['description', 'Descrição', false],
        ]}
      />
    </>
  );
}

import type { DepartmentContract } from '@dp-system/types';
import { ResourcePage } from '@/features/shared/ResourcePage';
import { OrganizationNavigation } from '@/features/shared/OrganizationNavigation';
export function DepartmentsPage() {
  return (
    <>
      <OrganizationNavigation />
      <ResourcePage<DepartmentContract>
        createLabel="Novo departamento"
        description="Mantenha os departamentos operacionais da empresa ativa."
        title="Departamentos"
        endpoint="/departments"
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

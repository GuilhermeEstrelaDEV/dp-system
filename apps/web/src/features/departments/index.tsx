import type { DepartmentContract } from '@dp-system/types';
import { ResourcePage } from '@/features/shared/ResourcePage';
import { OrganizationNavigation } from '@/features/shared/OrganizationNavigation';
export function DepartmentsPage() {
  return (
    <>
      <OrganizationNavigation />
      <ResourcePage<DepartmentContract>
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

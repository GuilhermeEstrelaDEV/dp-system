import type { DepartmentContract } from '@dp-system/types';
import { ResourcePage } from '@/features/shared/ResourcePage';
export function DepartmentsPage() {
  return (
    <ResourcePage<DepartmentContract>
      title="Departamentos"
      endpoint="/departments"
      companyScoped
      fields={[
        ['code', 'Código'],
        ['name', 'Nome'],
      ]}
    />
  );
}

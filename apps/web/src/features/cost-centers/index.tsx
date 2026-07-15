import type { CostCenterContract } from '@dp-system/types';
import { ResourcePage } from '@/features/shared/ResourcePage';
export function CostCentersPage() {
  return (
    <ResourcePage<CostCenterContract>
      title="Centros de custo"
      endpoint="/cost-centers"
      companyScoped
      fields={[
        ['code', 'Código'],
        ['name', 'Nome'],
      ]}
    />
  );
}

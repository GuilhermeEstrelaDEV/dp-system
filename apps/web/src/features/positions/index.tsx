import type { PositionContract } from '@dp-system/types';
import { ResourcePage } from '@/features/shared/ResourcePage';
export function PositionsPage() {
  return (
    <ResourcePage<PositionContract>
      title="Cargos"
      endpoint="/positions"
      companyScoped
      fields={[
        ['code', 'Código'],
        ['name', 'Nome'],
        ['description', 'Descrição'],
      ]}
    />
  );
}

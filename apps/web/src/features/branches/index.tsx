import type { BranchContract } from '@dp-system/types';
import { ResourcePage } from '@/features/shared/ResourcePage';
export function BranchesPage() {
  return (
    <ResourcePage<BranchContract>
      title="Filiais"
      endpoint="/branches"
      companyScoped
      fields={[
        ['code', 'Código'],
        ['name', 'Nome'],
        ['taxId', 'CNPJ fictício'],
      ]}
    />
  );
}

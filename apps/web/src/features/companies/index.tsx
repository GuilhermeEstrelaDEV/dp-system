import type { CompanyContract } from '@dp-system/types';
import { ResourcePage } from '@/features/shared/ResourcePage';
export function CompaniesPage() {
  return (
    <ResourcePage<CompanyContract>
      title="Empresas"
      endpoint="/companies"
      fields={[
        ['legalName', 'Razão social'],
        ['tradeName', 'Nome fantasia'],
        ['taxId', 'CNPJ fictício'],
      ]}
    />
  );
}

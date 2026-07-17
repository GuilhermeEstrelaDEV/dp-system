import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { apiRequest } from '@/lib/api';

const payrollPages = [
  ['competencias', 'Competências', '/folha/competencias', '/payroll-periods'],
  ['rubricas', 'Rubricas', '/folha/rubricas', '/payroll-rubrics'],
  ['parametros', 'Parâmetros', '/folha/parametros', '/payroll-parameters'],
  ['lancamentos', 'Lançamentos', '/folha/lancamentos', '/payroll-inputs'],
  ['execucoes', 'Execuções', '/folha/execucoes', '/payroll-runs'],
  ['fechamentos', 'Fechamentos', '/folha/fechamentos', '/payroll-closures'],
] as const;

type Paginated<T> = { items: T[]; pagination: { page: number; totalPages: number } };
type PayrollRecord = {
  id: string;
  status?: string;
  code?: string;
  name?: string;
  referenceDate?: string;
  createdAt?: string;
};

function currentPage(pathname: string) {
  return payrollPages.find(([, , path]) => pathname === path) ?? payrollPages[0];
}

export function PayrollPage() {
  const location = useLocation();
  const [, label, path, endpoint] = currentPage(location.pathname);
  const records = useQuery({
    queryKey: ['payroll', endpoint],
    queryFn: () => apiRequest<Paginated<PayrollRecord>>(`${endpoint}?page=1&pageSize=20`),
  });

  return (
    <section aria-labelledby="payroll-title">
      <PageHeader
        title="Folha de pagamento"
        description="Ambiente demonstrativo: a fundação é configurável e não contém regras, alíquotas, faixas ou cálculos legais homologados."
      />
      <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm" role="note">
        Processamento demonstrativo. Esta execução não representa folha de pagamento homologada.
      </p>
      <nav className="mt-4 flex flex-wrap gap-2" aria-label="Navegação da folha">
        {payrollPages.map(([, itemLabel, itemPath]) => (
          <Link
            key={itemPath}
            to={itemPath}
            aria-current={path === itemPath ? 'page' : undefined}
            className="rounded border px-3 py-2 text-sm"
          >
            {itemLabel}
          </Link>
        ))}
      </nav>
      <section className="mt-6" aria-labelledby="payroll-section-title">
        <h2 id="payroll-section-title">{label}</h2>
        {records.isLoading ? <p role="status">Carregando {label.toLowerCase()}…</p> : null}
        {records.isError ? <p role="alert">{records.error.message}</p> : null}
        {records.data?.items.length === 0 ? <p>Nenhum registro demonstrativo encontrado.</p> : null}
        {records.data?.items.length ? (
          <ul aria-label={`Lista de ${label.toLowerCase()}`}>
            {records.data.items.map((item) => (
              <li key={item.id}>
                <strong>{item.code ?? item.referenceDate ?? item.id}</strong>
                {item.name ? ` — ${item.name}` : ''}
                {item.status ? ` (${item.status})` : ''}
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </section>
  );
}

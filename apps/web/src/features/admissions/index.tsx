import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { DataTable, DataTableActions, DataTableStatus } from '@/components/common/DataTable';
import { PageHeader } from '@/components/common/PageHeader';
import {
  ClearFiltersButton,
  EmptyState,
  ErrorState,
  FilterBar,
  FilterSelect,
  LoadingState,
  SearchInput,
} from '@/components/common/Primitives';
import { useOptionalAuth } from '@/features/auth/AuthContext';
import { apiRequest } from '@/lib/api';

type Admission = {
  id: string;
  status: string;
  plannedAdmissionDate: string;
  employee: { legalName: string };
  checklistInstances: Array<{ items: Array<{ status: string }> }>;
};

const admissionStatuses = ['DRAFT', 'IN_PROGRESS', 'PENDING', 'COMPLETED', 'CANCELLED'] as const;

export function AdmissionsPage() {
  const auth = useOptionalAuth();
  const canManage = auth?.hasCapability('admission.manage') ?? true;
  const [filters, setFilters] = useSearchParams();
  const search = filters.get('search') ?? '';
  const status = filters.get('status') ?? '';
  const plannedFrom = filters.get('plannedFrom') ?? '';
  const plannedTo = filters.get('plannedTo') ?? '';
  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(filters);
    if (value) next.set(key, value);
    else next.delete(key);
    setFilters(next, { replace: true });
  };
  const query = useQuery({
    queryKey: [
      'admission-processes',
      auth?.activeCompanyId,
      search,
      status,
      plannedFrom,
      plannedTo,
    ],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (status) params.set('status', status);
      if (plannedFrom) params.set('plannedFrom', plannedFrom);
      if (plannedTo) params.set('plannedTo', plannedTo);
      const suffix = params.size ? `?${params}` : '';
      return apiRequest<Admission[]>(`/admission-processes${suffix}`);
    },
  });
  const hasFilters = Boolean(search || status || plannedFrom || plannedTo);

  return (
    <section aria-labelledby="admissions-title">
      <PageHeader
        headingId="admissions-title"
        title="Admissões"
        description="Prazos e documentos demonstrativos são controles lógicos configuráveis."
      >
        <div className="flex flex-wrap gap-3">
          {canManage && (
            <Link className="ui-button ui-button--primary" to="/admissoes/nova">
              Nova admissão
            </Link>
          )}
          <Link className="ui-button ui-button--secondary" to="/configuracoes/checklists">
            Templates de checklist
          </Link>
        </div>
      </PageHeader>
      <FilterBar>
        <SearchInput
          aria-label="Pesquisar admissões"
          onChange={(event) => updateFilter('search', event.target.value)}
          placeholder="Nome ou matrícula"
          value={search}
        />
        <FilterSelect
          aria-label="Filtrar admissões por status"
          label="Status"
          onChange={(event) => updateFilter('status', event.target.value)}
          value={status}
        >
          <option value="">Todos os status</option>
          {admissionStatuses.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </FilterSelect>
        <label className="ui-field">
          Previsão inicial
          <input
            aria-label="Filtrar admissões a partir da data"
            onChange={(event) => updateFilter('plannedFrom', event.target.value)}
            type="date"
            value={plannedFrom}
          />
        </label>
        <label className="ui-field">
          Previsão final
          <input
            aria-label="Filtrar admissões até a data"
            onChange={(event) => updateFilter('plannedTo', event.target.value)}
            type="date"
            value={plannedTo}
          />
        </label>
        <ClearFiltersButton
          disabled={!hasFilters}
          onClear={() => setFilters(new URLSearchParams(), { replace: true })}
        />
      </FilterBar>
      {query.isLoading ? (
        <LoadingState label="Carregando admissões..." />
      ) : query.isError ? (
        <ErrorState message={query.error.message} onRetry={() => void query.refetch()} />
      ) : query.data?.length === 0 ? (
        <EmptyState
          description={
            hasFilters
              ? 'Nenhum processo corresponde aos filtros aplicados.'
              : 'Ainda não há processos admissionais nesta empresa.'
          }
          title={hasFilters ? 'Nenhum resultado' : 'Nenhuma admissão demonstrativa encontrada.'}
        />
      ) : (
        <DataTable label="Tabela de admissões">
          <thead>
            <tr>
              <th>Colaborador</th>
              <th>Previsão</th>
              <th>Status</th>
              <th>Progresso</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {query.data?.map((item) => {
              const entries = item.checklistInstances[0]?.items ?? [];
              const done = entries.filter((entry) =>
                ['COMPLETED', 'NOT_APPLICABLE'].includes(entry.status),
              ).length;
              return (
                <tr key={item.id}>
                  <td>
                    <Link to={`/admissoes/${item.id}`}>{item.employee.legalName}</Link>
                  </td>
                  <td>{item.plannedAdmissionDate}</td>
                  <td className="ui-table-cell--compact">
                    <DataTableStatus
                      active={item.status !== 'CANCELLED'}
                      activeLabel={item.status}
                      inactiveLabel={item.status}
                    />
                  </td>
                  <td>
                    {entries.length
                      ? `${Math.round((done / entries.length) * 100)}%`
                      : 'Checklist não gerado'}
                  </td>
                  <td>
                    <DataTableActions>
                      <Link to={`/admissoes/${item.id}`}>Detalhes</Link>
                      {canManage && <Link to={`/admissoes/${item.id}/editar`}>Editar</Link>}
                    </DataTableActions>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      )}
    </section>
  );
}

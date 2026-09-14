import type { EmployeeContract } from '@dp-system/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { DataTable, DataTableActions, DataTableStatus } from '@/components/common/DataTable';
import { PageHeader } from '@/components/common/PageHeader';
import {
  Alert,
  Button,
  ClearFiltersButton,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  FilterBar,
  FilterSelect,
  LoadingState,
  SearchInput,
} from '@/components/common/Primitives';
import { useOptionalAuth } from '@/features/auth/AuthContext';
import { apiRequest } from '@/lib/api';
import { EmployeeForm } from './EmployeeForm';
import { type EmployeeValues, toEmployeeProfilePayload } from './employee-profile';

export function EmployeesPage() {
  const auth = useOptionalAuth();
  const canManage = auth?.hasCapability('employee.manage') ?? true;
  const [filters, setFilters] = useSearchParams();
  const search = filters.get('search') ?? '';
  const status = filters.get('status') ?? '';
  const [createOpen, setCreateOpen] = useState(filters.get('create') === 'true');
  const [pendingStatus, setPendingStatus] = useState<EmployeeContract | null>(null);
  const client = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const updateFilter = (key: 'search' | 'status', value: string) => {
    const next = new URLSearchParams(filters);
    if (value) next.set(key, value);
    else next.delete(key);
    setFilters(next, { replace: true });
  };
  const setCreateVisibility = (open: boolean) => {
    const next = new URLSearchParams(filters);
    if (open) next.set('create', 'true');
    else next.delete('create');
    setFilters(next, { replace: true });
    setCreateOpen(open);
  };
  const list = useQuery({
    queryKey: ['employees', auth?.activeCompanyId, search, status],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (status) params.set('status', status);
      const query = params.toString();
      return apiRequest<{ items: EmployeeContract[] }>(`/employees${query ? `?${query}` : ''}`);
    },
  });
  const hasFilters = Boolean(search || status);
  const create = useMutation({
    mutationFn: (values: EmployeeValues) =>
      apiRequest<EmployeeContract>('/employees', {
        method: 'POST',
        body: JSON.stringify(toEmployeeProfilePayload(values)),
      }),
    onSuccess: (employee) => {
      void client.invalidateQueries({ queryKey: ['employees'] });
      navigate(`/colaboradores/${employee.id}/contratos`);
    },
  });
  const toggle = useMutation({
    mutationFn: (employee: EmployeeContract) =>
      apiRequest(
        `/employees/${employee.id}/${employee.status === 'ACTIVE' ? 'inactivate' : 'activate'}`,
        { method: 'PATCH' },
      ),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['employees'] }),
  });

  return (
    <section aria-labelledby="employees-title">
      <PageHeader
        description="Ambiente demonstrativo: nenhum dado pessoal real deve ser informado."
        headingId="employees-title"
        title="Colaboradores"
      >
        {canManage ? (
          <Button
            aria-label="Novo colaborador"
            onClick={() => setCreateVisibility(true)}
            type="button"
          >
            + Novo colaborador
          </Button>
        ) : null}
      </PageHeader>

      <FilterBar>
        <SearchInput
          aria-label="Pesquisar colaboradores"
          onChange={(event) => updateFilter('search', event.target.value)}
          placeholder="Nome, nome preferido ou matrÃ­cula"
          value={search}
        />
        <FilterSelect
          aria-label="Filtrar colaboradores por status"
          label="Status"
          onChange={(event) => updateFilter('status', event.target.value)}
          value={status}
        >
          <option value="">Todos os status</option>
          <option value="ACTIVE">Ativos</option>
          <option value="INACTIVE">Inativos</option>
        </FilterSelect>
        <ClearFiltersButton
          disabled={!hasFilters}
          onClear={() => setFilters(new URLSearchParams(), { replace: true })}
        />
      </FilterBar>

      {createOpen ? (
        <EmployeeForm
          onCancel={() => setCreateVisibility(false)}
          onSubmit={(values) => create.mutate(values)}
          pending={create.isPending}
          submitLabel="Criar colaborador"
        />
      ) : null}
      {create.isError ? <Alert tone="danger">{create.error.message}</Alert> : null}
      {list.isLoading ? (
        <LoadingState label="Carregando colaboradores…" />
      ) : list.isError ? (
        <ErrorState message={list.error.message} onRetry={() => void list.refetch()} />
      ) : list.data?.items.length === 0 ? (
        <EmptyState
          action={
            canManage && !hasFilters ? (
              <Button
                aria-label="Novo colaborador"
                onClick={() => setCreateVisibility(true)}
                type="button"
              >
                + Novo colaborador
              </Button>
            ) : undefined
          }
          description={
            hasFilters
              ? 'Ajuste a busca ou o filtro para encontrar outros colaboradores.'
              : 'Cadastre o primeiro colaborador fictício para começar.'
          }
          title="Nenhum colaborador demonstrativo encontrado"
        />
      ) : (
        <DataTable label="Tabela de colaboradores">
          <thead>
            <tr>
              <th scope="col">Nome</th>
              <th scope="col">Status</th>
              <th scope="col">Ações</th>
            </tr>
          </thead>
          <tbody>
            {list.data?.items.map((employee) => (
              <tr key={employee.id}>
                <td>
                  <Link
                    state={{ from: `${location.pathname}${location.search}` }}
                    to={`/colaboradores/${employee.id}`}
                  >
                    {employee.preferredName || employee.legalName}
                  </Link>
                </td>
                <td className="ui-table-cell--compact">
                  <DataTableStatus active={employee.status === 'ACTIVE'} />
                </td>
                <td>
                  <DataTableActions>
                    <Link
                      className="ui-button ui-button--ghost"
                      state={{ from: `${location.pathname}${location.search}` }}
                      to={`/colaboradores/${employee.id}`}
                    >
                      Detalhes
                    </Link>
                    {canManage ? (
                      <Button
                        onClick={() => {
                          toggle.reset();
                          setPendingStatus(employee);
                        }}
                        type="button"
                        variant="ghost"
                      >
                        {employee.status === 'ACTIVE' ? 'Inativar' : 'Ativar'}
                      </Button>
                    ) : null}
                  </DataTableActions>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}

      <ConfirmDialog
        confirmLabel={
          pendingStatus?.status === 'ACTIVE' ? 'Inativar colaborador' : 'Ativar colaborador'
        }
        description="A alteração preserva o cadastro e o histórico do colaborador."
        error={toggle.isError ? toggle.error.message : undefined}
        onCancel={() => {
          toggle.reset();
          setPendingStatus(null);
        }}
        onConfirm={() => {
          if (!pendingStatus) return;
          toggle.mutate(pendingStatus, { onSuccess: () => setPendingStatus(null) });
        }}
        open={Boolean(pendingStatus)}
        pending={toggle.isPending}
        title="Confirmar alteração de status"
      />
    </section>
  );
}

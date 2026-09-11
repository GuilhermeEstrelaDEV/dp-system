import type { EmployeeContract } from '@dp-system/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DataTable, DataTableActions, DataTableStatus } from '@/components/common/DataTable';
import { PageHeader } from '@/components/common/PageHeader';
import {
  Alert,
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  FilterBar,
  Input,
  LoadingState,
  Select,
} from '@/components/common/Primitives';
import { useOptionalAuth } from '@/features/auth/AuthContext';
import { apiRequest } from '@/lib/api';
import { EmployeeForm } from './EmployeeForm';
import { type EmployeeValues, toEmployeeProfilePayload } from './employee-profile';

export function EmployeesPage() {
  const auth = useOptionalAuth();
  const canManage = auth?.hasCapability('employee.manage') ?? true;
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<EmployeeContract | null>(null);
  const client = useQueryClient();
  const navigate = useNavigate();
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
          <Button aria-label="Novo colaborador" onClick={() => setCreateOpen(true)} type="button">
            + Novo colaborador
          </Button>
        ) : null}
      </PageHeader>

      <FilterBar>
        <label className="ui-field">
          Buscar
          <Input
            aria-label="Pesquisar colaboradores"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Pesquisar por nome"
            type="search"
            value={search}
          />
        </label>
        <label className="ui-field">
          Status
          <Select
            aria-label="Filtrar colaboradores por status"
            onChange={(event) => setStatus(event.target.value)}
            value={status}
          >
            <option value="">Todos os status</option>
            <option value="ACTIVE">Ativos</option>
            <option value="INACTIVE">Inativos</option>
          </Select>
        </label>
      </FilterBar>

      {createOpen ? (
        <EmployeeForm
          onCancel={() => setCreateOpen(false)}
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
            canManage && !search && !status ? (
              <Button
                aria-label="Novo colaborador"
                onClick={() => setCreateOpen(true)}
                type="button"
              >
                + Novo colaborador
              </Button>
            ) : undefined
          }
          description={
            search || status
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
                  <Link to={`/colaboradores/${employee.id}`}>
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

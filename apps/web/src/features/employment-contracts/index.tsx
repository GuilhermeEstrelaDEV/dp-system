import type { EmploymentContractContract } from '@dp-system/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DataTable, DataTableActions, DataTableStatus } from '@/components/common/DataTable';
import { PageHeader } from '@/components/common/PageHeader';
import {
  Alert,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  FilterBar,
  Input,
  LoadingState,
} from '@/components/common/Primitives';
import { useOptionalAuth } from '@/features/auth/AuthContext';
import { apiRequest } from '@/lib/api';
import { ContractForm, type ContractValues } from './ContractForm';

type ContractDetails = EmploymentContractContract & {
  employee: { legalName: string };
  company: { tradeName: string };
  history: Array<{ id: string; action: string; reason: string | null; occurredAt: string }>;
};

function payload(values: ContractValues, update = false) {
  const result: Record<string, string | number | null> = {};
  for (const [key, value] of Object.entries(values)) {
    if (value !== '') {
      result[key] = value;
      continue;
    }
    if (update && ['branchId', 'departmentId', 'costCenterId', 'endDate'].includes(key)) {
      result[key] = null;
    }
  }
  return result;
}

export function EmploymentContractsPage() {
  const auth = useOptionalAuth();
  const canManage = auth?.hasCapability('contract.manage') ?? true;
  const { employeeId } = useParams();
  const [formOpen, setFormOpen] = useState(Boolean(employeeId));
  const [search, setSearch] = useState('');
  const client = useQueryClient();
  const list = useQuery({
    queryKey: ['employment-contracts', auth?.activeCompanyId, employeeId, search],
    queryFn: () =>
      apiRequest<{ items: ContractDetails[] }>(
        `/employment-contracts?search=${encodeURIComponent(search)}${employeeId ? `&employeeId=${employeeId}` : ''}`,
      ),
  });
  const create = useMutation({
    mutationFn: (values: ContractValues) =>
      apiRequest<EmploymentContractContract>('/employment-contracts', {
        method: 'POST',
        body: JSON.stringify(payload(values)),
      }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['employment-contracts'] });
      void client.invalidateQueries({ queryKey: ['employee'] });
      setFormOpen(false);
    },
  });

  return (
    <section aria-labelledby="contracts-title">
      <PageHeader
        description="Vínculos de trabalho demonstrativos, sem salário, documentos ou regras legais não aprovadas."
        headingId="contracts-title"
        title="Contratos de trabalho"
      >
        {canManage ? (
          <Button aria-label="Novo contrato" onClick={() => setFormOpen(true)} type="button">
            + Novo contrato
          </Button>
        ) : null}
      </PageHeader>

      <FilterBar>
        <label className="ui-field">
          Buscar
          <Input
            aria-label="Pesquisar contratos"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Pesquisar por matrícula ou nome"
            type="search"
            value={search}
          />
        </label>
      </FilterBar>

      {formOpen ? (
        <ContractForm
          companyId={auth?.activeCompanyId ?? undefined}
          employeeId={employeeId}
          onCancel={() => setFormOpen(false)}
          onSubmit={(values) => create.mutate(values)}
          pending={create.isPending}
        />
      ) : null}
      {create.isError ? <Alert tone="danger">{create.error.message}</Alert> : null}

      {list.isLoading ? (
        <LoadingState label="Carregando contratos…" />
      ) : list.isError ? (
        <ErrorState message={list.error.message} onRetry={() => void list.refetch()} />
      ) : list.data?.items.length === 0 ? (
        <EmptyState
          action={
            canManage && !search ? (
              <Button aria-label="Novo contrato" onClick={() => setFormOpen(true)} type="button">
                + Novo contrato
              </Button>
            ) : undefined
          }
          description={
            search
              ? 'Ajuste a busca para encontrar outros contratos.'
              : 'Crie o primeiro vínculo de trabalho fictício neste contexto.'
          }
          title="Nenhum contrato demonstrativo encontrado"
        />
      ) : (
        <DataTable label="Tabela de contratos de trabalho">
          <thead>
            <tr>
              <th scope="col">Matrícula</th>
              <th scope="col">Colaborador</th>
              <th scope="col">Empresa</th>
              <th scope="col">Status</th>
              <th scope="col">Ações</th>
            </tr>
          </thead>
          <tbody>
            {list.data?.items.map((contract) => (
              <tr key={contract.id}>
                <td className="ui-table-cell--compact">{contract.registrationNumber}</td>
                <td>{contract.employee?.legalName ?? contract.employeeId}</td>
                <td>{contract.company?.tradeName ?? contract.companyId}</td>
                <td className="ui-table-cell--compact">
                  <DataTableStatus active={contract.status === 'ACTIVE'} />
                </td>
                <td>
                  <DataTableActions>
                    <Link className="ui-button ui-button--ghost" to={`/contratos/${contract.id}`}>
                      Detalhes
                    </Link>
                  </DataTableActions>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}
    </section>
  );
}

export function EmploymentContractDetailsPage() {
  const auth = useOptionalAuth();
  const canManage = auth?.hasCapability('contract.manage') ?? true;
  const { contractId = '' } = useParams();
  const client = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [confirmingStatus, setConfirmingStatus] = useState(false);
  const contract = useQuery({
    queryKey: ['employment-contract', auth?.activeCompanyId, contractId],
    queryFn: () => apiRequest<ContractDetails>(`/employment-contracts/${contractId}`),
  });
  const update = useMutation({
    mutationFn: (values: ContractValues) =>
      apiRequest<ContractDetails>(`/employment-contracts/${contractId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload(values, true)),
      }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['employment-contract'] });
      void client.invalidateQueries({ queryKey: ['employment-contracts'] });
      void client.invalidateQueries({ queryKey: ['employee'] });
      setEditing(false);
    },
  });
  const toggle = useMutation({
    mutationFn: (status: string) =>
      apiRequest(
        `/employment-contracts/${contractId}/${status === 'ACTIVE' ? 'inactivate' : 'activate'}`,
        { method: 'PATCH', body: JSON.stringify({ reason: 'Alteração demonstrativa de status' }) },
      ),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['employment-contract'] });
      void client.invalidateQueries({ queryKey: ['employment-contracts'] });
      setConfirmingStatus(false);
    },
  });

  if (contract.isLoading) return <LoadingState label="Carregando contrato…" />;
  if (contract.isError)
    return <ErrorState message={contract.error.message} onRetry={() => void contract.refetch()} />;

  const item = contract.data!;

  return (
    <section aria-labelledby="contract-details-title">
      <PageHeader
        description="Histórico operacional demonstrativo, sem valores de remuneração."
        headingId="contract-details-title"
        title={`Contrato ${item.registrationNumber}`}
      >
        {canManage ? (
          <DataTableActions>
            <Button onClick={() => setEditing(true)} type="button" variant="secondary">
              Editar contrato
            </Button>
            <Button
              onClick={() => {
                toggle.reset();
                setConfirmingStatus(true);
              }}
              type="button"
            >
              {item.status === 'ACTIVE' ? 'Inativar contrato' : 'Ativar contrato'}
            </Button>
          </DataTableActions>
        ) : null}
      </PageHeader>

      {editing ? (
        <ContractForm
          initialValues={{
            employeeId: item.employeeId,
            companyId: item.companyId,
            branchId: item.branchId ?? '',
            departmentId: item.departmentId ?? '',
            positionId: item.positionId,
            costCenterId: item.costCenterId ?? '',
            registrationNumber: item.registrationNumber,
            contractType: item.contractType,
            employmentRegime: item.employmentRegime,
            startDate: item.startDate.slice(0, 10),
            endDate: item.endDate?.slice(0, 10) ?? '',
            weeklyHours: item.weeklyHours,
            reason: '',
          }}
          onCancel={() => setEditing(false)}
          onSubmit={(values) => update.mutate(values)}
          pending={update.isPending}
          submitLabel="Salvar alterações"
        />
      ) : null}
      {update.isError ? <Alert tone="danger">{update.error.message}</Alert> : null}
      {update.isSuccess ? <Alert tone="success">Contrato atualizado com sucesso.</Alert> : null}

      <Card>
        <dl className="ui-details-list">
          <div>
            <dt>Colaborador</dt>
            <dd>{item.employee?.legalName ?? item.employeeId}</dd>
          </div>
          <div>
            <dt>Empresa</dt>
            <dd>{item.company?.tradeName ?? item.companyId}</dd>
          </div>
          <div>
            <dt>Regime</dt>
            <dd>{item.employmentRegime}</dd>
          </div>
          <div>
            <dt>Tipo</dt>
            <dd>{item.contractType}</dd>
          </div>
          <div>
            <dt>Início</dt>
            <dd>{item.startDate.slice(0, 10)}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>
              <DataTableStatus active={item.status === 'ACTIVE'} />
            </dd>
          </div>
        </dl>
      </Card>

      <section aria-labelledby="contract-history-title" className="mt-6">
        <h2 id="contract-history-title">Histórico contratual</h2>
        {item.history.length ? (
          <ol className="grid gap-3">
            {item.history.map((entry) => (
              <li key={entry.id}>
                <strong>{entry.action}</strong>
                {entry.reason ? ` — ${entry.reason}` : ''}
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState
            description="As próximas alterações auditadas aparecerão aqui."
            title="Nenhum histórico registrado"
          />
        )}
      </section>

      <ConfirmDialog
        confirmLabel={item.status === 'ACTIVE' ? 'Inativar contrato' : 'Ativar contrato'}
        description="A ação altera somente o status e preserva integralmente o histórico contratual."
        error={toggle.isError ? toggle.error.message : undefined}
        onCancel={() => {
          toggle.reset();
          setConfirmingStatus(false);
        }}
        onConfirm={() => toggle.mutate(item.status)}
        open={confirmingStatus}
        pending={toggle.isPending}
        title="Confirmar alteração do contrato"
      />
    </section>
  );
}

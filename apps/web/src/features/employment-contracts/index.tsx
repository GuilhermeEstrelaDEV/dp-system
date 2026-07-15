import type { EmploymentContractContract } from '@dp-system/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { apiRequest } from '@/lib/api';
import { ContractForm, type ContractValues } from './ContractForm';

type ContractDetails = EmploymentContractContract & {
  employee: { legalName: string };
  company: { tradeName: string };
  history: Array<{ id: string; action: string; reason: string | null; occurredAt: string }>;
};
function payload(values: ContractValues) {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== ''));
}
export function EmploymentContractsPage() {
  const { employeeId } = useParams();
  const [formOpen, setFormOpen] = useState(Boolean(employeeId));
  const [search, setSearch] = useState('');
  const client = useQueryClient();
  const list = useQuery({
    queryKey: ['employment-contracts', employeeId, search],
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
      setFormOpen(false);
    },
  });
  return (
    <section aria-labelledby="contracts-title">
      <PageHeader
        title="Contratos de trabalho"
        description="Ambiente demonstrativo: não informe salário, documentos ou outros dados não aprovados."
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input
          aria-label="Pesquisar contratos"
          className="rounded border p-2"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Pesquisar por matrícula ou nome"
        />
        <button type="button" onClick={() => setFormOpen((value) => !value)}>
          Novo contrato
        </button>
      </div>
      {formOpen && (
        <ContractForm employeeId={employeeId} onSubmit={(values) => create.mutate(values)} />
      )}
      {create.isError && <p role="alert">{create.error.message}</p>}
      {list.isLoading ? (
        <p role="status">Carregando contratos…</p>
      ) : list.isError ? (
        <p role="alert">{list.error.message}</p>
      ) : list.data?.items.length === 0 ? (
        <p>Nenhum contrato demonstrativo encontrado.</p>
      ) : (
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Matrícula</th>
                <th>Colaborador</th>
                <th>Empresa</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {list.data?.items.map((contract) => (
                <tr key={contract.id}>
                  <td>
                    <Link to={`/contratos/${contract.id}`}>{contract.registrationNumber}</Link>
                  </td>
                  <td>{contract.employee?.legalName ?? contract.employeeId}</td>
                  <td>{contract.company?.tradeName ?? contract.companyId}</td>
                  <td>{contract.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
export function EmploymentContractDetailsPage() {
  const { contractId = '' } = useParams();
  const client = useQueryClient();
  const contract = useQuery({
    queryKey: ['employment-contract', contractId],
    queryFn: () => apiRequest<ContractDetails>(`/employment-contracts/${contractId}`),
  });
  const toggle = useMutation({
    mutationFn: (status: string) =>
      apiRequest(
        `/employment-contracts/${contractId}/${status === 'ACTIVE' ? 'inactivate' : 'activate'}`,
        { method: 'PATCH', body: JSON.stringify({ reason: 'Alteração demonstrativa de status' }) },
      ),
    onSuccess: () =>
      void client.invalidateQueries({ queryKey: ['employment-contract', contractId] }),
  });
  if (contract.isLoading) return <p role="status">Carregando contrato…</p>;
  if (contract.isError) return <p role="alert">{contract.error.message}</p>;
  const item = contract.data!;
  return (
    <section aria-labelledby="contract-details-title">
      <PageHeader
        title={`Contrato ${item.registrationNumber}`}
        description="Histórico operacional demonstrativo, sem valores de remuneração."
      />
      <p>Colaborador: {item.employee?.legalName ?? item.employeeId}</p>
      <p>Status: {item.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}</p>
      <button type="button" onClick={() => toggle.mutate(item.status)}>
        {item.status === 'ACTIVE' ? 'Inativar contrato' : 'Ativar contrato'}
      </button>
      <section className="mt-6" aria-labelledby="contract-history-title">
        <h2 id="contract-history-title">Histórico contratual</h2>
        {item.history.length ? (
          <ol>
            {item.history.map((entry) => (
              <li key={entry.id}>
                {entry.action}
                {entry.reason ? ` — ${entry.reason}` : ''}
              </li>
            ))}
          </ol>
        ) : (
          <p>Nenhum histórico registrado.</p>
        )}
      </section>
    </section>
  );
}

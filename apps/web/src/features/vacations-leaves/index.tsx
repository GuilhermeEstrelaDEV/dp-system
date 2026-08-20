import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { DataTable, DataTableActions, DataTableStatus } from '@/components/common/DataTable';
import { PageHeader } from '@/components/common/PageHeader';
import { useOptionalAuth } from '@/features/auth/AuthContext';
import { apiRequest } from '@/lib/api';

type LeaveType = {
  id: string;
  code: string;
  name: string;
  requiresExpectedReturn: boolean;
  status: string;
};
type LeaveCase = {
  id: string;
  startDate: string;
  expectedReturnDate?: string;
  actualReturnDate?: string;
  status: string;
  leaveType: { name: string };
  employmentContract: { registrationNumber: string };
};

export function VacationsLeavesPage() {
  const auth = useOptionalAuth();
  const canManage = auth?.hasCapability('leave.manage') ?? true;
  const client = useQueryClient();
  const [returning, setReturning] = useState<LeaveCase>();
  const types = useQuery({
    queryKey: ['leave-types', auth?.activeCompanyId],
    queryFn: () => apiRequest<LeaveType[]>('/leave-types'),
  });
  const leaves = useQuery({
    queryKey: ['leave-cases', auth?.activeCompanyId],
    queryFn: () => apiRequest<LeaveCase[]>('/leave-cases'),
  });
  const createType = useMutation({
    mutationFn: (form: FormData) =>
      apiRequest('/leave-types', {
        method: 'POST',
        body: JSON.stringify({
          code: form.get('code'),
          name: form.get('name'),
          requiresExpectedReturn: form.get('requiresExpectedReturn') === 'on',
        }),
      }),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['leave-types'] }),
  });
  const createLeave = useMutation({
    mutationFn: (form: FormData) =>
      apiRequest('/leave-cases', {
        method: 'POST',
        body: JSON.stringify({
          employmentContractId: form.get('employmentContractId'),
          leaveTypeId: form.get('leaveTypeId'),
          startDate: form.get('startDate'),
          expectedReturnDate: form.get('expectedReturnDate') || undefined,
          reason: form.get('reason') || undefined,
        }),
      }),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['leave-cases'] }),
  });
  const registerReturn = useMutation({
    mutationFn: ({ id, form }: { id: string; form: FormData }) =>
      apiRequest(`/leave-cases/${id}/return`, {
        method: 'POST',
        body: JSON.stringify({
          actualReturnDate: form.get('actualReturnDate'),
          reason: form.get('reason') || undefined,
        }),
      }),
    onSuccess: () => {
      setReturning(undefined);
      void client.invalidateQueries({ queryKey: ['leave-cases'] });
    },
  });

  return (
    <section aria-labelledby="leaves-title">
      <PageHeader
        title="Afastamentos"
        description="Controles administrativos da empresa ativa. Não há regra legal, cálculo financeiro ou decisão automática."
      />
      {canManage && (
        <div className="grid gap-6 lg:grid-cols-2">
          <form
            className="grid gap-3 rounded border p-4"
            onSubmit={(event) => {
              event.preventDefault();
              createType.mutate(new FormData(event.currentTarget));
            }}
          >
            <h2>Novo tipo de afastamento</h2>
            <label>
              Código
              <input name="code" required />
            </label>
            <label>
              Nome
              <input name="name" required />
            </label>
            <label className="flex gap-2">
              <input name="requiresExpectedReturn" type="checkbox" /> Exigir retorno previsto
            </label>
            <button disabled={createType.isPending}>Cadastrar tipo</button>
          </form>
          <form
            className="grid gap-3 rounded border p-4"
            onSubmit={(event) => {
              event.preventDefault();
              createLeave.mutate(new FormData(event.currentTarget));
            }}
          >
            <h2>Novo afastamento</h2>
            <label>
              Contrato
              <input name="employmentContractId" required />
            </label>
            <label>
              Tipo
              <select name="leaveTypeId" required>
                <option value="">Selecione</option>
                {types.data
                  ?.filter((item) => item.status === 'ACTIVE')
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.code} — {item.name}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Início
              <input name="startDate" type="date" required />
            </label>
            <label>
              Retorno previsto
              <input name="expectedReturnDate" type="date" />
            </label>
            <label>
              Motivo administrativo fictício
              <input name="reason" />
            </label>
            <button disabled={createLeave.isPending}>Registrar afastamento</button>
          </form>
        </div>
      )}
      {types.isError || leaves.isError ? (
        <p role="alert">{types.error?.message ?? leaves.error?.message}</p>
      ) : null}
      {createType.isError || createLeave.isError ? (
        <p role="alert">{createType.error?.message ?? createLeave.error?.message}</p>
      ) : null}
      {leaves.isLoading ? <p role="status">Carregando afastamentos…</p> : null}
      {leaves.data?.length === 0 ? <p>Nenhum afastamento demonstrativo encontrado.</p> : null}
      {leaves.data?.length ? (
        <DataTable label="Tabela de afastamentos">
          <thead>
            <tr>
              <th>Contrato</th>
              <th>Tipo</th>
              <th>Início</th>
              <th>Retorno previsto</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {leaves.data.map((item) => (
              <tr key={item.id}>
                <td className="ui-table-cell--compact">
                  {item.employmentContract.registrationNumber}
                </td>
                <td>{item.leaveType.name}</td>
                <td className="ui-table-cell--compact">{item.startDate.slice(0, 10)}</td>
                <td className="ui-table-cell--compact">
                  {item.expectedReturnDate?.slice(0, 10) ?? '—'}
                </td>
                <td className="ui-table-cell--compact">
                  <DataTableStatus
                    active={item.status === 'OPEN'}
                    activeLabel="Aberto"
                    inactiveLabel="Retornado"
                  />
                </td>
                <td>
                  <DataTableActions>
                    {canManage && item.status === 'OPEN' && (
                      <button type="button" onClick={() => setReturning(item)}>
                        Registrar retorno
                      </button>
                    )}
                  </DataTableActions>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      ) : null}
      {returning && (
        <form
          className="mt-5 grid max-w-xl gap-3 rounded border p-4"
          onSubmit={(event) => {
            event.preventDefault();
            registerReturn.mutate({ id: returning.id, form: new FormData(event.currentTarget) });
          }}
        >
          <h2>Retorno de {returning.leaveType.name}</h2>
          <label>
            Data efetiva
            <input name="actualReturnDate" type="date" required />
          </label>
          <label>
            Motivo administrativo fictício
            <input name="reason" />
          </label>
          <DataTableActions>
            <button disabled={registerReturn.isPending}>Confirmar retorno</button>
            <button type="button" onClick={() => setReturning(undefined)}>
              Cancelar
            </button>
          </DataTableActions>
          {registerReturn.isError && <p role="alert">{registerReturn.error.message}</p>}
        </form>
      )}
    </section>
  );
}

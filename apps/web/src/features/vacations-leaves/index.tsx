import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
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

type VacationPeriod = {
  id: string;
  employmentContractId: string;
  accrualStart: string;
  accrualEnd: string;
  grantStart?: string | null;
  grantEnd?: string | null;
  status: string;
  _count: { requests: number; alerts: number };
};

type VacationRequest = {
  id: string;
  employmentContractId: string;
  vacationPeriodId: string;
  startDate: string;
  endDate: string;
  status: string;
  vacationPeriod: { accrualStart: string; accrualEnd: string; status: string };
};

export function VacationManagementPage() {
  const auth = useOptionalAuth();
  const canManage = auth?.hasCapability('vacation.manage') ?? true;
  const client = useQueryClient();
  const [contractId, setContractId] = useState('');
  const periods = useQuery({
    queryKey: ['vacation-periods', auth?.activeCompanyId, contractId],
    queryFn: () =>
      apiRequest<VacationPeriod[]>(
        `/vacation-periods${contractId ? `?employmentContractId=${contractId}` : ''}`,
      ),
  });
  const requests = useQuery({
    queryKey: ['vacation-requests', auth?.activeCompanyId, contractId],
    queryFn: () =>
      apiRequest<VacationRequest[]>(
        `/vacation-requests${contractId ? `?employmentContractId=${contractId}` : ''}`,
      ),
  });
  const invalidate = () => {
    void client.invalidateQueries({ queryKey: ['vacation-periods'] });
    void client.invalidateQueries({ queryKey: ['vacation-requests'] });
  };
  const createPeriod = useMutation({
    mutationFn: (form: FormData) =>
      apiRequest('/vacation-periods', {
        method: 'POST',
        body: JSON.stringify({
          employmentContractId: form.get('employmentContractId'),
          accrualStart: form.get('accrualStart'),
          accrualEnd: form.get('accrualEnd'),
          grantStart: form.get('grantStart') || undefined,
          grantEnd: form.get('grantEnd') || undefined,
          notes: form.get('notes') || undefined,
        }),
      }),
    onSuccess: invalidate,
  });
  const createRequest = useMutation({
    mutationFn: (form: FormData) =>
      apiRequest('/vacation-requests', {
        method: 'POST',
        body: JSON.stringify({
          employmentContractId: form.get('employmentContractId'),
          vacationPeriodId: form.get('vacationPeriodId'),
          collectiveVacationId: form.get('collectiveVacationId') || undefined,
          startDate: form.get('startDate'),
          endDate: form.get('endDate'),
          requestReason: form.get('requestReason') || undefined,
        }),
      }),
    onSuccess: invalidate,
  });
  const createCollective = useMutation({
    mutationFn: (form: FormData) =>
      apiRequest('/collective-vacations', {
        method: 'POST',
        body: JSON.stringify({
          name: form.get('name'),
          startDate: form.get('startDate'),
          endDate: form.get('endDate'),
          notes: form.get('notes') || undefined,
        }),
      }),
    onSuccess: invalidate,
  });
  const decide = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'cancel' }) =>
      apiRequest(`/vacation-requests/${id}/${action}`, {
        method: 'POST',
        body: JSON.stringify({
          reason: action === 'cancel' ? 'Cancelamento administrativo fictício.' : undefined,
        }),
      }),
    onSuccess: invalidate,
  });
  const mutationError =
    createPeriod.error ?? createRequest.error ?? createCollective.error ?? decide.error;

  return (
    <section aria-labelledby="vacation-title">
      <PageHeader
        title="Férias"
        description="Fluxo administrativo da empresa ativa baseado somente no modelo existente, sem cálculo ou política trabalhista inferida."
      />
      <label>
        Filtrar por contrato
        <input value={contractId} onChange={(event) => setContractId(event.target.value)} />
      </label>
      {canManage && (
        <div className="grid gap-6 lg:grid-cols-3">
          <VacationForm title="Novo período aquisitivo" mutation={createPeriod}>
            <label>
              Contrato
              <input name="employmentContractId" required />
            </label>
            <label>
              Início aquisitivo
              <input name="accrualStart" type="date" required />
            </label>
            <label>
              Fim aquisitivo
              <input name="accrualEnd" type="date" required />
            </label>
            <label>
              Início concessivo
              <input name="grantStart" type="date" />
            </label>
            <label>
              Fim concessivo
              <input name="grantEnd" type="date" />
            </label>
            <label>
              Nota administrativa fictícia
              <input name="notes" />
            </label>
          </VacationForm>
          <VacationForm title="Nova solicitação" mutation={createRequest}>
            <label>
              Contrato
              <input name="employmentContractId" required />
            </label>
            <label>
              Período
              <select name="vacationPeriodId" required>
                <option value="">Selecione</option>
                {periods.data?.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.accrualStart.slice(0, 10)} — {item.accrualEnd.slice(0, 10)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Férias coletivas opcionais
              <input name="collectiveVacationId" />
            </label>
            <label>
              Início
              <input name="startDate" type="date" required />
            </label>
            <label>
              Fim
              <input name="endDate" type="date" required />
            </label>
            <label>
              Motivo administrativo
              <input name="requestReason" />
            </label>
          </VacationForm>
          <VacationForm title="Férias coletivas" mutation={createCollective}>
            <label>
              Nome
              <input name="name" required />
            </label>
            <label>
              Início
              <input name="startDate" type="date" required />
            </label>
            <label>
              Fim
              <input name="endDate" type="date" required />
            </label>
            <label>
              Nota administrativa fictícia
              <input name="notes" />
            </label>
          </VacationForm>
        </div>
      )}
      {mutationError && <p role="alert">{mutationError.message}</p>}
      {periods.isError || requests.isError ? (
        <p role="alert">{periods.error?.message ?? requests.error?.message}</p>
      ) : null}
      <h2>Períodos aquisitivos</h2>
      {periods.isLoading ? <p role="status">Carregando períodos…</p> : null}
      {periods.data?.length === 0 ? <p>Nenhum período demonstrativo encontrado.</p> : null}
      {periods.data?.length ? (
        <DataTable label="Tabela de períodos de férias">
          <thead>
            <tr>
              <th>Contrato</th>
              <th>Aquisição</th>
              <th>Concessão</th>
              <th>Solicitações</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {periods.data.map((item) => (
              <tr key={item.id}>
                <td className="ui-table-cell--compact">{item.employmentContractId}</td>
                <td className="ui-table-cell--compact">
                  {item.accrualStart.slice(0, 10)} — {item.accrualEnd.slice(0, 10)}
                </td>
                <td className="ui-table-cell--compact">
                  {item.grantStart?.slice(0, 10) ?? '—'} — {item.grantEnd?.slice(0, 10) ?? '—'}
                </td>
                <td>{item._count.requests}</td>
                <td>
                  <DataTableStatus
                    active={item.status === 'OPEN'}
                    activeLabel={item.status}
                    inactiveLabel={item.status}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      ) : null}
      <h2>Solicitações</h2>
      {requests.isLoading ? <p role="status">Carregando solicitações…</p> : null}
      {requests.data?.length === 0 ? <p>Nenhuma solicitação demonstrativa encontrada.</p> : null}
      {requests.data?.length ? (
        <DataTable label="Tabela de solicitações de férias">
          <thead>
            <tr>
              <th>Contrato</th>
              <th>Período solicitado</th>
              <th>Aquisitivo</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {requests.data.map((item) => (
              <tr key={item.id}>
                <td className="ui-table-cell--compact">{item.employmentContractId}</td>
                <td className="ui-table-cell--compact">
                  {item.startDate.slice(0, 10)} — {item.endDate.slice(0, 10)}
                </td>
                <td className="ui-table-cell--compact">
                  {item.vacationPeriod.accrualStart.slice(0, 10)} —{' '}
                  {item.vacationPeriod.accrualEnd.slice(0, 10)}
                </td>
                <td>
                  <DataTableStatus
                    active={!['CANCELLED'].includes(item.status)}
                    activeLabel={item.status}
                    inactiveLabel={item.status}
                  />
                </td>
                <td>
                  <DataTableActions>
                    {canManage && !['APPROVED', 'CANCELLED'].includes(item.status) && (
                      <>
                        <button
                          type="button"
                          onClick={() => decide.mutate({ id: item.id, action: 'approve' })}
                        >
                          Aprovar
                        </button>
                        <button
                          type="button"
                          onClick={() => decide.mutate({ id: item.id, action: 'cancel' })}
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                  </DataTableActions>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      ) : null}
    </section>
  );
}

function VacationForm({
  title,
  mutation,
  children,
}: {
  readonly title: string;
  readonly mutation: { mutate(form: FormData): void; isPending: boolean };
  readonly children: ReactNode;
}) {
  return (
    <form
      className="grid gap-3 rounded border p-4"
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate(new FormData(event.currentTarget));
      }}
    >
      <h2>{title}</h2>
      {children}
      <DataTableActions>
        <button disabled={mutation.isPending}>Salvar</button>
      </DataTableActions>
    </form>
  );
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { DataTable, DataTableActions, DataTableStatus } from '@/components/common/DataTable';
import { PageHeader } from '@/components/common/PageHeader';
import { useOptionalAuth } from '@/features/auth/AuthContext';
import { apiRequest } from '@/lib/api';

type TimeEntry = {
  id: string;
  employmentContractId: string;
  occurredOn: string;
  type: string;
  minutes: number;
  status: string;
};
type Schedule = {
  id: string;
  code: string;
  name: string;
  weeklyMinutes: number;
  status: string;
  periods: Array<{
    id: string;
    weekday: number;
    startMinute: number;
    endMinute: number;
    breakMinutes: number;
  }>;
};
type Balance = {
  minutes: number;
  entries: Array<{ id: string; occurredOn: string; type: string; minutes: number }>;
};

const invalidateTime = (client: ReturnType<typeof useQueryClient>) => {
  void client.invalidateQueries({ queryKey: ['work-schedules'] });
  void client.invalidateQueries({ queryKey: ['time-entries'] });
  void client.invalidateQueries({ queryKey: ['time-balance'] });
};

export function TimeManagementPage() {
  const auth = useOptionalAuth();
  const canManage = auth?.hasCapability('time.manage') ?? true;
  const client = useQueryClient();
  const [contractId, setContractId] = useState('');
  const schedules = useQuery({
    queryKey: ['work-schedules', auth?.activeCompanyId],
    queryFn: () => apiRequest<Schedule[]>('/work-schedules'),
  });
  const entries = useQuery({
    queryKey: ['time-entries', auth?.activeCompanyId],
    queryFn: () => apiRequest<TimeEntry[]>('/time-entries'),
  });
  const balance = useQuery({
    enabled: Boolean(contractId),
    queryKey: ['time-balance', auth?.activeCompanyId, contractId],
    queryFn: () => apiRequest<Balance>(`/employment-contracts/${contractId}/time-balance`),
  });
  const createSchedule = useMutation({
    mutationFn: (form: FormData) =>
      apiRequest('/work-schedules', {
        method: 'POST',
        body: JSON.stringify({
          code: form.get('code'),
          name: form.get('name'),
          weeklyMinutes: Number(form.get('weeklyMinutes')),
          periods: [
            {
              weekday: Number(form.get('weekday')),
              startMinute: Number(form.get('startMinute')),
              endMinute: Number(form.get('endMinute')),
              breakMinutes: Number(form.get('breakMinutes')),
            },
          ],
        }),
      }),
    onSuccess: () => invalidateTime(client),
  });
  const assign = useMutation({
    mutationFn: (form: FormData) =>
      apiRequest(
        `/employment-contracts/${String(form.get('employmentContractId'))}/work-schedules`,
        {
          method: 'POST',
          body: JSON.stringify({
            workScheduleId: form.get('workScheduleId'),
            validFrom: form.get('validFrom'),
            validTo: form.get('validTo') || undefined,
            reason: form.get('reason') || undefined,
          }),
        },
      ),
    onSuccess: () => invalidateTime(client),
  });
  const createHoliday = useMutation({
    mutationFn: (form: FormData) =>
      apiRequest('/holidays', {
        method: 'POST',
        body: JSON.stringify({
          holidayDate: form.get('holidayDate'),
          name: form.get('name'),
          scope: 'COMPANY',
        }),
      }),
  });
  const createEntry = useMutation({
    mutationFn: (form: FormData) =>
      apiRequest('/time-entries', {
        method: 'POST',
        body: JSON.stringify({
          employmentContractId: form.get('employmentContractId'),
          occurredOn: form.get('occurredOn'),
          type: form.get('type'),
          minutes: Number(form.get('minutes')),
          reason: form.get('reason') || undefined,
        }),
      }),
    onSuccess: () => invalidateTime(client),
  });
  const close = useMutation({
    mutationFn: (form: FormData) =>
      apiRequest('/time-balance-closings', {
        method: 'POST',
        body: JSON.stringify({
          referenceMonth: `${String(form.get('referenceMonth'))}-01`,
          reason: form.get('reason') || undefined,
        }),
      }),
    onSuccess: () => invalidateTime(client),
  });
  const mutationError =
    createSchedule.error ?? assign.error ?? createHoliday.error ?? createEntry.error ?? close.error;

  return (
    <section aria-labelledby="time-title">
      <PageHeader
        title="Jornada e banco de horas"
        description="Controles internos da empresa ativa, sem definição de jornada legal, tolerância, adicional ou regra sindical."
      />
      {canManage && (
        <div className="grid gap-6 lg:grid-cols-2">
          <MutationForm title="Nova jornada" mutation={createSchedule}>
            <label>
              Código
              <input name="code" required />
            </label>
            <label>
              Nome
              <input name="name" required />
            </label>
            <label>
              Minutos semanais
              <input name="weeklyMinutes" type="number" min="1" required />
            </label>
            <label>
              Dia da semana (0–6)
              <input name="weekday" type="number" min="0" max="6" required />
            </label>
            <label>
              Minuto inicial
              <input name="startMinute" type="number" min="0" max="1439" required />
            </label>
            <label>
              Minuto final
              <input name="endMinute" type="number" min="1" max="1440" required />
            </label>
            <label>
              Intervalo em minutos
              <input name="breakMinutes" type="number" min="0" defaultValue="0" />
            </label>
          </MutationForm>
          <MutationForm title="Atribuir jornada" mutation={assign}>
            <label>
              Contrato
              <input name="employmentContractId" required />
            </label>
            <label>
              Jornada
              <select name="workScheduleId" required>
                <option value="">Selecione</option>
                {schedules.data?.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code} — {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Início
              <input name="validFrom" type="date" required />
            </label>
            <label>
              Fim opcional
              <input name="validTo" type="date" />
            </label>
            <label>
              Motivo administrativo
              <input name="reason" />
            </label>
          </MutationForm>
          <MutationForm title="Novo feriado empresarial" mutation={createHoliday}>
            <label>
              Data
              <input name="holidayDate" type="date" required />
            </label>
            <label>
              Nome
              <input name="name" required />
            </label>
          </MutationForm>
          <MutationForm title="Nova ocorrência" mutation={createEntry}>
            <label>
              Contrato
              <input name="employmentContractId" required />
            </label>
            <label>
              Data
              <input name="occurredOn" type="date" required />
            </label>
            <label>
              Tipo
              <select name="type">
                <option value="WORKED">Trabalhado</option>
                <option value="OVERTIME">Crédito operacional</option>
                <option value="DELAY">Atraso</option>
                <option value="ABSENCE">Ausência</option>
                <option value="ADJUSTMENT">Ajuste</option>
              </select>
            </label>
            <label>
              Minutos
              <input name="minutes" type="number" required />
            </label>
            <label>
              Justificativa
              <input name="reason" />
            </label>
          </MutationForm>
          <MutationForm title="Fechar competência de saldo" mutation={close}>
            <label>
              Referência
              <input name="referenceMonth" type="month" required />
            </label>
            <label>
              Justificativa
              <input name="reason" />
            </label>
          </MutationForm>
        </div>
      )}
      {mutationError && <p role="alert">{mutationError.message}</p>}
      {schedules.isError || entries.isError ? (
        <p role="alert">{schedules.error?.message ?? entries.error?.message}</p>
      ) : null}
      <h2>Jornadas configuradas</h2>
      {schedules.isLoading ? <p role="status">Carregando jornadas…</p> : null}
      {schedules.data?.length === 0 ? <p>Nenhuma jornada demonstrativa.</p> : null}
      {schedules.data?.length ? (
        <DataTable label="Tabela de jornadas">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nome</th>
              <th>Minutos semanais</th>
              <th>Períodos</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {schedules.data.map((item) => (
              <tr key={item.id}>
                <td className="ui-table-cell--compact">{item.code}</td>
                <td>{item.name}</td>
                <td className="ui-table-cell--compact">{item.weeklyMinutes}</td>
                <td>{item.periods.length}</td>
                <td className="ui-table-cell--compact">
                  <DataTableStatus active={item.status === 'ACTIVE'} />
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      ) : null}
      <h2>Ocorrências</h2>
      {entries.isLoading ? <p role="status">Carregando ocorrências…</p> : null}
      {entries.data?.length === 0 ? <p>Nenhuma ocorrência demonstrativa.</p> : null}
      {entries.data?.length ? (
        <DataTable label="Tabela de ocorrências de jornada">
          <thead>
            <tr>
              <th>Contrato</th>
              <th>Data</th>
              <th>Tipo</th>
              <th>Minutos</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {entries.data.map((item) => (
              <tr key={item.id}>
                <td className="ui-table-cell--compact">{item.employmentContractId}</td>
                <td className="ui-table-cell--compact">{item.occurredOn.slice(0, 10)}</td>
                <td>{item.type}</td>
                <td className="ui-table-cell--compact">{item.minutes}</td>
                <td>
                  <DataTableStatus
                    active={item.status !== 'CANCELLED'}
                    activeLabel={item.status}
                    inactiveLabel={item.status}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      ) : null}
      <section className="mt-6" aria-labelledby="balance-title">
        <h2 id="balance-title">Saldo derivado</h2>
        <label>
          Identificador do contrato
          <input value={contractId} onChange={(event) => setContractId(event.target.value)} />
        </label>
        {balance.isError && <p role="alert">{balance.error.message}</p>}
        {balance.data && (
          <p>
            {balance.data.minutes} minutos em {balance.data.entries.length} movimento(s).
          </p>
        )}
      </section>
    </section>
  );
}

function MutationForm({
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

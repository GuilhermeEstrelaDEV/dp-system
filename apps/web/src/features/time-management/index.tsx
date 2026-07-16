import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { apiRequest } from '@/lib/api';

type TimeEntry = { id: string; occurredOn: string; type: string; minutes: number; status: string };
type Schedule = { id: string; code: string; name: string; weeklyMinutes: number; status: string };

export function TimeManagementPage() {
  const client = useQueryClient();
  const [contractId, setContractId] = useState('');
  const schedules = useQuery({
    queryKey: ['work-schedules'],
    queryFn: () => apiRequest<Schedule[]>('/work-schedules'),
  });
  const entries = useQuery({
    queryKey: ['time-entries'],
    queryFn: () => apiRequest<TimeEntry[]>('/time-entries'),
  });
  const balance = useQuery({
    enabled: Boolean(contractId),
    queryKey: ['time-balance', contractId],
    queryFn: () =>
      apiRequest<{ minutes: number }>(`/employment-contracts/${contractId}/time-balance`),
  });
  const close = useMutation({
    mutationFn: (form: FormData) =>
      apiRequest('/time-balance-closings', {
        method: 'POST',
        body: JSON.stringify({
          companyId: form.get('companyId'),
          referenceMonth: form.get('referenceMonth'),
          reason: form.get('reason'),
        }),
      }),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['time-entries'] }),
  });
  return (
    <section aria-labelledby="time-title">
      <PageHeader
        title="Jornada e banco de horas"
        description="Ambiente demonstrativo: minutos, ocorrências e saldo são controles internos configuráveis, sem integração com relógio de ponto."
      />
      <section aria-labelledby="schedules-title">
        <h2 id="schedules-title">Jornadas configuradas</h2>
        {schedules.isLoading ? (
          <p role="status">Carregando jornadas…</p>
        ) : (
          <ul>
            {schedules.data?.map((item) => (
              <li key={item.id}>
                {item.code} — {item.name}: {item.weeklyMinutes} minutos semanais ({item.status})
              </li>
            )) ?? <li>Nenhuma jornada demonstrativa.</li>}
          </ul>
        )}
      </section>
      <section className="mt-6" aria-labelledby="entries-title">
        <h2 id="entries-title">Ocorrências</h2>
        {entries.isLoading ? (
          <p role="status">Carregando ocorrências…</p>
        ) : (
          <ul>
            {entries.data?.map((item) => (
              <li key={item.id}>
                {item.occurredOn}: {item.type}, {item.minutes} minutos ({item.status})
              </li>
            )) ?? <li>Nenhuma ocorrência demonstrativa.</li>}
          </ul>
        )}
      </section>
      <section className="mt-6" aria-labelledby="balance-title">
        <h2 id="balance-title">Saldo derivado</h2>
        <label>
          Identificador do contrato
          <input value={contractId} onChange={(event) => setContractId(event.target.value)} />
        </label>
        {balance.data && <p>{balance.data.minutes} minutos no livro de movimentos.</p>}
      </section>
      <form
        className="mt-6 grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          close.mutate(new FormData(event.currentTarget));
        }}
      >
        <h2>Fechar competência</h2>
        <label>
          Empresa
          <input name="companyId" required />
        </label>
        <label>
          Referência
          <input name="referenceMonth" type="month" required />
        </label>
        <label>
          Justificativa
          <input name="reason" />
        </label>
        <button type="submit" disabled={close.isPending}>
          Fechar competência
        </button>
        {close.isError && <p role="alert">{close.error.message}</p>}
      </form>
    </section>
  );
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { apiRequest } from '@/lib/api';

type VacationPeriod = { id: string; accrualStart: string; accrualEnd: string; status: string };
type LeaveCase = {
  id: string;
  startDate: string;
  expectedReturnDate?: string;
  status: string;
  leaveType: { name: string };
};

export function VacationsLeavesPage() {
  const client = useQueryClient();
  const periods = useQuery({
    queryKey: ['vacation-periods'],
    queryFn: () => apiRequest<VacationPeriod[]>('/vacation-periods'),
  });
  const leaves = useQuery({
    queryKey: ['leave-cases'],
    queryFn: () => apiRequest<LeaveCase[]>('/leave-cases'),
  });
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
        }),
      }),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['vacation-periods'] }),
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
  return (
    <section aria-labelledby="vacations-title">
      <PageHeader
        title="Férias e afastamentos"
        description="Ambiente demonstrativo: períodos, retornos e alertas são controles administrativos configuráveis. Não há cálculo financeiro, prazo legal presumido, documento real ou decisão automática."
      />
      <section aria-labelledby="periods-title">
        <h2 id="periods-title">Períodos aquisitivos e concessivos</h2>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            createPeriod.mutate(new FormData(event.currentTarget));
          }}
        >
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
          <button type="submit">Registrar período</button>
          {createPeriod.isError && <p role="alert">{createPeriod.error.message}</p>}
        </form>
        {periods.isLoading ? (
          <p role="status">Carregando períodos…</p>
        ) : periods.isError ? (
          <p role="alert">{periods.error.message}</p>
        ) : periods.data?.length ? (
          <ul>
            {periods.data.map((item) => (
              <li key={item.id}>
                {item.accrualStart} a {item.accrualEnd} ({item.status})
              </li>
            ))}
          </ul>
        ) : (
          <p>Nenhum período demonstrativo encontrado.</p>
        )}
      </section>
      <section aria-labelledby="leaves-title">
        <h2 id="leaves-title">Afastamentos e retorno</h2>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            createLeave.mutate(new FormData(event.currentTarget));
          }}
        >
          <label>
            Contrato
            <input name="employmentContractId" required />
          </label>
          <label>
            Tipo configurado
            <input name="leaveTypeId" required />
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
            Motivo administrativo
            <input name="reason" />
          </label>
          <button type="submit">Registrar afastamento</button>
          {createLeave.isError && <p role="alert">{createLeave.error.message}</p>}
        </form>
        {leaves.isLoading ? (
          <p role="status">Carregando afastamentos…</p>
        ) : leaves.isError ? (
          <p role="alert">{leaves.error.message}</p>
        ) : leaves.data?.length ? (
          <ul>
            {leaves.data.map((item) => (
              <li key={item.id}>
                {item.leaveType.name}: {item.startDate}; retorno previsto{' '}
                {item.expectedReturnDate ?? 'não informado'} ({item.status})
              </li>
            ))}
          </ul>
        ) : (
          <p>Nenhum afastamento demonstrativo encontrado.</p>
        )}
      </section>
    </section>
  );
}

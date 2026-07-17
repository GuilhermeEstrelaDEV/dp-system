import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { apiRequest } from '@/lib/api';
import { payrollPeriodsApi, type CreatePayrollPeriod } from './payroll-periods';

const payrollPages = [
  ['competencias', 'Competências', '/folha/competencias', '/payroll-periods'],
  ['rubricas', 'Rubricas', '/folha/rubricas', '/payroll-rubrics'],
  ['parametros', 'Parâmetros', '/folha/parametros', '/payroll-parameters'],
  ['lancamentos', 'Lançamentos', '/folha/lancamentos', '/payroll-inputs'],
  ['execucoes', 'Execuções', '/folha/execucoes', '/payroll-runs'],
  ['fechamentos', 'Fechamentos', '/folha/fechamentos', '/payroll-closures'],
] as const;

type Paginated<T> = { items: T[]; pagination: { page: number; totalPages: number } };
type PayrollRecord = {
  id: string;
  status?: string;
  code?: string;
  name?: string;
  referenceDate?: string;
  createdAt?: string;
};

function currentPage(pathname: string) {
  return payrollPages.find(([, , path]) => pathname === path) ?? payrollPages[0];
}

export function PayrollPage() {
  const location = useLocation();
  const [, label, path, endpoint] = currentPage(location.pathname);
  const records = useQuery({
    queryKey: ['payroll', endpoint],
    enabled: path !== '/folha/competencias',
    queryFn: () => apiRequest<Paginated<PayrollRecord>>(`${endpoint}?page=1&pageSize=20`),
  });

  return (
    <section aria-labelledby="payroll-title">
      <PageHeader
        title="Folha de pagamento"
        description="Ambiente demonstrativo: a fundação é configurável e não contém regras, alíquotas, faixas ou cálculos legais homologados."
      />
      <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm" role="note">
        Processamento demonstrativo. Esta execução não representa folha de pagamento homologada.
      </p>
      <nav className="mt-4 flex flex-wrap gap-2" aria-label="Navegação da folha">
        {payrollPages.map(([, itemLabel, itemPath]) => (
          <Link
            key={itemPath}
            to={itemPath}
            aria-current={path === itemPath ? 'page' : undefined}
            className="rounded border px-3 py-2 text-sm"
          >
            {itemLabel}
          </Link>
        ))}
      </nav>
      {path === '/folha/competencias' ? (
        <PayrollPeriodsPanel />
      ) : (
        <section className="mt-6" aria-labelledby="payroll-section-title">
          <h2 id="payroll-section-title">{label}</h2>
          {records.isLoading ? <p role="status">Carregando {label.toLowerCase()}…</p> : null}
          {records.isError ? <p role="alert">{records.error.message}</p> : null}
          {records.data?.items.length === 0 ? (
            <p>Nenhum registro demonstrativo encontrado.</p>
          ) : null}
          {records.data?.items.length ? (
            <ul aria-label={`Lista de ${label.toLowerCase()}`}>
              {records.data.items.map((item) => (
                <li key={item.id}>
                  <strong>{item.code ?? item.referenceDate ?? item.id}</strong>
                  {item.name ? ` — ${item.name}` : ''}
                  {item.status ? ` (${item.status})` : ''}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      )}
    </section>
  );
}

function PayrollPeriodsPanel() {
  const client = useQueryClient();
  const [companyId, setCompanyId] = useState('');
  const [form, setForm] = useState<CreatePayrollPeriod>({
    companyId: '',
    payrollCalendarId: '',
    referenceDate: '',
    type: 'REGULAR',
  });
  const [reopenId, setReopenId] = useState<string>();
  const [reason, setReason] = useState('');
  const periods = useQuery({
    queryKey: ['payroll-periods', companyId],
    enabled: Boolean(companyId),
    queryFn: () =>
      payrollPeriodsApi.list(new URLSearchParams({ companyId, page: '1', pageSize: '20' })),
  });
  const refresh = () => void client.invalidateQueries({ queryKey: ['payroll-periods'] });
  const create = useMutation({
    mutationFn: payrollPeriodsApi.create,
    onSuccess: () => {
      setForm({ companyId: '', payrollCalendarId: '', referenceDate: '', type: 'REGULAR' });
      refresh();
    },
  });
  const validate = useMutation({ mutationFn: payrollPeriodsApi.validate });
  const close = useMutation({ mutationFn: payrollPeriodsApi.close, onSuccess: refresh });
  const reopen = useMutation({
    mutationFn: ({ id, value }: { id: string; value: string }) =>
      payrollPeriodsApi.reopen(id, value),
    onSuccess: () => {
      setReopenId(undefined);
      setReason('');
      refresh();
    },
  });
  return (
    <section className="mt-6" aria-labelledby="payroll-section-title">
      <h2 id="payroll-section-title">Competências</h2>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          create.mutate(form);
        }}
        className="grid gap-2"
      >
        <label>
          Empresa
          <input
            value={form.companyId}
            onChange={(e) => setForm({ ...form, companyId: e.target.value })}
            required
          />
        </label>
        <label>
          Calendário
          <input
            value={form.payrollCalendarId}
            onChange={(e) => setForm({ ...form, payrollCalendarId: e.target.value })}
            required
          />
        </label>
        <label>
          Referência
          <input
            type="date"
            value={form.referenceDate}
            onChange={(e) => setForm({ ...form, referenceDate: e.target.value })}
            required
          />
        </label>
        <button disabled={create.isPending}>Criar competência</button>
        {create.isError ? <p role="alert">{create.error.message}</p> : null}
      </form>
      <label className="mt-4 block">
        Filtrar por empresa
        <input value={companyId} onChange={(e) => setCompanyId(e.target.value)} />
      </label>
      {periods.isLoading ? <p role="status">Carregando competências…</p> : null}
      {periods.isError ? <p role="alert">{periods.error.message}</p> : null}
      {companyId && periods.data?.items.length === 0 ? (
        <p>Nenhuma competência demonstrativa encontrada.</p>
      ) : null}
      <ul aria-label="Lista de competências">
        {periods.data?.items.map((item) => (
          <li key={item.id}>
            <strong>{item.referenceDate}</strong> ({item.status}){' '}
            {item.status === 'CLOSED' ? (
              <span>— imutável</span>
            ) : (
              <>
                <button onClick={() => validate.mutate(item.id)} disabled={validate.isPending}>
                  Validar
                </button>
                <button onClick={() => close.mutate(item.id)} disabled={close.isPending}>
                  Fechar
                </button>
              </>
            )}
            {item.status === 'CLOSED' ? (
              <button onClick={() => setReopenId(item.id)}>Reabrir</button>
            ) : null}
          </li>
        ))}
      </ul>
      {validate.data ? (
        <p role="status">
          {validate.data.valid
            ? 'Competência válida.'
            : `${validate.data.blockingErrors} erro(s) bloqueante(s).`}
        </p>
      ) : null}
      {reopenId ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (reason.trim()) reopen.mutate({ id: reopenId, value: reason.trim() });
          }}
        >
          <label>
            Justificativa para reabertura
            <input value={reason} onChange={(e) => setReason(e.target.value)} required />
          </label>
          <button disabled={!reason.trim() || reopen.isPending}>Confirmar reabertura</button>
          <button type="button" onClick={() => setReopenId(undefined)}>
            Cancelar
          </button>
          {reopen.isError ? <p role="alert">{reopen.error.message}</p> : null}
        </form>
      ) : null}
    </section>
  );
}

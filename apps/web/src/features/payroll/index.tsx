import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type FormEvent, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { apiRequest } from '@/lib/api';
import { payrollPeriodsApi, type CreatePayrollPeriod } from './payroll-periods';
import { payrollRubricsApi, type CreatePayrollRubric, type PayrollRubric } from './payroll-rubrics';

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
    enabled: path !== '/folha/competencias' && path !== '/folha/rubricas',
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
      ) : path === '/folha/rubricas' ? (
        <PayrollRubricsPanel />
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

type RubricForm = CreatePayrollRubric & { incidenceConfigurationText: string };

function parseIncidenceConfiguration(value: string) {
  if (!value.trim()) return undefined;
  const parsed: unknown = JSON.parse(value);
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('A configuração de incidências deve ser um objeto JSON.');
  }
  return parsed as Record<string, unknown>;
}

function PayrollRubricsPanel() {
  const client = useQueryClient();
  const [companyId, setCompanyId] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ALL' | PayrollRubric['status']>('ALL');
  const [sortBy, setSortBy] = useState<'code' | 'name' | 'createdAt'>('code');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [formError, setFormError] = useState<string>();
  const [editing, setEditing] = useState<{ id: string; name: string }>();
  const [form, setForm] = useState<RubricForm>({
    companyId: '',
    payrollRubricCategoryId: '',
    code: '',
    name: '',
    version: 'v1',
    validFrom: '',
    validTo: '',
    incidenceConfigurationText: '',
  });
  const rubrics = useQuery({
    queryKey: ['payroll-rubrics', companyId, search, status, sortBy, sortDirection, page],
    enabled: Boolean(companyId),
    queryFn: () => {
      const query = new URLSearchParams({
        companyId,
        page: String(page),
        pageSize: '20',
        sortBy,
        sortDirection,
      });
      if (search.trim()) query.set('search', search.trim());
      if (status !== 'ALL') query.set('status', status);
      return payrollRubricsApi.list(query);
    },
  });
  const refresh = () => void client.invalidateQueries({ queryKey: ['payroll-rubrics'] });
  const create = useMutation({
    mutationFn: payrollRubricsApi.create,
    onSuccess: () => {
      setForm({
        companyId: '',
        payrollRubricCategoryId: '',
        code: '',
        name: '',
        version: 'v1',
        validFrom: '',
        validTo: '',
        incidenceConfigurationText: '',
      });
      setFormError(undefined);
      refresh();
    },
  });
  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PayrollRubric['status'] }) =>
      payrollRubricsApi.update(id, { status }),
    onSuccess: refresh,
  });
  const updateName = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      payrollRubricsApi.update(id, { name }),
    onSuccess: () => {
      setEditing(undefined);
      refresh();
    },
  });
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const incidenceConfiguration = parseIncidenceConfiguration(form.incidenceConfigurationText);
      create.mutate({
        companyId: form.companyId,
        payrollRubricCategoryId: form.payrollRubricCategoryId,
        code: form.code,
        name: form.name,
        version: form.version,
        validFrom: form.validFrom,
        ...(form.validTo ? { validTo: form.validTo } : {}),
        ...(incidenceConfiguration ? { incidenceConfiguration } : {}),
      });
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Configuração de incidências inválida.',
      );
    }
  };

  return (
    <section className="mt-6" aria-labelledby="payroll-section-title">
      <h2 id="payroll-section-title">Rubricas</h2>
      <p>
        Cadastre somente configurações demonstrativas. Incidências são metadados configuráveis e não
        representam regras legais.
      </p>
      <form onSubmit={submit} className="grid gap-2">
        <label>
          Empresa
          <input
            value={form.companyId}
            onChange={(event) => setForm({ ...form, companyId: event.target.value })}
            required
          />
        </label>
        <label>
          Categoria da rubrica
          <input
            value={form.payrollRubricCategoryId}
            onChange={(event) => setForm({ ...form, payrollRubricCategoryId: event.target.value })}
            required
          />
        </label>
        <label>
          Código
          <input
            value={form.code}
            onChange={(event) => setForm({ ...form, code: event.target.value })}
            required
          />
        </label>
        <label>
          Nome
          <input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
        </label>
        <label>
          Versão
          <input
            value={form.version}
            onChange={(event) => setForm({ ...form, version: event.target.value })}
            required
          />
        </label>
        <label>
          Vigente a partir de
          <input
            type="date"
            value={form.validFrom}
            onChange={(event) => setForm({ ...form, validFrom: event.target.value })}
            required
          />
        </label>
        <label>
          Vigente até (opcional)
          <input
            type="date"
            value={form.validTo}
            onChange={(event) => setForm({ ...form, validTo: event.target.value })}
          />
        </label>
        <label>
          Incidências configuráveis (JSON opcional)
          <textarea
            value={form.incidenceConfigurationText}
            onChange={(event) =>
              setForm({ ...form, incidenceConfigurationText: event.target.value })
            }
            aria-describedby="rubric-incidence-help"
          />
        </label>
        <small id="rubric-incidence-help">
          Não informe alíquotas, faixas ou fórmulas legais nesta fundação.
        </small>
        <button disabled={create.isPending}>Criar rubrica</button>
        {formError ? <p role="alert">{formError}</p> : null}
        {create.isError ? <p role="alert">{create.error.message}</p> : null}
      </form>
      <label className="mt-4 block">
        Filtrar por empresa
        <input
          value={companyId}
          onChange={(event) => {
            setCompanyId(event.target.value);
            setPage(1);
          }}
        />
      </label>
      <label className="mt-2 block">
        Pesquisar rubricas
        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
      </label>
      <label className="mt-2 block">
        Status
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as 'ALL' | PayrollRubric['status']);
            setPage(1);
          }}
        >
          <option value="ALL">Todos</option>
          <option value="ACTIVE">Ativas</option>
          <option value="INACTIVE">Inativas</option>
        </select>
      </label>
      <label className="mt-2 block">
        Ordenar por
        <select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)}>
          <option value="code">Código</option>
          <option value="name">Nome</option>
          <option value="createdAt">Data de criação</option>
        </select>
      </label>
      <label className="mt-2 block">
        Direção da ordenação
        <select
          value={sortDirection}
          onChange={(event) => setSortDirection(event.target.value as typeof sortDirection)}
        >
          <option value="asc">Crescente</option>
          <option value="desc">Decrescente</option>
        </select>
      </label>
      {rubrics.isLoading ? <p role="status">Carregando rubricas…</p> : null}
      {rubrics.isError ? <p role="alert">{rubrics.error.message}</p> : null}
      {companyId && rubrics.data?.items.length === 0 ? (
        <p>Nenhuma rubrica demonstrativa encontrada.</p>
      ) : null}
      <ul aria-label="Lista de rubricas">
        {rubrics.data?.items.map((item) => {
          const currentVersion = item.versions[0];
          const nextStatus = item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
          return (
            <li key={item.id}>
              <strong>{item.code}</strong> —{' '}
              {editing?.id === item.id ? (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (editing.name.trim()) {
                      updateName.mutate({ id: item.id, name: editing.name.trim() });
                    }
                  }}
                >
                  <label>
                    Novo nome da rubrica
                    <input
                      value={editing.name}
                      onChange={(event) => setEditing({ ...editing, name: event.target.value })}
                      required
                    />
                  </label>
                  <button disabled={updateName.isPending}>Salvar nome</button>
                  <button type="button" onClick={() => setEditing(undefined)}>
                    Cancelar edição
                  </button>
                </form>
              ) : (
                item.name
              )}{' '}
              ({item.status})
              <p>
                {item.payrollRubricCategory.name} ({item.payrollRubricCategory.nature}) · versão{' '}
                {currentVersion?.version ?? 'não informada'} · vigência{' '}
                {currentVersion?.validFrom ?? '—'}
                {currentVersion?.validTo ? ` até ${currentVersion.validTo}` : ' em aberto'}
              </p>
              <p>
                {currentVersion?.incidenceConfiguration
                  ? 'Incidências configuráveis registradas.'
                  : 'Sem incidências configuráveis.'}
              </p>
              <button
                onClick={() => updateStatus.mutate({ id: item.id, status: nextStatus })}
                disabled={updateStatus.isPending}
              >
                {nextStatus === 'ACTIVE' ? 'Ativar rubrica' : 'Inativar rubrica'}
              </button>
              {editing?.id !== item.id ? (
                <button onClick={() => setEditing({ id: item.id, name: item.name })}>
                  Editar nome
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
      {updateStatus.isError ? <p role="alert">{updateStatus.error.message}</p> : null}
      {updateName.isError ? <p role="alert">{updateName.error.message}</p> : null}
      {rubrics.data?.pagination.totalPages && rubrics.data.pagination.totalPages > 1 ? (
        <nav aria-label="Paginação de rubricas">
          <button onClick={() => setPage(page - 1)} disabled={page === 1}>
            Página anterior
          </button>
          <span>
            Página {rubrics.data.pagination.page} de {rubrics.data.pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= rubrics.data.pagination.totalPages}
          >
            Próxima página
          </button>
        </nav>
      ) : null}
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

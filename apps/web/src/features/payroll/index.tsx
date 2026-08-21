import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type FormEvent, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { DataTable, DataTableActions, DataTableStatus } from '@/components/common/DataTable';
import { PageHeader } from '@/components/common/PageHeader';
import { apiRequest } from '@/lib/api';
import { payrollPeriodsApi, type CreatePayrollPeriod } from './payroll-periods';
import { payrollRunsApi, type CreatePayrollRun } from './payroll-runs';
import { payrollInputsApi, type CreatePayrollInput } from './payroll-inputs';
import {
  payrollParametersApi,
  type CreatePayrollParameter,
  type PayrollParameter,
} from './payroll-parameters';
import { payrollRubricsApi, type CreatePayrollRubric, type PayrollRubric } from './payroll-rubrics';
import { VariableCompensationPanel } from '@/features/variable-compensation';
import { PayrollPeriodHistoryPanel } from '@/features/payroll-period-history/PayrollPeriodHistoryPages';
import { useOptionalAuth } from '@/features/auth/AuthContext';

const payrollPages = [
  [
    'competencias',
    'Competências',
    '/folha/competencias',
    '/payroll-periods',
    'payroll.period.close.view',
  ],
  ['rubricas', 'Rubricas', '/folha/rubricas', '/payroll-rubrics', 'payroll.rubric.read'],
  [
    'parametros',
    'Parâmetros',
    '/folha/parametros',
    '/payroll-parameters',
    'payroll.parameter.read',
  ],
  ['lancamentos', 'Lançamentos', '/folha/lancamentos', '/payroll-inputs', 'payroll.input.read'],
  ['execucoes', 'Execuções', '/folha/execucoes', '/payroll-runs', 'payroll.run.read'],
  ['conferencia', 'Conferência', '/folha/conferencia', '/payroll-reviews', 'payroll.review.view'],
  [
    'fechamentos',
    'Fechamentos',
    '/folha/fechamentos',
    '/payroll-periods',
    'payroll.period.close.history',
  ],
  [
    'remuneracao-variavel',
    'Remuneração variável',
    '/folha/remuneracao-variavel',
    '/variable-compensation/events',
    'variable_compensation.read',
  ],
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
  const auth = useOptionalAuth();
  const location = useLocation();
  const [, label, path, endpoint] = currentPage(location.pathname);
  const records = useQuery({
    queryKey: ['payroll', endpoint],
    enabled:
      path !== '/folha/competencias' &&
      path !== '/folha/rubricas' &&
      path !== '/folha/parametros' &&
      path !== '/folha/lancamentos' &&
      path !== '/folha/execucoes' &&
      path !== '/folha/fechamentos' &&
      path !== '/folha/remuneracao-variavel',
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
        {payrollPages
          .filter(([, , , , capability]) => auth?.hasCapability(capability) ?? true)
          .map(([, itemLabel, itemPath]) => (
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
      ) : path === '/folha/parametros' ? (
        <PayrollParametersPanel />
      ) : path === '/folha/lancamentos' ? (
        <PayrollInputsPanel />
      ) : path === '/folha/execucoes' ? (
        <PayrollRunsPanel />
      ) : path === '/folha/fechamentos' ? (
        <PayrollClosuresPanel />
      ) : path === '/folha/remuneracao-variavel' ? (
        <VariableCompensationPanel />
      ) : (
        <section className="mt-6" aria-labelledby="payroll-section-title">
          <h2 id="payroll-section-title">{String(label)}</h2>
          {records.isLoading ? (
            <p role="status">Carregando {String(label).toLowerCase()}…</p>
          ) : null}
          {records.isError ? <p role="alert">{records.error.message}</p> : null}
          {records.data?.items.length === 0 ? (
            <p>Nenhum registro demonstrativo encontrado.</p>
          ) : null}
          {records.data?.items.length ? (
            <ul aria-label={`Lista de ${String(label).toLowerCase()}`}>
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
  const auth = useOptionalAuth();
  const canManage = auth?.hasCapability('payroll.rubric.manage') ?? true;
  const client = useQueryClient();
  const [companyId, setCompanyId] = useState(auth?.activeCompanyId ?? '');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ALL' | PayrollRubric['status']>('ALL');
  const [sortBy, setSortBy] = useState<'code' | 'name' | 'createdAt'>('code');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [formError, setFormError] = useState<string>();
  const [editing, setEditing] = useState<{ id: string; name: string }>();
  const [form, setForm] = useState<RubricForm>({
    companyId: auth?.activeCompanyId ?? '',
    payrollRubricCategoryId: '',
    code: '',
    name: '',
    version: 'v1',
    validFrom: '',
    validTo: '',
    incidenceConfigurationText: '',
  });
  useEffect(() => {
    const activeCompanyId = auth?.activeCompanyId ?? '';
    setCompanyId(activeCompanyId);
    setForm((current) => ({ ...current, companyId: activeCompanyId }));
    setPage(1);
  }, [auth?.activeCompanyId]);
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
        companyId: auth?.activeCompanyId ?? '',
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
      {canManage && (
        <form onSubmit={submit} className="grid gap-2">
          <label>
            Empresa
            <input
              value={form.companyId}
              onChange={(event) => setForm({ ...form, companyId: event.target.value })}
              required
              readOnly={Boolean(auth)}
            />
          </label>
          <label>
            Categoria da rubrica
            <input
              value={form.payrollRubricCategoryId}
              onChange={(event) =>
                setForm({ ...form, payrollRubricCategoryId: event.target.value })
              }
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
      )}
      <label className="mt-4 block">
        Filtrar por empresa
        <input
          value={companyId}
          onChange={
            auth
              ? undefined
              : (event) => {
                  setCompanyId(event.target.value);
                  setPage(1);
                }
          }
          readOnly={Boolean(auth)}
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
              {canManage && (
                <button
                  onClick={() => updateStatus.mutate({ id: item.id, status: nextStatus })}
                  disabled={updateStatus.isPending}
                >
                  {nextStatus === 'ACTIVE' ? 'Ativar rubrica' : 'Inativar rubrica'}
                </button>
              )}
              {canManage && editing?.id !== item.id ? (
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

type ParameterForm = CreatePayrollParameter & { definitionText: string };

function parseDefinition(value: string) {
  if (!value.trim()) return undefined;
  const parsed: unknown = JSON.parse(value);
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('A definição deve ser um objeto JSON.');
  }
  return parsed as Record<string, unknown>;
}

function PayrollParametersPanel() {
  const auth = useOptionalAuth();
  const canManage = auth?.hasCapability('payroll.parameter.manage') ?? true;
  const client = useQueryClient();
  const [companyId, setCompanyId] = useState(auth?.activeCompanyId ?? '');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ALL' | PayrollParameter['status']>('ALL');
  const [page, setPage] = useState(1);
  const [formError, setFormError] = useState<string>();
  const [form, setForm] = useState<ParameterForm>({
    companyId: auth?.activeCompanyId ?? '',
    code: '',
    name: '',
    category: '',
    version: 'v1',
    validFrom: '',
    validTo: '',
    sourceReference: '',
    definitionText: '',
  });
  useEffect(() => {
    const activeCompanyId = auth?.activeCompanyId ?? '';
    setCompanyId(activeCompanyId);
    setForm((current) => ({ ...current, companyId: activeCompanyId }));
    setPage(1);
  }, [auth?.activeCompanyId]);
  const parameters = useQuery({
    queryKey: ['payroll-parameters', companyId, search, status, page],
    queryFn: () => {
      const query = new URLSearchParams({
        page: String(page),
        pageSize: '20',
        sortBy: 'validFrom',
        sortDirection: 'desc',
      });
      if (companyId.trim()) query.set('companyId', companyId.trim());
      if (search.trim()) query.set('search', search.trim());
      if (status !== 'ALL') query.set('status', status);
      return payrollParametersApi.list(query);
    },
  });
  const refresh = () => void client.invalidateQueries({ queryKey: ['payroll-parameters'] });
  const create = useMutation({
    mutationFn: payrollParametersApi.create,
    onSuccess: () => {
      setForm({
        companyId: auth?.activeCompanyId ?? '',
        code: '',
        name: '',
        category: '',
        version: 'v1',
        validFrom: '',
        validTo: '',
        sourceReference: '',
        definitionText: '',
      });
      setFormError(undefined);
      refresh();
    },
  });
  const updateStatus = useMutation({
    mutationFn: ({ id, status: value }: { id: string; status: PayrollParameter['status'] }) =>
      payrollParametersApi.update(id, { status: value }),
    onSuccess: refresh,
  });
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const definition = parseDefinition(form.definitionText);
      create.mutate({
        code: form.code,
        name: form.name,
        category: form.category,
        version: form.version,
        validFrom: form.validFrom,
        ...(form.companyId?.trim() ? { companyId: form.companyId.trim() } : {}),
        ...(form.validTo ? { validTo: form.validTo } : {}),
        ...(form.sourceReference?.trim() ? { sourceReference: form.sourceReference.trim() } : {}),
        ...(definition ? { definition } : {}),
      });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Definição inválida.');
    }
  };

  return (
    <section className="mt-6" aria-labelledby="payroll-section-title">
      <h2 id="payroll-section-title">Parâmetros</h2>
      <p>
        Versione somente metadados demonstrativos. Esta tela não contém valores, faixas ou
        parâmetros legais homologados.
      </p>
      {canManage && (
        <form onSubmit={submit} className="grid gap-2">
          <label>
            Empresa (opcional)
            <input
              value={form.companyId}
              onChange={(event) => setForm({ ...form, companyId: event.target.value })}
              readOnly={Boolean(auth)}
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
            Categoria
            <input
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value })}
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
            Referência de fonte (opcional)
            <input
              value={form.sourceReference}
              onChange={(event) => setForm({ ...form, sourceReference: event.target.value })}
            />
          </label>
          <label>
            Definição configurável (JSON opcional)
            <textarea
              value={form.definitionText}
              onChange={(event) => setForm({ ...form, definitionText: event.target.value })}
              aria-describedby="parameter-definition-help"
            />
          </label>
          <small id="parameter-definition-help">
            Valores monetários futuros devem ser strings decimais; não use números oficiais nesta
            fundação.
          </small>
          <button disabled={create.isPending}>Criar parâmetro</button>
          {formError ? <p role="alert">{formError}</p> : null}
          {create.isError ? <p role="alert">{create.error.message}</p> : null}
        </form>
      )}
      <label className="mt-4 block">
        Filtrar por empresa
        <input
          value={companyId}
          onChange={
            auth
              ? undefined
              : (event) => {
                  setCompanyId(event.target.value);
                  setPage(1);
                }
          }
          readOnly={Boolean(auth)}
        />
      </label>
      <label className="mt-2 block">
        Pesquisar parâmetros
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
            setStatus(event.target.value as 'ALL' | PayrollParameter['status']);
            setPage(1);
          }}
        >
          <option value="ALL">Todos</option>
          <option value="DRAFT">Rascunhos</option>
          <option value="ACTIVE">Ativos</option>
          <option value="INACTIVE">Inativos</option>
        </select>
      </label>
      {parameters.isLoading ? <p role="status">Carregando parâmetros…</p> : null}
      {parameters.isError ? <p role="alert">{parameters.error.message}</p> : null}
      {parameters.data?.items.length === 0 ? (
        <p>Nenhum parâmetro demonstrativo encontrado.</p>
      ) : null}
      <ul aria-label="Lista de parâmetros">
        {parameters.data?.items.map((item) => {
          const nextStatus = item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
          return (
            <li key={item.id}>
              <strong>{item.code}</strong> — {item.name} ({item.status})
              <p>
                {item.category} · versão {item.version} · vigência {item.validFrom}
                {item.validTo ? ` até ${item.validTo}` : ' em aberto'}
              </p>
              <p>
                {item.definition
                  ? 'Definição configurável registrada.'
                  : 'Sem definição configurável.'}
              </p>
              {canManage && (
                <button
                  onClick={() => updateStatus.mutate({ id: item.id, status: nextStatus })}
                  disabled={updateStatus.isPending}
                >
                  {nextStatus === 'ACTIVE' ? 'Ativar parâmetro' : 'Inativar parâmetro'}
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {updateStatus.isError ? <p role="alert">{updateStatus.error.message}</p> : null}
      {parameters.data?.pagination.totalPages && parameters.data.pagination.totalPages > 1 ? (
        <nav aria-label="Paginação de parâmetros">
          <button onClick={() => setPage(page - 1)} disabled={page === 1}>
            Página anterior
          </button>
          <span>
            Página {parameters.data.pagination.page} de {parameters.data.pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= parameters.data.pagination.totalPages}
          >
            Próxima página
          </button>
        </nav>
      ) : null}
    </section>
  );
}

function PayrollClosuresPanel() {
  const [payrollPeriodId, setPayrollPeriodId] = useState('');
  return (
    <section className="mt-6" aria-labelledby="payroll-section-title">
      <h2 id="payroll-section-title">Fechamentos</h2>
      <p>
        O fechamento é histórico e torna a competência imutável. Reaberturas exigem justificativa.
      </p>
      <label>
        Competência
        <input
          value={payrollPeriodId}
          onChange={(event) => setPayrollPeriodId(event.target.value)}
          placeholder="UUID da competência"
        />
      </label>
      {payrollPeriodId.trim() ? (
        <PayrollPeriodHistoryPanel payrollPeriodId={payrollPeriodId.trim()} />
      ) : (
        <p>Informe a competência para carregar o fluxo canônico.</p>
      )}
    </section>
  );
}

function PayrollRunsPanel() {
  const auth = useOptionalAuth();
  const canManage = auth?.hasCapability('payroll.run.manage') ?? true;
  const client = useQueryClient();
  const [payrollPeriodId, setPayrollPeriodId] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<CreatePayrollRun>({
    payrollPeriodId: '',
    engineVersion: 'foundation-v1',
    parameterSnapshotVersion: '',
    technicalNotes: '',
  });
  const runs = useQuery({
    queryKey: ['payroll-runs', payrollPeriodId, page],
    enabled: Boolean(payrollPeriodId),
    queryFn: () =>
      payrollRunsApi.list(
        new URLSearchParams({
          payrollPeriodId,
          page: String(page),
          pageSize: '20',
          sortBy: 'createdAt',
          sortDirection: 'desc',
        }),
      ),
  });
  const refresh = () => void client.invalidateQueries({ queryKey: ['payroll-runs'] });
  const create = useMutation({
    mutationFn: payrollRunsApi.create,
    onSuccess: () => {
      setForm({
        payrollPeriodId: '',
        engineVersion: 'foundation-v1',
        parameterSnapshotVersion: '',
        technicalNotes: '',
      });
      refresh();
    },
  });
  return (
    <section className="mt-6" aria-labelledby="payroll-section-title">
      <h2 id="payroll-section-title">Execuções técnicas</h2>
      <p>
        Cada execução é estrutural e demonstrativa: não calcula impostos, incidências ou qualquer
        regra trabalhista homologada.
      </p>
      {canManage ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            create.mutate({
              payrollPeriodId: form.payrollPeriodId,
              engineVersion: form.engineVersion,
              ...(form.parameterSnapshotVersion?.trim()
                ? { parameterSnapshotVersion: form.parameterSnapshotVersion.trim() }
                : {}),
              ...(form.technicalNotes?.trim()
                ? { technicalNotes: form.technicalNotes.trim() }
                : {}),
            });
          }}
          className="grid gap-2"
        >
          <label>
            Competência
            <input
              value={form.payrollPeriodId}
              onChange={(event) => setForm({ ...form, payrollPeriodId: event.target.value })}
              required
            />
          </label>
          <label>
            Versão do motor
            <input
              value={form.engineVersion}
              onChange={(event) => setForm({ ...form, engineVersion: event.target.value })}
              required
            />
          </label>
          <label>
            Versão do snapshot de parâmetros (opcional)
            <input
              value={form.parameterSnapshotVersion}
              onChange={(event) =>
                setForm({ ...form, parameterSnapshotVersion: event.target.value })
              }
            />
          </label>
          <label>
            Observações técnicas (opcional)
            <textarea
              value={form.technicalNotes}
              onChange={(event) => setForm({ ...form, technicalNotes: event.target.value })}
            />
          </label>
          <button disabled={create.isPending}>Iniciar execução técnica</button>
          {create.isError ? <p role="alert">{create.error.message}</p> : null}
        </form>
      ) : null}
      <label className="mt-4 block">
        Filtrar por competência
        <input
          value={payrollPeriodId}
          onChange={(event) => {
            setPayrollPeriodId(event.target.value);
            setPage(1);
          }}
        />
      </label>
      {runs.isLoading ? <p role="status">Carregando execuções…</p> : null}
      {runs.isError ? <p role="alert">{runs.error.message}</p> : null}
      {payrollPeriodId && runs.data?.items.length === 0 ? (
        <p>Nenhuma execução demonstrativa encontrada.</p>
      ) : null}
      {runs.data?.items.length ? (
        <DataTable label="Tabela de execuções de folha">
          <thead>
            <tr>
              <th>Execução</th>
              <th>Status</th>
              <th>Motor</th>
              <th>Resultados</th>
              <th>Mensagens</th>
            </tr>
          </thead>
          <tbody>
            {runs.data.items.map((item) => (
              <tr key={item.id}>
                <td>#{item.sequence}</td>
                <td>
                  <DataTableStatus
                    active={item.status === 'COMPLETED'}
                    activeLabel="Concluída"
                    inactiveLabel={item.status}
                  />
                </td>
                <td>
                  {item.engineVersion}
                  <br />
                  <small>Parâmetros: {item.parameterVersion ?? 'não informado'}</small>
                </td>
                <td>
                  {item.employees?.length
                    ? item.employees.map((employee) => (
                        <span className="block" key={employee.id}>
                          Contrato {employee.employmentContractId}: bruto {employee.grossAmount} ·
                          líquido {employee.netAmount}
                        </span>
                      ))
                    : 'Nenhum contrato calculado.'}
                </td>
                <td>
                  {item.messages.length
                    ? item.messages.map((message) => (
                        <span className="block" key={message.id}>
                          {message.severity}: {message.code} — {message.message}
                        </span>
                      ))
                    : 'Sem mensagens.'}
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      ) : null}
      {runs.data?.pagination.totalPages && runs.data.pagination.totalPages > 1 ? (
        <nav aria-label="Paginação de execuções">
          <button onClick={() => setPage(page - 1)} disabled={page === 1}>
            Página anterior
          </button>
          <span>
            Página {runs.data.pagination.page} de {runs.data.pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= runs.data.pagination.totalPages}
          >
            Próxima página
          </button>
        </nav>
      ) : null}
    </section>
  );
}

const decimalPattern = /^-?\d+(\.\d{1,4})?$/;

function PayrollInputsPanel() {
  const auth = useOptionalAuth();
  const canManage = auth?.hasCapability('payroll.input.manage') ?? true;
  const client = useQueryClient();
  const [payrollPeriodId, setPayrollPeriodId] = useState('');
  const [page, setPage] = useState(1);
  const [formError, setFormError] = useState<string>();
  const [form, setForm] = useState<CreatePayrollInput>({
    payrollPeriodId: '',
    employeeId: '',
    employmentContractId: '',
    payrollRubricId: '',
    amount: '',
    quantity: '',
    sourceKey: '',
    sourceType: 'MANUAL',
    technicalNotes: '',
  });
  const inputs = useQuery({
    queryKey: ['payroll-inputs', payrollPeriodId, page],
    enabled: Boolean(payrollPeriodId),
    queryFn: () =>
      payrollInputsApi.list(
        new URLSearchParams({
          payrollPeriodId,
          page: String(page),
          pageSize: '20',
          sortBy: 'createdAt',
          sortDirection: 'desc',
        }),
      ),
  });
  const refresh = () => void client.invalidateQueries({ queryKey: ['payroll-inputs'] });
  const create = useMutation({
    mutationFn: payrollInputsApi.create,
    onSuccess: () => {
      setForm({
        payrollPeriodId: '',
        employeeId: '',
        employmentContractId: '',
        payrollRubricId: '',
        amount: '',
        quantity: '',
        sourceKey: '',
        sourceType: 'MANUAL',
        technicalNotes: '',
      });
      setFormError(undefined);
      refresh();
    },
  });
  const inactivate = useMutation({
    mutationFn: (id: string) => payrollInputsApi.update(id, { status: 'INACTIVE' }),
    onSuccess: refresh,
  });
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!decimalPattern.test(form.amount)) {
      setFormError('Informe um valor decimal válido, usando texto e nunca ponto flutuante.');
      return;
    }
    if (form.quantity && !/^\d+(\.\d{1,4})?$/.test(form.quantity)) {
      setFormError('Informe uma quantidade decimal válida.');
      return;
    }
    create.mutate({
      payrollPeriodId: form.payrollPeriodId,
      employeeId: form.employeeId,
      employmentContractId: form.employmentContractId,
      payrollRubricId: form.payrollRubricId,
      amount: form.amount,
      ...(form.quantity ? { quantity: form.quantity } : {}),
      ...(form.sourceKey?.trim() ? { sourceKey: form.sourceKey.trim() } : {}),
      ...(form.sourceType?.trim() ? { sourceType: form.sourceType.trim() } : {}),
      ...(form.technicalNotes?.trim() ? { technicalNotes: form.technicalNotes.trim() } : {}),
    });
  };
  return (
    <section className="mt-6" aria-labelledby="payroll-section-title">
      <h2 id="payroll-section-title">Lançamentos</h2>
      <p>
        Valores são textos decimais demonstrativos. Não há cálculo legal, valores reais ou folha
        homologada nesta tela.
      </p>
      {canManage ? (
        <form onSubmit={submit} className="grid gap-2">
          <label>
            Competência
            <input
              value={form.payrollPeriodId}
              onChange={(event) => setForm({ ...form, payrollPeriodId: event.target.value })}
              required
            />
          </label>
          <label>
            Colaborador
            <input
              value={form.employeeId}
              onChange={(event) => setForm({ ...form, employeeId: event.target.value })}
              required
            />
          </label>
          <label>
            Contrato
            <input
              value={form.employmentContractId}
              onChange={(event) => setForm({ ...form, employmentContractId: event.target.value })}
              required
            />
          </label>
          <label>
            Rubrica
            <input
              value={form.payrollRubricId}
              onChange={(event) => setForm({ ...form, payrollRubricId: event.target.value })}
              required
            />
          </label>
          <label>
            Valor decimal demonstrativo
            <input
              inputMode="decimal"
              value={form.amount}
              onChange={(event) => setForm({ ...form, amount: event.target.value })}
              required
            />
          </label>
          <label>
            Quantidade decimal (opcional)
            <input
              inputMode="decimal"
              value={form.quantity}
              onChange={(event) => setForm({ ...form, quantity: event.target.value })}
            />
          </label>
          <label>
            Chave de origem (opcional e idempotente)
            <input
              value={form.sourceKey}
              onChange={(event) => setForm({ ...form, sourceKey: event.target.value })}
            />
          </label>
          <label>
            Tipo de origem
            <input
              value={form.sourceType}
              onChange={(event) => setForm({ ...form, sourceType: event.target.value })}
            />
          </label>
          <label>
            Observações técnicas (opcional)
            <textarea
              value={form.technicalNotes}
              onChange={(event) => setForm({ ...form, technicalNotes: event.target.value })}
            />
          </label>
          <button disabled={create.isPending}>Criar lançamento</button>
          {formError ? <p role="alert">{formError}</p> : null}
          {create.isError ? <p role="alert">{create.error.message}</p> : null}
        </form>
      ) : null}
      <label className="mt-4 block">
        Filtrar por competência
        <input
          value={payrollPeriodId}
          onChange={(event) => {
            setPayrollPeriodId(event.target.value);
            setPage(1);
          }}
        />
      </label>
      {inputs.isLoading ? <p role="status">Carregando lançamentos…</p> : null}
      {inputs.isError ? <p role="alert">{inputs.error.message}</p> : null}
      {payrollPeriodId && inputs.data?.items.length === 0 ? (
        <p>Nenhum lançamento demonstrativo encontrado.</p>
      ) : null}
      {inputs.data?.items.length ? (
        <DataTable label="Tabela de lançamentos de folha">
          <thead>
            <tr>
              <th>Rubrica</th>
              <th>Competência</th>
              <th>Valor</th>
              <th>Origem</th>
              <th>Status</th>
              {canManage ? <th>Ações</th> : null}
            </tr>
          </thead>
          <tbody>
            {inputs.data.items.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.payrollRubric.code}</strong>
                  <br />
                  {item.payrollRubric.name}
                </td>
                <td>{item.payrollPeriod.referenceDate}</td>
                <td>{item.amount}</td>
                <td>{item.sourceKey ?? item.source}</td>
                <td>
                  <DataTableStatus
                    active={item.status !== 'INACTIVE'}
                    activeLabel="Pendente"
                    inactiveLabel="Inativo"
                  />
                </td>
                {canManage ? (
                  <td>
                    <DataTableActions>
                      {item.status !== 'INACTIVE' ? (
                        <button
                          onClick={() => inactivate.mutate(item.id)}
                          disabled={inactivate.isPending}
                        >
                          Inativar
                        </button>
                      ) : null}
                    </DataTableActions>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </DataTable>
      ) : null}
      {inactivate.isError ? <p role="alert">{inactivate.error.message}</p> : null}
      {inputs.data?.pagination.totalPages && inputs.data.pagination.totalPages > 1 ? (
        <nav aria-label="Paginação de lançamentos">
          <button onClick={() => setPage(page - 1)} disabled={page === 1}>
            Página anterior
          </button>
          <span>
            Página {inputs.data.pagination.page} de {inputs.data.pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= inputs.data.pagination.totalPages}
          >
            Próxima página
          </button>
        </nav>
      ) : null}
    </section>
  );
}

function PayrollPeriodsPanel() {
  const auth = useOptionalAuth();
  const canManage = auth?.hasCapability('payroll.period.manage') ?? true;
  const canViewHistory = auth?.hasCapability('payroll.period.close.history') ?? true;
  const client = useQueryClient();
  const [companyId, setCompanyId] = useState(auth?.activeCompanyId ?? '');
  const [form, setForm] = useState<CreatePayrollPeriod>({
    companyId: auth?.activeCompanyId ?? '',
    payrollCalendarId: '',
    referenceDate: '',
    type: 'REGULAR',
  });
  useEffect(() => {
    const activeCompanyId = auth?.activeCompanyId ?? '';
    setCompanyId(activeCompanyId);
    setForm((current) => ({ ...current, companyId: activeCompanyId }));
  }, [auth?.activeCompanyId]);
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
      setForm({
        companyId: auth?.activeCompanyId ?? '',
        payrollCalendarId: '',
        referenceDate: '',
        type: 'REGULAR',
      });
      refresh();
    },
  });
  const validate = useMutation({ mutationFn: payrollPeriodsApi.validate });
  return (
    <section className="mt-6" aria-labelledby="payroll-section-title">
      <h2 id="payroll-section-title">Competências</h2>
      {canManage ? (
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
              onChange={
                auth ? undefined : (event) => setForm({ ...form, companyId: event.target.value })
              }
              readOnly={Boolean(auth)}
              required
            />
          </label>
          <label>
            Calendário
            <input
              value={form.payrollCalendarId}
              onChange={(event) => setForm({ ...form, payrollCalendarId: event.target.value })}
              required
            />
          </label>
          <label>
            Referência
            <input
              type="date"
              value={form.referenceDate}
              onChange={(event) => setForm({ ...form, referenceDate: event.target.value })}
              required
            />
          </label>
          <button disabled={create.isPending}>Criar competência</button>
          {create.isError ? <p role="alert">{create.error.message}</p> : null}
        </form>
      ) : null}
      <label className="mt-4 block">
        Filtrar por empresa
        <input
          value={companyId}
          onChange={auth ? undefined : (event) => setCompanyId(event.target.value)}
          readOnly={Boolean(auth)}
        />
      </label>
      {periods.isLoading ? <p role="status">Carregando competências…</p> : null}
      {periods.isError ? <p role="alert">{periods.error.message}</p> : null}
      {companyId && periods.data?.items.length === 0 ? (
        <p>Nenhuma competência demonstrativa encontrada.</p>
      ) : null}
      {periods.data?.items.length ? (
        <DataTable label="Tabela de competências da folha">
          <thead>
            <tr>
              <th>Referência</th>
              <th>Tipo</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {periods.data.items.map((item) => (
              <tr key={item.id}>
                <td>{item.referenceDate}</td>
                <td>{item.type}</td>
                <td>
                  <DataTableStatus
                    active={item.status === 'OPEN'}
                    activeLabel="Aberta"
                    inactiveLabel={item.status === 'CLOSED' ? 'Fechada' : item.status}
                  />
                </td>
                <td>
                  <DataTableActions>
                    {item.status !== 'CLOSED' ? (
                      <button
                        onClick={() => validate.mutate(item.id)}
                        disabled={validate.isPending}
                      >
                        Validar
                      </button>
                    ) : null}
                    {canViewHistory ? (
                      <Link to={`/folha/competencias/${item.id}/historico`}>
                        Fechamento e histórico
                      </Link>
                    ) : null}
                  </DataTableActions>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      ) : null}
      {validate.data ? (
        <p role="status">
          {validate.data.valid
            ? 'Competência válida.'
            : `${validate.data.blockingErrors} erro(s) bloqueante(s).`}
        </p>
      ) : null}
    </section>
  );
}

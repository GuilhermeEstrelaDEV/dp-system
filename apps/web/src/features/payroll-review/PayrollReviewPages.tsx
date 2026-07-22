import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type FormEvent, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { useAuth } from '@/features/auth/AuthContext';
import { ApiClientError } from '@/lib/api';
import {
  payrollReviewApi,
  type CreateFinding,
  type FindingSeverity,
  type FindingStatus,
  type ReviewCycle,
  type ReviewStatus,
} from './api';

const statusLabel: Record<ReviewStatus, string> = {
  OPEN: 'Aberta',
  IN_REVIEW: 'Em conferência',
  SUBMITTED: 'Enviada para aprovação',
  APPROVED: 'Aprovada',
  REJECTED: 'Rejeitada',
  CLOSED: 'Fechada',
};
const eventLabel: Record<string, string> = {
  REVIEW_CYCLE_OPENED: 'Ciclo aberto',
  REVIEW_STARTED: 'Conferência iniciada',
  REVIEW_SUBMITTED: 'Enviada para aprovação',
  REVIEW_APPROVED: 'Aprovação registrada',
  REVIEW_REJECTED: 'Rejeitada',
  REVIEW_CLOSED: 'Ciclo fechado',
  REVIEW_REOPENED: 'Ciclo reaberto',
  APPROVALS_INVALIDATED: 'Aprovações anteriores invalidadas',
  FINDING_OPENED: 'Achado criado',
  FINDING_RESOLVED: 'Achado resolvido',
  FINDING_REOPENED: 'Achado reaberto',
  FINDING_BLOCKED: 'Bloqueio registrado',
  FINDING_UNBLOCKED: 'Bloqueio removido',
};

function ErrorMessage({ error }: { readonly error: Error }) {
  const apiError = error instanceof ApiClientError ? error : null;
  const prefix =
    apiError?.status === 403
      ? 'Acesso negado'
      : apiError?.status === 404
        ? 'Não encontrado'
        : apiError?.status === 409
          ? 'Conflito'
          : 'Erro';
  return (
    <p role="alert" className="rounded border border-red-300 bg-red-50 p-3">
      <strong>{prefix}:</strong> {error.message}
      {apiError?.traceId ? (
        <small className="block">Identificador: {apiError.traceId}</small>
      ) : null}
    </p>
  );
}

export function PayrollReviewRunsPage() {
  const [periodId, setPeriodId] = useState('');
  const runs = useQuery({
    queryKey: ['review-runs', periodId],
    enabled: Boolean(periodId),
    queryFn: () => payrollReviewApi.listRuns(periodId),
  });
  return (
    <section>
      <PageHeader
        title="Execuções e conferências"
        description="Selecione uma competência para consultar suas execuções e ciclos de conferência."
      />
      <label className="mt-5 block max-w-xl">
        Identificador da competência
        <input
          value={periodId}
          onChange={(event) => setPeriodId(event.target.value)}
          placeholder="UUID da competência"
        />
      </label>
      {runs.isLoading ? <p role="status">Carregando execuções…</p> : null}
      {runs.isError ? <ErrorMessage error={runs.error} /> : null}
      {periodId && runs.data?.items.length === 0 ? <p>Nenhuma execução encontrada.</p> : null}
      <ul className="mt-5 grid gap-3" aria-label="Lista de execuções">
        {runs.data?.items.map((run) => (
          <li key={run.id} className="rounded border bg-white p-4">
            <strong>Execução {run.sequence}</strong> — {run.status}
            <p>Motor: {run.engineVersion}</p>
            <Link className="underline" to={`/folha/execucoes/${run.id}`}>
              Abrir execução e ciclos
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PayrollRunReviewPage() {
  const { runId = '' } = useParams();
  const auth = useAuth();
  const client = useQueryClient();
  const run = useQuery({
    queryKey: ['payroll-run', runId],
    queryFn: () => payrollReviewApi.findRun(runId),
  });
  const cycles = useQuery({
    queryKey: ['review-cycles', runId],
    queryFn: () => payrollReviewApi.listCycles(runId),
    enabled: auth.hasCapability('payroll.review.view'),
  });
  const create = useMutation({
    mutationFn: () => payrollReviewApi.createCycle(runId),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['review-cycles', runId] }),
  });
  const hasActive = cycles.data?.some((cycle) => cycle.status !== 'CLOSED') ?? false;
  return (
    <section>
      <PageHeader
        title="Detalhe da execução"
        description="A API valida elegibilidade, duplicidade e isolamento empresarial."
      />
      <Link to="/folha/conferencia">← Voltar</Link>
      {run.isLoading || cycles.isLoading ? (
        <p role="status">Carregando execução e ciclos…</p>
      ) : null}
      {run.isError ? <ErrorMessage error={run.error} /> : null}
      {cycles.isError ? <ErrorMessage error={cycles.error} /> : null}
      {run.data ? (
        <div className="mt-4 rounded border bg-white p-4">
          <h2>Execução {run.data.sequence}</h2>
          <p>Estado: {run.data.status}</p>
          <p>Motor: {run.data.engineVersion}</p>
        </div>
      ) : null}
      {auth.hasCapability('payroll.review.create') ? (
        <button
          className="mt-4 rounded bg-sky-700 px-3 py-2 text-white"
          disabled={create.isPending || hasActive || run.data?.status !== 'COMPLETED'}
          onClick={() => create.mutate()}
        >
          {create.isPending
            ? 'Criando…'
            : hasActive
              ? 'Ciclo ativo existente'
              : 'Criar ciclo de conferência'}
        </button>
      ) : null}
      {create.isError ? <ErrorMessage error={create.error} /> : null}
      <h2 className="mt-6">Ciclos de conferência</h2>
      {cycles.data?.length === 0 ? <p>Nenhum ciclo criado.</p> : null}
      <ul className="grid gap-3">
        {cycles.data?.map((cycle) => (
          <li key={cycle.id} className="rounded border bg-white p-4">
            <strong>{statusLabel[cycle.status]}</strong>
            <p>Rodada {cycle.reviewRound}</p>
            <Link className="underline" to={`/folha/conferencia/${cycle.id}`}>
              Abrir conferência
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

type FindingForm = CreateFinding & {
  employmentContractId: string;
  payrollCalculationItemId: string;
};
const emptyFinding: FindingForm = {
  severity: 'INFORMATIONAL',
  code: '',
  title: '',
  description: '',
  employmentContractId: '',
  payrollCalculationItemId: '',
};

export function PayrollReviewDetailPage() {
  const { reviewId = '' } = useParams();
  const auth = useAuth();
  const client = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<'ALL' | FindingStatus>('ALL');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | FindingSeverity>('ALL');
  const [findingForm, setFindingForm] = useState<FindingForm>(emptyFinding);
  const [dialog, setDialog] = useState<{
    kind: 'resolve' | 'finding-reopen' | 'reject' | 'cycle-reopen';
    id: string;
  }>();
  const [reason, setReason] = useState('');
  const cycle = useQuery({
    queryKey: ['review-cycle', reviewId],
    queryFn: () => payrollReviewApi.findCycle(reviewId),
  });
  const history = useQuery({
    queryKey: ['review-history', reviewId],
    queryFn: () => payrollReviewApi.history(reviewId),
  });
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ['review-cycle', reviewId] });
    void client.invalidateQueries({ queryKey: ['review-history', reviewId] });
  };
  const createFinding = useMutation({
    mutationFn: (body: CreateFinding) => payrollReviewApi.createFinding(reviewId, body),
    onSuccess: () => {
      setFindingForm(emptyFinding);
      refresh();
    },
  });
  const action = useMutation({
    mutationFn: (value: 'start' | 'submit' | 'close') => payrollReviewApi.action(reviewId, value),
    onSuccess: refresh,
  });
  const decide = useMutation({
    mutationFn: ({ value, detail }: { value: 'approve' | 'reject' | 'reopen'; detail?: string }) =>
      payrollReviewApi.decide(reviewId, value, detail),
    onSuccess: () => {
      setDialog(undefined);
      setReason('');
      refresh();
    },
  });
  const transitionFinding = useMutation({
    mutationFn: ({
      id,
      kind,
      detail,
    }: {
      id: string;
      kind: 'resolve' | 'finding-reopen';
      detail: string;
    }) =>
      kind === 'resolve'
        ? payrollReviewApi.resolveFinding(id, detail)
        : payrollReviewApi.reopenFinding(id, detail),
    onSuccess: () => {
      setDialog(undefined);
      setReason('');
      refresh();
    },
  });
  const data = cycle.data;
  const findings = data?.findings.filter(
    (item) =>
      (statusFilter === 'ALL' || item.status === statusFilter) &&
      (severityFilter === 'ALL' || item.severity === severityFilter),
  );
  const blocking =
    data?.findings.filter((item) => item.status === 'OPEN' && item.severity === 'BLOCKING')
      .length ?? 0;
  const pendingError =
    createFinding.error ?? action.error ?? decide.error ?? transitionFinding.error;
  function submitFinding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createFinding.mutate({
      severity: findingForm.severity,
      code: findingForm.code,
      title: findingForm.title,
      description: findingForm.description,
      ...(findingForm.employmentContractId
        ? { employmentContractId: findingForm.employmentContractId }
        : {}),
      ...(findingForm.payrollCalculationItemId
        ? { payrollCalculationItemId: findingForm.payrollCalculationItemId }
        : {}),
    });
  }
  if (cycle.isLoading || history.isLoading) return <p role="status">Carregando conferência…</p>;
  if (cycle.isError) return <ErrorMessage error={cycle.error} />;
  if (!data) return <p>Nenhum ciclo encontrado.</p>;
  return (
    <section>
      <PageHeader
        title="Conferência da folha"
        description="O backend é a autoridade para todas as transições e autorizações."
      />
      <div className="grid gap-3 rounded border bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <p>
          <strong>Estado</strong>
          <br />
          {statusLabel[data.status]}
        </p>
        <p>
          <strong>Rodada</strong>
          <br />
          {data.reviewRound}
        </p>
        <p>
          <strong>Etapa atual</strong>
          <br />
          {data.currentApprovalStage} de 2
        </p>
        <p>
          <strong>Criada por</strong>
          <br />
          {data.createdBy}
          <br />
          {new Date(data.createdAt).toLocaleString('pt-BR')}
        </p>
      </div>
      {blocking > 0 ? (
        <p role="alert" className="mt-4 rounded border-2 border-amber-500 bg-amber-50 p-3">
          <strong>Bloqueio:</strong> {blocking} achado(s) BLOCKING aberto(s). A submissão será
          recusada pelo backend.
        </p>
      ) : null}
      <WorkflowActions
        cycle={data}
        auth={auth}
        pending={action.isPending || decide.isPending}
        onAction={(value) => action.mutate(value)}
        onApprove={() => decide.mutate({ value: 'approve' })}
        onReason={(kind) => {
          setReason('');
          setDialog({ kind, id: data.id });
        }}
      />
      {pendingError ? <ErrorMessage error={pendingError} /> : null}
      <section className="mt-8" aria-labelledby="findings-title">
        <h2 id="findings-title">Achados</h2>
        <div className="flex flex-wrap gap-3">
          <label>
            Status
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
            >
              <option value="ALL">Todos</option>
              <option value="OPEN">Abertos</option>
              <option value="RESOLVED">Resolvidos</option>
            </select>
          </label>
          <label>
            Severidade
            <select
              value={severityFilter}
              onChange={(event) => setSeverityFilter(event.target.value as typeof severityFilter)}
            >
              <option value="ALL">Todas</option>
              <option value="INFORMATIONAL">Informativo</option>
              <option value="BLOCKING">Bloqueante</option>
            </select>
          </label>
        </div>
        {auth.hasCapability('payroll.review.finding.create') &&
        data.status !== 'APPROVED' &&
        data.status !== 'CLOSED' ? (
          <FindingFormView
            value={findingForm}
            pending={createFinding.isPending}
            onChange={setFindingForm}
            onSubmit={submitFinding}
          />
        ) : null}
        {findings?.length === 0 ? <p>Nenhum achado para os filtros selecionados.</p> : null}
        <ul className="grid gap-3">
          {findings?.map((finding) => (
            <li
              className={`rounded border p-4 ${finding.severity === 'BLOCKING' && finding.status === 'OPEN' ? 'border-amber-500' : ''}`}
              key={finding.id}
            >
              <strong>{finding.title}</strong>
              <p>
                {finding.code} · {finding.severity === 'BLOCKING' ? 'BLOQUEANTE' : 'Informativo'} ·{' '}
                {finding.status === 'OPEN' ? 'Aberto' : 'Resolvido'}
              </p>
              <p>{finding.description}</p>
              {finding.status === 'OPEN' && auth.hasCapability('payroll.review.finding.resolve') ? (
                <button
                  onClick={() => {
                    setReason('');
                    setDialog({ kind: 'resolve', id: finding.id });
                  }}
                >
                  Resolver
                </button>
              ) : null}
              {finding.status === 'RESOLVED' &&
              auth.hasCapability('payroll.review.finding.reopen') ? (
                <button
                  onClick={() => {
                    setReason('');
                    setDialog({ kind: 'finding-reopen', id: finding.id });
                  }}
                >
                  Reabrir achado
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
      <Timeline history={history.data} />
      {dialog ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reason-title"
          className="fixed inset-0 z-10 grid place-items-center bg-slate-950/50 p-4"
        >
          <form
            className="w-full max-w-lg rounded bg-white p-5"
            onSubmit={(event) => {
              event.preventDefault();
              if (!reason.trim()) return;
              if (dialog.kind === 'resolve' || dialog.kind === 'finding-reopen')
                transitionFinding.mutate({
                  id: dialog.id,
                  kind: dialog.kind,
                  detail: reason.trim(),
                });
              else
                decide.mutate({
                  value: dialog.kind === 'reject' ? 'reject' : 'reopen',
                  detail: reason.trim(),
                });
            }}
          >
            <h2 id="reason-title">Justificativa obrigatória</h2>
            <label className="mt-3 grid">
              Motivo
              <textarea
                autoFocus
                required
                maxLength={1000}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
            </label>
            <div className="mt-3 flex gap-2">
              <button disabled={!reason.trim() || decide.isPending || transitionFinding.isPending}>
                Confirmar
              </button>
              <button type="button" onClick={() => setDialog(undefined)}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}

function WorkflowActions({
  cycle,
  auth,
  pending,
  onAction,
  onApprove,
  onReason,
}: {
  readonly cycle: ReviewCycle;
  readonly auth: ReturnType<typeof useAuth>;
  readonly pending: boolean;
  readonly onAction: (value: 'start' | 'submit' | 'close') => void;
  readonly onApprove: () => void;
  readonly onReason: (kind: 'reject' | 'cycle-reopen') => void;
}) {
  return (
    <section className="mt-5" aria-labelledby="actions-title">
      <h2 id="actions-title">Ações permitidas</h2>
      <p>
        Duas etapas sequenciais de aprovação; a API determina a etapa e valida atores distintos.
      </p>
      <div className="flex flex-wrap gap-2">
        {cycle.status === 'OPEN' && auth.hasCapability('payroll.review.submit') ? (
          <button disabled={pending} onClick={() => onAction('start')}>
            Iniciar conferência
          </button>
        ) : null}
        {cycle.status === 'IN_REVIEW' && auth.hasCapability('payroll.review.submit') ? (
          <button disabled={pending} onClick={() => onAction('submit')}>
            Submeter
          </button>
        ) : null}
        {cycle.status === 'SUBMITTED' && auth.hasCapability('payroll.review.approve') ? (
          <button disabled={pending} onClick={onApprove}>
            Aprovar etapa {cycle.currentApprovalStage + 1}
          </button>
        ) : null}
        {cycle.status === 'SUBMITTED' && auth.hasCapability('payroll.review.reject') ? (
          <button disabled={pending} onClick={() => onReason('reject')}>
            Rejeitar
          </button>
        ) : null}
        {cycle.status === 'APPROVED' && auth.hasCapability('payroll.review.close') ? (
          <button
            disabled={pending}
            onClick={() =>
              globalThis.confirm('Confirma o fechamento deste ciclo?') && onAction('close')
            }
          >
            Fechar ciclo
          </button>
        ) : null}
        {(cycle.status === 'APPROVED' || cycle.status === 'CLOSED') &&
        auth.hasCapability('payroll.review.reopen') ? (
          <button disabled={pending} onClick={() => onReason('cycle-reopen')}>
            Reabrir ciclo
          </button>
        ) : null}
      </div>
      {pending ? <p role="status">Processando ação…</p> : null}
    </section>
  );
}

function FindingFormView({
  value,
  pending,
  onChange,
  onSubmit,
}: {
  readonly value: FindingForm;
  readonly pending: boolean;
  readonly onChange: (value: FindingForm) => void;
  readonly onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="my-5 grid gap-2 rounded border p-4 sm:grid-cols-2" onSubmit={onSubmit}>
      <h3 className="sm:col-span-2">Novo achado</h3>
      <label>
        Severidade
        <select
          value={value.severity}
          onChange={(event) =>
            onChange({ ...value, severity: event.target.value as FindingSeverity })
          }
        >
          <option value="INFORMATIONAL">Informativo</option>
          <option value="BLOCKING">Bloqueante</option>
        </select>
      </label>
      <label>
        Código
        <input
          required
          maxLength={100}
          value={value.code}
          onChange={(event) => onChange({ ...value, code: event.target.value })}
        />
      </label>
      <label className="sm:col-span-2">
        Título
        <input
          required
          maxLength={200}
          value={value.title}
          onChange={(event) => onChange({ ...value, title: event.target.value })}
        />
      </label>
      <label className="sm:col-span-2">
        Descrição
        <textarea
          required
          maxLength={2000}
          value={value.description}
          onChange={(event) => onChange({ ...value, description: event.target.value })}
        />
      </label>
      <label>
        Contrato (opcional)
        <input
          value={value.employmentContractId}
          onChange={(event) => onChange({ ...value, employmentContractId: event.target.value })}
        />
      </label>
      <label>
        Item calculado (opcional)
        <input
          value={value.payrollCalculationItemId}
          onChange={(event) => onChange({ ...value, payrollCalculationItemId: event.target.value })}
        />
      </label>
      <button className="sm:col-span-2" disabled={pending}>
        {pending ? 'Criando…' : 'Criar achado'}
      </button>
    </form>
  );
}

function Timeline({
  history,
}: {
  readonly history: Awaited<ReturnType<typeof payrollReviewApi.history>> | undefined;
}) {
  return (
    <section className="mt-8" aria-labelledby="history-title">
      <h2 id="history-title">Histórico</h2>
      {!history ? (
        <p role="status">Carregando histórico…</p>
      ) : history.timeline.length === 0 ? (
        <p>Nenhum evento registrado.</p>
      ) : (
        <ol className="border-l-2 border-slate-300 pl-5">
          {history.timeline.map((event) => (
            <li className="mb-4" key={event.id}>
              <strong>{eventLabel[event.eventType] ?? event.eventType}</strong>
              <p>
                {new Date(event.occurredAt).toLocaleString('pt-BR')} ·{' '}
                {event.actor?.displayName ?? event.actorId}
              </p>
              {event.reason ? <p>Motivo: {event.reason}</p> : null}
            </li>
          ))}
        </ol>
      )}
      {history?.invalidations?.length ? (
        <p role="note" className="rounded border border-amber-400 p-3">
          Decisões anteriores invalidadas: {history.invalidations.length}. A rodada atual exige
          novas aprovações.
        </p>
      ) : null}
    </section>
  );
}

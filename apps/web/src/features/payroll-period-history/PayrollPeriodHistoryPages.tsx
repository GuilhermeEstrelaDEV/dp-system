import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { useAuth } from '@/features/auth/AuthContext';
import { ApiClientError } from '@/lib/api';
import { payrollPeriodHistoryApi, type ClosureEvent } from './api';

const eventLabel: Record<string, string> = {
  PERIOD_CLOSURE_STARTED: 'Fechamento iniciado',
  VARIABLE_PAY_WARNING_ACKNOWLEDGED: 'Warning reconhecido',
  PERIOD_CLOSED: 'Competência fechada',
  PERIOD_REOPENING_STARTED: 'Reabertura iniciada',
  CLOSURE_EVIDENCE_INVALIDATED: 'Evidências anteriores invalidadas operacionalmente',
  PERIOD_REOPENED: 'Competência reaberta',
};
function ErrorView({ error }: { error: Error }) {
  const api = error instanceof ApiClientError ? error : null;
  return (
    <p role="alert">
      <strong>
        {api?.status === 404 ? 'Não encontrado' : api?.status === 403 ? 'Acesso negado' : 'Erro'}:
      </strong>{' '}
      {error.message}
    </p>
  );
}
function Timeline({ events }: { events: ClosureEvent[] }) {
  return (
    <ol aria-label="Timeline de eventos" className="grid gap-2">
      {events.map((event) => (
        <li key={event.id} className="rounded border p-3">
          <strong>{eventLabel[event.type] ?? event.type}</strong>
          <br />
          <time dateTime={event.occurredAt}>
            {new Date(event.occurredAt).toLocaleString('pt-BR')}
          </time>{' '}
          · {event.actor.displayName}
          {event.traceId ? (
            <small className="block">Trace: {event.traceId.slice(0, 12)}…</small>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

export function PayrollPeriodHistoryPage() {
  const { payrollPeriodId = '' } = useParams();
  const auth = useAuth();
  const client = useQueryClient();
  const [reason, setReason] = useState('');
  const history = useQuery({
    queryKey: ['period-history', payrollPeriodId],
    queryFn: () => payrollPeriodHistoryApi.list(payrollPeriodId),
  });
  const readiness = useQuery({
    queryKey: ['period-readiness', payrollPeriodId],
    queryFn: () => payrollPeriodHistoryApi.readiness(payrollPeriodId),
    enabled: auth.hasCapability('payroll.period.close.readiness'),
  });
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ['period-history', payrollPeriodId] });
    void client.invalidateQueries({ queryKey: ['period-readiness', payrollPeriodId] });
  };
  const close = useMutation({
    mutationFn: () =>
      payrollPeriodHistoryApi.close(
        payrollPeriodId,
        readiness.data!,
        history.data?.versions.at(-1)?.version ?? 0,
      ),
    onSuccess: refresh,
  });
  const reopen = useMutation({
    mutationFn: (version: number) =>
      payrollPeriodHistoryApi.reopen(
        payrollPeriodId,
        reason.trim(),
        readiness.data!.consistencyToken,
        version,
      ),
    onSuccess: () => {
      setReason('');
      refresh();
    },
  });
  const active = history.data?.versions.find((version) => version.isActive);
  return (
    <section>
      <PageHeader
        title="Histórico de Fechamentos"
        description="Versões e evidências imutáveis da competência."
      />
      {history.isLoading ? <p role="status">Carregando histórico…</p> : null}
      {history.isError ? <ErrorView error={history.error} /> : null}
      {history.data?.versions.length === 0 ? <p>Nenhum fechamento registrado.</p> : null}
      {readiness.data ? (
        <aside className="rounded border p-3">
          <strong>
            {readiness.data.isReady ? 'Novo fechamento disponível' : 'Bloqueios atuais'}
          </strong>
          <ul>
            {readiness.data.blockers.map((item) => (
              <li key={item.code}>{item.message}</li>
            ))}
          </ul>
          {active?.predecessor && !readiness.data.isReady ? (
            <p>Nova execução e novo review são obrigatórios.</p>
          ) : null}
        </aside>
      ) : null}
      <ol className="mt-4 grid gap-4" aria-label="Versões de fechamento">
        {history.data?.versions.map((version) => (
          <li key={version.id} className="rounded border bg-white p-4">
            <h2>
              Versão {version.version} <span>{version.isActive ? 'Atual' : 'Histórica'}</span>{' '}
              {version.reopenedAt ? <span>Reaberta</span> : null}
            </h2>
            <p>
              {version.status} · {version.actor.displayName} ·{' '}
              {new Date(version.openedAt).toLocaleString('pt-BR')}
            </p>
            <p>
              Execução: {version.payrollRun?.sequence ?? 'nova execução obrigatória'} · Review:{' '}
              {version.review?.reviewRound ?? 'novo review obrigatório'}
            </p>
            <p>Hash: {version.manifest?.hash ?? 'Sem manifesto'}</p>
            <p>
              Predecessora: {version.predecessor?.version ?? '—'} · Sucessora:{' '}
              {version.successor?.version ?? '—'}
            </p>
            <nav className="flex gap-2">
              <Link to={`versoes/${version.version}`}>Visualizar</Link>
              {version.manifest ? (
                <Link to={`versoes/${version.version}/manifesto`}>Manifesto</Link>
              ) : null}
              <Link to={`versoes/${version.version}/eventos`}>Eventos</Link>
            </nav>
          </li>
        ))}
      </ol>
      {active?.status === 'OPEN' && auth.hasCapability('payroll.period.close.execute') ? (
        <button
          disabled={!readiness.data?.isReady || close.isPending}
          onClick={() => close.mutate()}
        >
          Fechar competência
        </button>
      ) : null}
      {active?.status === 'CLOSED' && auth.hasCapability('payroll.period.close.reopen') ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (reason.trim()) reopen.mutate(active.version);
          }}
        >
          <label>
            Motivo da reabertura
            <input value={reason} onChange={(event) => setReason(event.target.value)} required />
          </label>
          <button disabled={!reason.trim() || !readiness.data || reopen.isPending}>
            Reabrir competência
          </button>
        </form>
      ) : null}
      {close.isError ? <ErrorView error={close.error} /> : null}
      {reopen.isError ? <ErrorView error={reopen.error} /> : null}
    </section>
  );
}

export function PayrollPeriodVersionPage() {
  const { payrollPeriodId = '', closureVersion = '0' } = useParams();
  const version = Number(closureVersion);
  const query = useQuery({
    queryKey: ['period-history-version', payrollPeriodId, version],
    queryFn: () => payrollPeriodHistoryApi.version(payrollPeriodId, version),
  });
  return (
    <section>
      <PageHeader
        title={`Fechamento — versão ${version}`}
        description="Detalhes somente leitura."
      />
      {query.isError ? <ErrorView error={query.error} /> : null}
      {query.data ? (
        <>
          <p>Status: {query.data.status}</p>
          <p>Ator: {query.data.actor.displayName}</p>
          <p>Execução: {query.data.payrollRun?.id ?? '—'}</p>
          <p>Review: {query.data.review?.id ?? '—'}</p>
          <Timeline events={query.data.events} />
        </>
      ) : (
        <p role="status">Carregando versão…</p>
      )}
    </section>
  );
}
export function PayrollPeriodEventsPage() {
  const { payrollPeriodId = '', closureVersion = '0' } = useParams();
  const version = Number(closureVersion);
  const query = useQuery({
    queryKey: ['period-history-events', payrollPeriodId, version],
    queryFn: () => payrollPeriodHistoryApi.events(payrollPeriodId, version),
  });
  return (
    <section>
      <PageHeader
        title={`Eventos — versão ${version}`}
        description="Timeline append-only em ordem cronológica."
      />
      {query.isError ? <ErrorView error={query.error} /> : null}
      {query.data ? (
        <Timeline events={query.data.events} />
      ) : (
        <p role="status">Carregando eventos…</p>
      )}
    </section>
  );
}
export function PayrollPeriodManifestPage() {
  const { payrollPeriodId = '', closureVersion = '0' } = useParams();
  const version = Number(closureVersion);
  const query = useQuery({
    queryKey: ['period-manifest', payrollPeriodId, version],
    queryFn: () => payrollPeriodHistoryApi.manifest(payrollPeriodId, version),
  });
  return (
    <section>
      <PageHeader
        title={`Manifesto — versão ${version}`}
        description="Evidência segura, imutável e somente leitura."
      />
      {query.isError ? <ErrorView error={query.error} /> : null}
      {query.data ? (
        <dl>
          <dt>Hash</dt>
          <dd>{query.data.hash}</dd>
          <dt>Algoritmo</dt>
          <dd>{query.data.algorithm}</dd>
          <dt>Schema</dt>
          <dd>{query.data.schemaVersion}</dd>
          <dt>Warnings</dt>
          <dd>{query.data.warnings.join(', ') || 'Nenhum'}</dd>
          <dt>Acknowledgements</dt>
          <dd>
            {query.data.acknowledgements.map((item) => item.warningCode).join(', ') || 'Nenhum'}
          </dd>
          <dt>Totais</dt>
          <dd>
            <pre>{JSON.stringify(query.data.totals, null, 2)}</pre>
          </dd>
          <dt>Referências</dt>
          <dd>
            <pre>{JSON.stringify(query.data.references, null, 2)}</pre>
          </dd>
        </dl>
      ) : (
        <p role="status">Carregando manifesto…</p>
      )}
    </section>
  );
}

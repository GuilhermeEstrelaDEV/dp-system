import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { useAuth } from '@/features/auth/AuthContext';
import { ApiClientError } from '@/lib/api';
import { minimalProjectionKey, minimalProjectionScopeKey } from '@/lib/projectionCache';
import {
  createPayrollClosureIdempotencyKey,
  payrollPeriodHistoryApi,
  type ClosureEvent,
} from './api';

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
          </time>
        </li>
      ))}
    </ol>
  );
}

export function PayrollPeriodHistoryPage() {
  const { payrollPeriodId = '' } = useParams();
  return (
    <section>
      <PageHeader
        title="Histórico de Fechamentos"
        description="Versões e evidências imutáveis da competência."
      />
      <PayrollPeriodHistoryPanel payrollPeriodId={payrollPeriodId} />
    </section>
  );
}

export function PayrollPeriodHistoryPanel({ payrollPeriodId }: { payrollPeriodId: string }) {
  const auth = useAuth();
  const client = useQueryClient();
  const [reason, setReason] = useState('');
  const [closeNote, setCloseNote] = useState('');
  const [payrollRunId, setPayrollRunId] = useState('');
  const [warningAcknowledgements, setWarningAcknowledgements] = useState<string[]>([]);
  const [closeIdempotencyKey, setCloseIdempotencyKey] = useState(() =>
    createPayrollClosureIdempotencyKey(),
  );
  const [reopenIdempotencyKey, setReopenIdempotencyKey] = useState(() =>
    createPayrollClosureIdempotencyKey(),
  );
  const historyKey = minimalProjectionKey(
    auth.activeCompanyId,
    auth.user?.actorId,
    'period-history',
    payrollPeriodId,
  );
  const readinessKey = minimalProjectionKey(
    auth.activeCompanyId,
    auth.user?.actorId,
    'period-readiness',
    payrollPeriodId,
    payrollRunId,
  );
  const history = useQuery({
    queryKey: historyKey,
    queryFn: () => payrollPeriodHistoryApi.list(payrollPeriodId),
  });
  const readiness = useQuery({
    queryKey: readinessKey,
    queryFn: () => payrollPeriodHistoryApi.readiness(payrollPeriodId, payrollRunId.trim()),
    enabled: Boolean(payrollPeriodId) && auth.hasCapability('payroll.period.close.readiness'),
  });
  const refresh = () => {
    void client.invalidateQueries({
      queryKey: minimalProjectionScopeKey(auth.activeCompanyId, auth.user?.actorId),
    });
  };
  useEffect(() => {
    setWarningAcknowledgements([]);
    setCloseIdempotencyKey(createPayrollClosureIdempotencyKey());
  }, [payrollPeriodId, payrollRunId, closeNote]);
  useEffect(() => {
    setReopenIdempotencyKey(createPayrollClosureIdempotencyKey());
  }, [payrollPeriodId, reason]);
  const close = useMutation({
    mutationFn: () =>
      payrollPeriodHistoryApi.close({
        periodId: payrollPeriodId,
        payrollRunId: payrollRunId.trim(),
        readiness: readiness.data!,
        expectedClosureVersion: history.data?.versions.at(-1)?.version ?? 0,
        warningAcknowledgements,
        idempotencyKey: closeIdempotencyKey,
        ...(closeNote.trim() ? { note: closeNote.trim() } : {}),
      }),
    onSuccess: () => {
      setCloseNote('');
      setWarningAcknowledgements([]);
      setCloseIdempotencyKey(createPayrollClosureIdempotencyKey());
      refresh();
    },
  });
  const reopen = useMutation({
    mutationFn: (version: number) =>
      payrollPeriodHistoryApi.reopen({
        periodId: payrollPeriodId,
        reason: reason.trim(),
        consistencyToken: readiness.data!.consistencyToken,
        expectedClosureVersion: version,
        idempotencyKey: reopenIdempotencyKey,
      }),
    onSuccess: () => {
      setReason('');
      setReopenIdempotencyKey(createPayrollClosureIdempotencyKey());
      refresh();
    },
  });
  const active = history.data?.versions.find((version) => version.isActive);
  const requiredAcknowledgements = readiness.data?.acknowledgementsRequired ?? [];
  const acknowledgementsComplete = requiredAcknowledgements.every((code) =>
    warningAcknowledgements.includes(code),
  );
  return (
    <section aria-label="Fechamento canônico da competência">
      <label>
        Execução de folha
        <input
          value={payrollRunId}
          onChange={(event) => setPayrollRunId(event.target.value)}
          placeholder="UUID da execução concluída"
        />
      </label>
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
              <li key={item.code}>{item.code}</li>
            ))}
          </ul>
          {readiness.data.warnings.length ? (
            <fieldset>
              <legend>Warnings que exigem reconhecimento explícito</legend>
              {readiness.data.warnings.map((item) => {
                const required = requiredAcknowledgements.includes(item.code);
                return (
                  <label key={item.code}>
                    <input
                      type="checkbox"
                      checked={warningAcknowledgements.includes(item.code)}
                      disabled={!required}
                      onChange={(event) => {
                        setWarningAcknowledgements((current) =>
                          event.target.checked
                            ? [...current, item.code]
                            : current.filter((code) => code !== item.code),
                        );
                      }}
                    />
                    {item.code}
                    {required ? ' (obrigatório)' : ''}
                  </label>
                );
              })}
            </fieldset>
          ) : null}
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
              {version.status} · {new Date(version.openedAt).toLocaleString('pt-BR')}
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
              <Link
                to={`/folha/competencias/${payrollPeriodId}/historico/versoes/${version.version}`}
              >
                Visualizar
              </Link>
              {version.manifest ? (
                <Link
                  to={`/folha/competencias/${payrollPeriodId}/historico/versoes/${version.version}/manifesto`}
                >
                  Manifesto
                </Link>
              ) : null}
              <Link
                to={`/folha/competencias/${payrollPeriodId}/historico/versoes/${version.version}/eventos`}
              >
                Eventos
              </Link>
            </nav>
          </li>
        ))}
      </ol>
      {(!active || active.status === 'OPEN') &&
      auth.hasCapability('payroll.period.close.execute') ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            close.mutate();
          }}
        >
          <label>
            Nota de fechamento (opcional)
            <textarea value={closeNote} onChange={(event) => setCloseNote(event.target.value)} />
          </label>
          <button
            disabled={
              !payrollRunId.trim() ||
              !readiness.data?.isReady ||
              !acknowledgementsComplete ||
              close.isPending
            }
          >
            Fechar competência
          </button>
        </form>
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
  const auth = useAuth();
  const version = Number(closureVersion);
  const query = useQuery({
    queryKey: minimalProjectionKey(
      auth.activeCompanyId,
      auth.user?.actorId,
      'period-history-version',
      payrollPeriodId,
      version,
    ),
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
  const auth = useAuth();
  const version = Number(closureVersion);
  const query = useQuery({
    queryKey: minimalProjectionKey(
      auth.activeCompanyId,
      auth.user?.actorId,
      'period-history-events',
      payrollPeriodId,
      version,
    ),
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
  const auth = useAuth();
  const version = Number(closureVersion);
  const query = useQuery({
    queryKey: minimalProjectionKey(
      auth.activeCompanyId,
      auth.user?.actorId,
      'period-manifest',
      payrollPeriodId,
      version,
    ),
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

import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithRouter } from '@/test/renderWithRouter';

const meta = { correlationId: 'trace-ui', timestamp: new Date(0).toISOString(), path: '/api/v1' };
const response = (data: unknown, status = 200) =>
  new Response(
    JSON.stringify(
      status < 400 ? { data, meta } : { error: { code: 'ERROR', message: String(data) }, meta },
    ),
    { status, headers: { 'content-type': 'application/json' } },
  );
const permissions = [
  'payroll.period.close.history',
  'payroll.period.close.readiness',
  'payroll.period.close.execute',
  'payroll.period.close.reopen',
];

describe('payroll period public history', () => {
  it('shows multiple versions, predecessor, active badge, evidence links and blockers', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) =>
        Promise.resolve(
          url.includes('closure-readiness')
            ? response({
                isReady: false,
                consistencyToken: new Date(0).toISOString(),
                selectedPayrollRun: null,
                blockers: [{ code: 'PAYROLL_RUN_NOT_FOUND', message: 'Nova execução obrigatória' }],
                warnings: [],
                acknowledgementsRequired: [],
              })
            : response({
                payrollPeriodId: 'period-1',
                versions: [
                  {
                    id: 'closure-1',
                    version: 1,
                    status: 'CLOSED',
                    isActive: false,
                    openedAt: new Date(0).toISOString(),
                    closedAt: new Date(1).toISOString(),
                    reopenedAt: new Date(2).toISOString(),
                    supersededAt: new Date(2).toISOString(),
                    actor: { id: 'actor', displayName: 'Ana DP' },
                    payrollRun: { id: 'run-1', sequence: 1, status: 'COMPLETED' },
                    review: { id: 'review-1', reviewRound: 1, status: 'CLOSED' },
                    predecessor: null,
                    successor: { id: 'closure-2', version: 2 },
                    manifest: {
                      id: 'manifest-1',
                      version: 1,
                      hash: 'abc123',
                      algorithm: 'sha256-canonical-json-v1',
                      createdAt: new Date(1).toISOString(),
                    },
                    events: [],
                  },
                  {
                    id: 'closure-2',
                    version: 2,
                    status: 'OPEN',
                    isActive: true,
                    openedAt: new Date(2).toISOString(),
                    closedAt: null,
                    reopenedAt: null,
                    supersededAt: null,
                    actor: { id: 'actor', displayName: 'Ana DP' },
                    payrollRun: null,
                    review: null,
                    predecessor: { id: 'closure-1', version: 1 },
                    successor: null,
                    manifest: null,
                    events: [],
                  },
                ],
              }),
        ),
      ),
    );
    renderWithRouter('/folha/competencias/period-1/historico', true, permissions);
    expect(
      await screen.findByRole('heading', { name: 'Histórico de Fechamentos' }),
    ).toBeInTheDocument();
    expect(await screen.findByText(/Versão 1/)).toBeInTheDocument();
    expect(screen.getByText(/Versão 2/)).toBeInTheDocument();
    expect(screen.getByText('Nova execução obrigatória')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Manifesto' })).toBeInTheDocument();
    expect(screen.getByText(/Predecessora: 1/)).toBeInTheDocument();
  });

  it('renders safe manifest and chronological event timeline', async () => {
    const fetchMock = vi.fn((url: string) =>
      Promise.resolve(
        url.endsWith('/manifest')
          ? response({
              closureVersion: 1,
              hash: 'hash-safe',
              algorithm: 'sha256-canonical-json-v1',
              schemaVersion: '1.0',
              warnings: ['VARIABLE_PAY_PENDING'],
              acknowledgements: [
                { warningCode: 'VARIABLE_PAY_PENDING', acknowledgedAt: new Date(0).toISOString() },
              ],
              totals: { net: '900.00' },
              references: {
                payrollRunId: 'run',
                reviewCycleId: 'review',
                decisions: [],
                findings: [],
                employees: [],
              },
            })
          : response({
              events: [
                {
                  id: 'e1',
                  type: 'PERIOD_CLOSURE_STARTED',
                  occurredAt: new Date(0).toISOString(),
                  actor: { id: 'a', displayName: 'Ana' },
                  traceId: 'trace-completo',
                },
                {
                  id: 'e2',
                  type: 'PERIOD_CLOSED',
                  occurredAt: new Date(1).toISOString(),
                  actor: { id: 'a', displayName: 'Ana' },
                  traceId: 'trace-completo',
                },
              ],
            }),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    const manifest = renderWithRouter(
      '/folha/competencias/period-1/historico/versoes/1/manifesto',
      true,
      permissions,
    );
    expect(await screen.findByText('hash-safe')).toBeInTheDocument();
    expect(screen.getByText(/900\.00/)).toBeInTheDocument();
    manifest.unmount();
    renderWithRouter('/folha/competencias/period-1/historico/versoes/1/eventos', true, permissions);
    const timeline = await screen.findByRole('list', { name: 'Timeline de eventos' });
    const items = within(timeline).getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Fechamento iniciado');
    expect(items[1]).toHaveTextContent('Competência fechada');
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  });

  it('denies the UI without the history capability', async () => {
    renderWithRouter('/folha/competencias/period-1/historico', true, []);
    expect(await screen.findByRole('heading', { name: 'Acesso negado' })).toBeInTheDocument();
  });
});

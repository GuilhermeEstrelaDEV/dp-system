import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithRouter } from '@/test/renderWithRouter';

const meta = {
  correlationId: 'trace',
  timestamp: '2026-07-30T00:00:00Z',
  path: '/api/v1/dashboard/summary',
};
const success = (data: unknown) =>
  new Response(JSON.stringify({ data, meta }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
const summary = {
  context: {
    companyId: 'company-1',
    companyName: 'Empresa Teste',
    generatedAt: '2026-07-30T00:00:00Z',
    timezone: 'UTC',
  },
  access: 'AVAILABLE',
  review: {
    metrics: [
      { value: 2, label: 'Ciclos de conferência', description: 'Total registrado.' },
      { value: 1, label: 'Achados abertos', description: 'Achados OPEN.' },
    ],
    statusDistribution: [{ key: 'OPEN', label: 'OPEN', value: 2 }],
    sixMonthTimeline: [{ key: '2026-07', label: 'jul.', value: 1 }],
    recentActivity: [
      {
        type: 'REVIEW_STARTED',
        occurredAt: '2026-07-20T12:00:00Z',
        description: 'Conferência iniciada',
      },
    ],
  },
};

describe('executive dashboard', () => {
  it('renders real metrics, accessible charts, activity and authorized shortcut', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(success(summary));
    renderWithRouter('/');
    expect(await screen.findByRole('heading', { name: 'Visão executiva' })).toBeInTheDocument();
    expect(screen.getAllByText('2').length).toBeGreaterThan(0);
    expect(screen.getByRole('list', { name: 'Ciclos por status' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: /Eventos de conferência/ })).toBeInTheDocument();
    expect(screen.getByText('Conferência iniciada')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Consultar conferências de folha' }),
    ).toBeInTheDocument();
  });

  it('shows the fail-closed state without capabilities and no shortcut', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      success({ ...summary, access: 'RESTRICTED', review: undefined }),
    );
    renderWithRouter('/', true, []);
    expect(await screen.findByText('Indicadores restritos')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Consultar conferências/ })).not.toBeInTheDocument();
  });

  it('shows loading, controlled error and retry', async () => {
    let resolveRequest: ((response: Response) => void) | undefined;
    vi.spyOn(globalThis, 'fetch').mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
    );
    renderWithRouter('/');
    expect(screen.getByLabelText('Carregando indicadores executivos')).toBeInTheDocument();
    resolveRequest?.(
      new Response(JSON.stringify({ error: { code: 'ERROR', message: 'Falha' }, meta }), {
        status: 403,
      }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar o dashboard',
    );
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument();
  });

  it('shows a semantically empty company without inventing numbers', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      success({
        ...summary,
        review: {
          ...summary.review,
          metrics: [],
          statusDistribution: [],
          sixMonthTimeline: [],
          recentActivity: [],
        },
      }),
    );
    renderWithRouter('/');
    expect(await screen.findByText('Empresa sem dados disponíveis')).toBeInTheDocument();
  });
});

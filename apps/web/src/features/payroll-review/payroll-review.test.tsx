import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithRouter } from '@/test/renderWithRouter';
import type { ReviewCycle, ReviewHistory, ReviewStatus } from './api';

const meta = { correlationId: 'trace-ui', timestamp: new Date(0).toISOString(), path: '/api/v1' };
const response = (data: unknown, status = 200) =>
  new Response(
    JSON.stringify(
      status < 400 ? { data, meta } : { error: { code: 'ERROR', message: String(data) }, meta },
    ),
    { status, headers: { 'content-type': 'application/json' } },
  );
const finding = {
  id: 'finding-1',
  severity: 'BLOCKING' as const,
  status: 'OPEN' as const,
  code: 'DIVERGENCE',
  title: 'Divergência',
  description: 'Valor requer conferência',
  createdBy: 'actor',
  createdAt: new Date(0).toISOString(),
  events: [],
};

function cycle(status: ReviewStatus): ReviewCycle {
  return {
    id: 'review-1',
    companyId: 'company-1',
    payrollRunId: 'run-1',
    status,
    reviewRound: 1,
    submissionNumber: 1,
    currentApprovalStage: status === 'SUBMITTED' ? 0 : 2,
    createdBy: 'preparer',
    createdAt: new Date(0).toISOString(),
    findings: [finding],
    events: [],
    approvalStages: [
      {
        id: 'stage-1',
        sequence: 1,
        code: 'V1_STAGE_1',
        requiredCapability: 'payroll.review.approve',
      },
      {
        id: 'stage-2',
        sequence: 2,
        code: 'V1_STAGE_2',
        requiredCapability: 'payroll.review.approve',
      },
    ],
    decisions: [],
  };
}

function history(status: ReviewStatus): ReviewHistory {
  return {
    ...cycle(status),
    currentState: status,
    timeline: [
      {
        id: 'event-1',
        eventType: 'REVIEW_CYCLE_OPENED',
        actorId: 'actor',
        actor: { id: 'actor', displayName: 'Ana' },
        occurredAt: new Date(0).toISOString(),
        nextState: { status: 'OPEN' },
      },
    ],
    invalidations:
      status === 'IN_REVIEW'
        ? [
            {
              id: 'invalid-1',
              reviewRound: 0,
              invalidatedAt: new Date(0).toISOString(),
              invalidatedBy: 'actor',
              invalidationReason: 'Correção',
            },
          ]
        : [],
  };
}

function mockDetail(status: ReviewStatus) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = String(input);
    if (url.endsWith('/history')) return response(history(status));
    if (init?.method === 'POST') return response(cycle(status));
    return response(cycle(status));
  });
}

describe('payroll review frontend', () => {
  it('lists executions, handles empty/loading and opens a run detail', async () => {
    let resolveRequest: ((value: Response) => void) | undefined;
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveRequest = resolve;
        }),
    );
    renderWithRouter('/folha/conferencia');
    fireEvent.change(screen.getByLabelText('Identificador da competência'), {
      target: { value: 'period-1' },
    });
    expect(await screen.findByRole('status')).toHaveTextContent('Carregando execuções');
    resolveRequest?.(
      response({ items: [], pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 } }),
    );
    expect(await screen.findByText('Nenhuma execução encontrada.')).toBeInTheDocument();
  });

  it('creates a finding and exposes blocking status without relying on color', async () => {
    const fetchMock = mockDetail('IN_REVIEW');
    renderWithRouter('/folha/conferencia/review-1');
    expect(await screen.findByText(/1 achado\(s\) BLOCKING aberto/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Código'), { target: { value: 'NEW' } });
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Novo achado' } });
    fireEvent.change(screen.getByLabelText('Descrição'), {
      target: { value: 'Descrição técnica' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar achado' }));
    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some(
          ([url, init]) => String(url).endsWith('/findings') && init?.method === 'POST',
        ),
      ).toBe(true),
    );
    expect(
      screen.getByText(
        'Decisões anteriores invalidadas: 1. A rodada atual exige novas aprovações.',
      ),
    ).toBeInTheDocument();
  });

  it('lists cycles and creates a cycle only for a completed execution', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.endsWith('/payroll-runs/run-1/reviews')) {
        if (init?.method === 'POST') return response(cycle('OPEN'));
        return response([]);
      }
      if (url.endsWith('/payroll-runs/run-1'))
        return response({
          id: 'run-1',
          payrollPeriodId: 'period',
          sequence: 1,
          status: 'COMPLETED',
          engineVersion: 'v1',
          messages: [],
        });
      return response([]);
    });
    renderWithRouter('/folha/execucoes/run-1');
    const createButton = await screen.findByRole('button', { name: 'Criar ciclo de conferência' });
    await waitFor(() => expect(createButton).toBeEnabled());
    fireEvent.click(createButton);
    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some(
          ([url, init]) =>
            String(url).endsWith('/payroll-runs/run-1/reviews') && init?.method === 'POST',
        ),
      ).toBe(true),
    );
  });

  it('resolves and reopens findings with required confirmation reasons', async () => {
    const fetchMock = mockDetail('IN_REVIEW');
    renderWithRouter('/folha/conferencia/review-1');
    fireEvent.click(await screen.findByRole('button', { name: 'Resolver' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('button', { name: 'Confirmar' })).toBeDisabled();
    fireEvent.change(within(dialog).getByLabelText('Motivo'), { target: { value: 'Conferido' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirmar' }));
    await waitFor(() =>
      expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/resolve'))).toBe(true),
    );
  });

  it('reopens a resolved finding with a mandatory reason', async () => {
    const resolvedCycle = cycle('IN_REVIEW');
    resolvedCycle.findings = [{ ...finding, status: 'RESOLVED' }];
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      if (String(input).endsWith('/history')) return response(history('IN_REVIEW'));
      if (init?.method === 'POST') return response(resolvedCycle.findings[0]);
      return response(resolvedCycle);
    });
    renderWithRouter('/folha/conferencia/review-1');
    fireEvent.click(await screen.findByRole('button', { name: 'Reabrir achado' }));
    fireEvent.change(screen.getByLabelText('Motivo'), { target: { value: 'Nova evidência' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    await waitFor(() =>
      expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/reopen'))).toBe(true),
    );
  });

  it.each([
    ['OPEN', 'Iniciar conferência', '/start'],
    ['IN_REVIEW', 'Submeter', '/submit'],
    ['SUBMITTED', 'Aprovar etapa 1', '/approve'],
  ] as const)('executes the valid %s action through the backend', async (status, label, suffix) => {
    const fetchMock = mockDetail(status);
    renderWithRouter('/folha/conferencia/review-1');
    fireEvent.click(await screen.findByRole('button', { name: label }));
    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some(
          ([url, init]) => String(url).endsWith(suffix) && init?.method === 'POST',
        ),
      ).toBe(true),
    );
  });

  it.each([
    ['SUBMITTED', 'Rejeitar', '/reject'],
    ['APPROVED', 'Reabrir ciclo', '/reopen'],
    ['CLOSED', 'Reabrir ciclo', '/reopen'],
  ] as const)('requires a reason for %s workflow action', async (status, label, suffix) => {
    const fetchMock = mockDetail(status);
    renderWithRouter('/folha/conferencia/review-1');
    fireEvent.click(await screen.findByRole('button', { name: label }));
    fireEvent.change(screen.getByLabelText('Motivo'), {
      target: { value: 'Justificativa registrada' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some(
          ([url, init]) => String(url).endsWith(suffix) && init?.method === 'POST',
        ),
      ).toBe(true),
    );
  });

  it('confirms closing and renders normalized conflict errors', async () => {
    vi.spyOn(globalThis, 'confirm').mockReturnValue(true);
    const fetchMock = mockDetail('APPROVED');
    renderWithRouter('/folha/conferencia/review-1');
    fireEvent.click(await screen.findByRole('button', { name: 'Fechar ciclo' }));
    await waitFor(() =>
      expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/close'))).toBe(true),
    );
  });
});

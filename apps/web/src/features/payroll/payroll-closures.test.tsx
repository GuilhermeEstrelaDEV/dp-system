import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithRouter } from '@/test/renderWithRouter';

const meta = { correlationId: 'trace-ui', timestamp: new Date(0).toISOString(), path: '/api/v1' };
const response = (data: unknown) =>
  new Response(JSON.stringify({ data, meta }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
const capabilities = [
  'platform.manage',
  'payroll.period.close.history',
  'payroll.period.close.readiness',
  'payroll.period.close.execute',
  'payroll.period.close.reopen',
];
const readiness = {
  isReady: true,
  consistencyToken: 'consistency-token',
  selectedPayrollRun: { id: 'run-1', sequence: 1 },
  blockers: [],
  warnings: [{ code: 'VARIABLE_PAY_PENDING' }],
  acknowledgementsRequired: ['VARIABLE_PAY_PENDING'],
};
const openHistory = {
  payrollPeriodId: 'period-1',
  versions: [
    {
      id: 'closure-1',
      version: 1,
      status: 'OPEN',
      isActive: true,
      openedAt: new Date(0).toISOString(),
      closedAt: null,
      reopenedAt: null,
      supersededAt: null,
      payrollRun: null,
      review: null,
      predecessor: null,
      successor: null,
      manifest: null,
      events: [],
    },
  ],
};

describe('Payroll closures canonical page', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('protects the migrated route with the canonical history capability', async () => {
    renderWithRouter('/folha/fechamentos', true, ['platform.manage']);
    expect(await screen.findByRole('heading', { name: 'Acesso restrito' })).toBeInTheDocument();
  });

  it('requires explicit evidence and calls only the canonical close route', async () => {
    const fetchMock = vi.fn((input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('closure-readiness')) return Promise.resolve(response(readiness));
      if (url.endsWith('/close') && init?.method === 'POST') return Promise.resolve(response({}));
      return Promise.resolve(response(openHistory));
    });
    vi.stubGlobal('fetch', fetchMock);
    renderWithRouter('/folha/fechamentos', true, capabilities);

    fireEvent.change(screen.getByLabelText('Competência'), { target: { value: 'period-1' } });
    fireEvent.change(await screen.findByLabelText('Execução de folha'), {
      target: { value: 'run-1' },
    });
    const closeButton = screen.getByRole('button', { name: 'Fechar competência' });
    expect(closeButton).toBeDisabled();
    fireEvent.click(await screen.findByLabelText('VARIABLE_PAY_PENDING (obrigatório)'));
    fireEvent.click(closeButton);

    await waitFor(() => {
      const call = fetchMock.mock.calls.find(
        ([url, init]) =>
          String(url).endsWith('/payroll-periods/period-1/close') && init?.method === 'POST',
      );
      expect(call).toBeDefined();
      expect(new Headers(call?.[1]?.headers).get('Idempotency-Key')).toEqual(expect.any(String));
      expect(JSON.parse(String(call?.[1]?.body))).toEqual({
        payrollRunId: 'run-1',
        expectedConsistencyToken: 'consistency-token',
        expectedClosureVersion: 1,
        warningAcknowledgements: [{ warningCode: 'VARIABLE_PAY_PENDING', acknowledged: true }],
      });
    });
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/payroll-closures'))).toBe(
      false,
    );
  });

  it('requires a reason and sends the canonical reopening evidence', async () => {
    const closedHistory = {
      ...openHistory,
      versions: [
        {
          ...openHistory.versions[0],
          status: 'CLOSED',
          closedAt: new Date(1).toISOString(),
        },
      ],
    };
    const fetchMock = vi.fn((input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('closure-readiness')) return Promise.resolve(response(readiness));
      if (url.endsWith('/reopen') && init?.method === 'POST') return Promise.resolve(response({}));
      return Promise.resolve(response(closedHistory));
    });
    vi.stubGlobal('fetch', fetchMock);
    renderWithRouter('/folha/fechamentos', true, capabilities);
    fireEvent.change(screen.getByLabelText('Competência'), { target: { value: 'period-1' } });

    const reopenButton = await screen.findByRole('button', { name: 'Reabrir competência' });
    expect(reopenButton).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Motivo da reabertura'), {
      target: { value: 'Correção operacional necessária' },
    });
    fireEvent.click(reopenButton);

    await waitFor(() => {
      const call = fetchMock.mock.calls.find(
        ([url, init]) =>
          String(url).endsWith('/payroll-periods/period-1/reopen') && init?.method === 'POST',
      );
      expect(call).toBeDefined();
      expect(new Headers(call?.[1]?.headers).get('Idempotency-Key')).toEqual(expect.any(String));
      expect(JSON.parse(String(call?.[1]?.body))).toEqual({
        reason: 'Correção operacional necessária',
        expectedConsistencyToken: 'consistency-token',
        expectedClosureVersion: 1,
      });
    });
  });
});

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PayrollPage } from './index';

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));
vi.mock('@/lib/api', () => ({ apiRequest }));

function renderPage() {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter initialEntries={['/folha/fechamentos']}>
        <PayrollPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const emptyPage = {
  items: [],
  pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 },
};

describe('Payroll closures page', () => {
  beforeEach(() => {
    apiRequest.mockReset();
    apiRequest.mockResolvedValue(emptyPage);
  });

  it('renders the demonstrative notice, navigation and closure history', async () => {
    apiRequest.mockResolvedValueOnce({
      items: [
        {
          id: 'closure-1',
          payrollPeriodId: 'period-1',
          action: 'CLOSED',
          reason: 'Fechamento demonstrativo',
          engineVersion: 'foundation-v1',
          parameterVersion: 'snapshot-v1',
        },
      ],
      pagination: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
    });
    renderPage();
    fireEvent.change(screen.getByLabelText('Competência'), { target: { value: 'period-1' } });

    expect(await screen.findByRole('listitem')).toHaveTextContent('Fechamento demonstrativo');
    expect(screen.getByText(/motor foundation-v1/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Fechamentos' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('note')).toHaveTextContent(
      'não representa folha de pagamento homologada',
    );
  });

  it('submits a valid closure and exposes API conflicts', async () => {
    apiRequest.mockImplementation((path: string, init?: RequestInit) => {
      if (path === '/payroll-closures' && init?.method === 'POST') {
        return Promise.reject(new Error('Não há execução concluída para fechar a competência'));
      }
      return Promise.resolve(emptyPage);
    });
    renderPage();
    fireEvent.change(screen.getByLabelText('Competência'), { target: { value: 'period-1' } });
    fireEvent.change(screen.getByLabelText('Justificativa de fechamento (opcional)'), {
      target: { value: 'Revisão demonstrativa' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Fechar competência' }));

    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith('/payroll-closures', {
        method: 'POST',
        body: JSON.stringify({ payrollPeriodId: 'period-1', reason: 'Revisão demonstrativa' }),
      }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('execução concluída');
  });

  it('requires a justification before reopening and posts it when provided', async () => {
    apiRequest
      .mockResolvedValueOnce({
        items: [
          {
            id: 'closure-1',
            payrollPeriodId: 'period-1',
            action: 'CLOSED',
            engineVersion: 'foundation-v1',
          },
        ],
        pagination: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
      })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce(emptyPage);
    renderPage();
    fireEvent.change(screen.getByLabelText('Competência'), { target: { value: 'period-1' } });
    fireEvent.click(await screen.findByRole('button', { name: 'Reabrir competência' }));

    expect(screen.getByRole('button', { name: 'Confirmar reabertura' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Justificativa para reabertura'), {
      target: { value: 'Correção demonstrativa' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar reabertura' }));

    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith('/payroll-closures/period-1/reopen', {
        method: 'POST',
        body: JSON.stringify({ reason: 'Correção demonstrativa' }),
      }),
    );
  });
});

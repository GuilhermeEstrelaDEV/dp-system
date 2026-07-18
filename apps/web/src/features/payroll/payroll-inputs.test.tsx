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
      <MemoryRouter initialEntries={['/folha/lancamentos']}>
        <PayrollPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Payroll inputs page', () => {
  beforeEach(() => apiRequest.mockReset());

  it('filters input records by payroll period', async () => {
    apiRequest.mockResolvedValueOnce({
      items: [
        {
          id: 'input-1',
          amount: '12.34',
          sourceKey: 'demo-key',
          status: 'PENDING',
          payrollPeriod: { referenceDate: '2026-01-01', status: 'OPEN' },
          payrollRubric: { code: 'DEMO', name: 'Lançamento demonstrativo' },
        },
      ],
      pagination: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
    });
    renderPage();
    fireEvent.change(screen.getByLabelText('Filtrar por competência'), {
      target: { value: 'period-1' },
    });

    expect(await screen.findByRole('listitem')).toHaveTextContent('Lançamento demonstrativo');
    expect(apiRequest).toHaveBeenCalledWith(
      '/payroll-inputs?payrollPeriodId=period-1&page=1&pageSize=20&sortBy=createdAt&sortDirection=desc',
    );
  });

  it('does not send invalid decimal input to the API', () => {
    renderPage();
    fireEvent.change(screen.getByLabelText('Competência'), { target: { value: 'period-1' } });
    fireEvent.change(screen.getByLabelText('Colaborador'), { target: { value: 'employee-1' } });
    fireEvent.change(screen.getByLabelText('Contrato'), { target: { value: 'contract-1' } });
    fireEvent.change(screen.getByLabelText('Rubrica'), { target: { value: 'rubric-1' } });
    fireEvent.change(screen.getByLabelText('Valor decimal demonstrativo'), {
      target: { value: 'not-a-decimal' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar lançamento' }));

    expect(screen.getByRole('alert')).toHaveTextContent('valor decimal válido');
    expect(apiRequest).not.toHaveBeenCalled();
  });

  it('inactivates a pending input through the API', async () => {
    apiRequest
      .mockResolvedValueOnce({
        items: [
          {
            id: 'input-1',
            amount: '12.34',
            status: 'PENDING',
            payrollPeriod: { referenceDate: '2026-01-01', status: 'OPEN' },
            payrollRubric: { code: 'DEMO', name: 'Lançamento demonstrativo' },
          },
        ],
        pagination: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
      })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        items: [],
        pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 },
      });
    renderPage();
    fireEvent.change(screen.getByLabelText('Filtrar por competência'), {
      target: { value: 'period-1' },
    });
    fireEvent.click(await screen.findByRole('button', { name: 'Inativar lançamento' }));

    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith('/payroll-inputs/input-1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'INACTIVE' }),
      }),
    );
  });
});

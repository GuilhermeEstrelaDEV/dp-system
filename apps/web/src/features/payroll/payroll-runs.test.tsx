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
      <MemoryRouter initialEntries={['/folha/execucoes']}>
        <PayrollPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Payroll runs page', () => {
  beforeEach(() => apiRequest.mockReset());

  it('lists preserved versions and demonstrative warnings by period', async () => {
    apiRequest.mockResolvedValueOnce({
      items: [
        {
          id: 'run-1',
          sequence: 1,
          status: 'COMPLETED',
          engineVersion: 'foundation-v1',
          parameterVersion: 'snapshot-v1',
          employees: [
            {
              id: 'result-1',
              employmentContractId: 'contract-1',
              status: 'CALCULATED',
              grossAmount: '1500.00',
              netAmount: '1400.00',
            },
          ],
          messages: [
            {
              id: 'message-1',
              severity: 'WARNING',
              code: 'DEMONSTRATIVE_RUN',
              message: 'Execução técnica demonstrativa sem cálculo legal homologado.',
            },
          ],
        },
      ],
      pagination: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
    });
    renderPage();
    fireEvent.change(screen.getByLabelText('Filtrar por competência'), {
      target: { value: 'period-1' },
    });

    expect((await screen.findAllByRole('listitem'))[0]).toHaveTextContent('Execução 1');
    expect(screen.getByText(/DEMONSTRATIVE_RUN/)).toBeInTheDocument();
    expect(screen.getByText(/bruto 1500.00 · líquido 1400.00/)).toBeInTheDocument();
    expect(apiRequest).toHaveBeenCalledWith(
      '/payroll-runs?payrollPeriodId=period-1&page=1&pageSize=20&sortBy=createdAt&sortDirection=desc',
    );
  });

  it('starts a technical run with explicit engine and parameter versions', async () => {
    apiRequest.mockImplementation((path: string, init?: RequestInit) => {
      if (path === '/payroll-runs' && init?.method === 'POST')
        return Promise.resolve({ id: 'run-1' });
      return Promise.resolve({
        items: [],
        pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 },
      });
    });
    renderPage();
    fireEvent.change(screen.getByLabelText('Competência'), { target: { value: 'period-1' } });
    fireEvent.change(screen.getByLabelText('Versão do motor'), {
      target: { value: 'foundation-v2' },
    });
    fireEvent.change(screen.getByLabelText('Versão do snapshot de parâmetros (opcional)'), {
      target: { value: 'snapshot-v2' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar execução técnica' }));

    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith('/payroll-runs', {
        method: 'POST',
        body: JSON.stringify({
          payrollPeriodId: 'period-1',
          engineVersion: 'foundation-v2',
          parameterSnapshotVersion: 'snapshot-v2',
        }),
      }),
    );
  });
});

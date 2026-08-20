import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PayrollPage } from '@/features/payroll';

const { apiRequest, useOptionalAuth } = vi.hoisted(() => ({
  apiRequest: vi.fn(),
  useOptionalAuth: vi.fn(),
}));
vi.mock('@/lib/api', () => ({ apiRequest }));
vi.mock('@/features/auth/AuthContext', () => ({ useOptionalAuth }));

function renderPage() {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter initialEntries={['/folha/remuneracao-variavel']}>
        <PayrollPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Variable compensation page', () => {
  beforeEach(() => {
    apiRequest.mockReset();
    useOptionalAuth.mockReturnValue({
      activeCompanyId: 'company-horizon',
      hasCapability: () => true,
    });
  });

  it('lists administrative variable compensation records by contract', async () => {
    apiRequest.mockResolvedValueOnce([
      { id: 'event-1', type: 'COMMISSION', amount: '125.50', approvalStatus: 'PENDING' },
    ]);
    renderPage();
    fireEvent.change(screen.getByLabelText('Contrato'), { target: { value: 'contract-1' } });
    const table = await screen.findByRole('table', {
      name: 'Registros de remuneração variável',
    });
    expect(table).toHaveTextContent('COMMISSION');
    expect(table).toHaveTextContent('125.50');
    expect(table).toHaveTextContent('PENDING');
    expect(apiRequest).toHaveBeenCalledWith(
      '/variable-compensation/events?employmentContractId=contract-1',
    );
    expect(table).toHaveClass('ui-data-table');
    expect(screen.getByTestId('responsive-table-wrapper')).toHaveClass('ui-table-scroll');
  });

  it('registers a salary advance as a decimal input without calculating payroll', async () => {
    apiRequest.mockImplementation((path: string, init?: RequestInit) => {
      if (path === '/variable-compensation/advances' && init?.method === 'POST')
        return Promise.resolve({ id: 'advance-1' });
      return Promise.resolve([]);
    });
    renderPage();
    fireEvent.change(screen.getByLabelText('Tipo de registro'), { target: { value: 'advances' } });
    fireEvent.change(screen.getByLabelText('Contrato'), { target: { value: 'contract-1' } });
    fireEvent.change(screen.getByLabelText('Competência'), { target: { value: '2026-07-01' } });
    fireEvent.change(screen.getByLabelText('Valor'), { target: { value: '100.00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar' }));
    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith('/variable-compensation/advances', {
        method: 'POST',
        body: JSON.stringify({
          employmentContractId: 'contract-1',
          amount: '100.00',
          referencePeriod: '2026-07-01',
        }),
      }),
    );
  });

  it('keeps records readable and hides registration without manage capability', async () => {
    useOptionalAuth.mockReturnValue({
      activeCompanyId: 'company-horizon',
      hasCapability: () => false,
    });
    apiRequest.mockResolvedValue([
      { id: 'event-read-only', type: 'BONUS', amount: '90.00', approvalStatus: 'PENDING' },
    ]);
    renderPage();
    fireEvent.change(screen.getByLabelText('Contrato'), { target: { value: 'contract-1' } });

    expect(
      await screen.findByRole('table', { name: 'Registros de remuneração variável' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Registrar' })).not.toBeInTheDocument();
  });
});

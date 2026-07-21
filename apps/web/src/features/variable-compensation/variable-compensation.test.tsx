import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PayrollPage } from '@/features/payroll';

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));
vi.mock('@/lib/api', () => ({ apiRequest }));

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
  beforeEach(() => apiRequest.mockReset());

  it('lists administrative variable compensation records by contract', async () => {
    apiRequest.mockResolvedValueOnce([
      { id: 'event-1', type: 'COMMISSION', amount: '125.50', approvalStatus: 'PENDING' },
    ]);
    renderPage();
    fireEvent.change(screen.getByLabelText('Contrato'), { target: { value: 'contract-1' } });
    expect((await screen.findAllByRole('listitem')).at(-1)).toHaveTextContent(
      'COMMISSION · 125.50 · PENDING',
    );
    expect(apiRequest).toHaveBeenCalledWith(
      '/variable-compensation/events?employmentContractId=contract-1',
    );
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
});

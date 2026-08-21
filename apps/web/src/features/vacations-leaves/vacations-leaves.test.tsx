import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VacationManagementPage, VacationsLeavesPage } from './index';

const { apiRequest, useOptionalAuth } = vi.hoisted(() => ({
  apiRequest: vi.fn(),
  useOptionalAuth: vi.fn(),
}));
vi.mock('@/lib/api', () => ({ apiRequest }));
vi.mock('@/features/auth/AuthContext', () => ({ useOptionalAuth }));

describe('VacationsLeavesPage', () => {
  beforeEach(() => {
    apiRequest.mockResolvedValue([]);
    useOptionalAuth.mockReturnValue({
      activeCompanyId: 'company-horizon',
      hasCapability: () => true,
    });
  });
  it('renders only the approved demonstrative leave controls', async () => {
    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <VacationsLeavesPage />
      </QueryClientProvider>,
    );
    expect(await screen.findByRole('heading', { name: 'Afastamentos' })).toBeInTheDocument();
    expect(
      await screen.findByText('Nenhum afastamento demonstrativo encontrado.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Registrar afastamento' })).toBeInTheDocument();
    expect(screen.queryByText(/período aquisitivo/i)).not.toBeInTheDocument();
  });

  it('keeps the responsive leave table read-only without leave.manage', async () => {
    useOptionalAuth.mockReturnValue({
      activeCompanyId: 'company-horizon',
      hasCapability: () => false,
    });
    apiRequest.mockResolvedValueOnce([]).mockResolvedValueOnce([
      {
        id: 'leave-read-only',
        startDate: '2026-08-20T00:00:00.000Z',
        expectedReturnDate: '2026-08-25T00:00:00.000Z',
        status: 'OPEN',
        leaveType: { name: 'Afastamento demonstrativo' },
        employmentContract: { registrationNumber: 'DEMO-001' },
      },
    ]);
    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <VacationsLeavesPage />
      </QueryClientProvider>,
    );

    const table = await screen.findByRole('table', { name: 'Tabela de afastamentos' });
    expect(table).toHaveClass('ui-data-table');
    expect(screen.getByTestId('responsive-table-wrapper')).toHaveClass('ui-table-scroll');
    expect(screen.queryByText('Novo tipo de afastamento')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Registrar retorno' })).not.toBeInTheDocument();
  });

  it('renders the capability-aware vacation workflow with shared tables', async () => {
    apiRequest
      .mockResolvedValueOnce([
        {
          id: 'period',
          employmentContractId: 'contract',
          accrualStart: '2025-01-01T00:00:00.000Z',
          accrualEnd: '2025-12-31T00:00:00.000Z',
          status: 'OPEN',
          _count: { requests: 1, alerts: 0 },
        },
      ])
      .mockResolvedValueOnce([]);
    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <VacationManagementPage />
      </QueryClientProvider>,
    );
    expect(await screen.findByRole('heading', { name: 'Férias' })).toBeInTheDocument();
    expect(await screen.findByRole('table', { name: 'Tabela de períodos de férias' })).toHaveClass(
      'ui-data-table',
    );
    expect(screen.getAllByTestId('responsive-table-wrapper')).toHaveLength(1);
    expect(screen.getByRole('heading', { name: 'Nova solicitação' })).toBeInTheDocument();
  });
});

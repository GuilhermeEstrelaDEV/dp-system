import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdmissionsPage } from './index';
const { apiRequest, useOptionalAuth } = vi.hoisted(() => ({
  apiRequest: vi.fn(),
  useOptionalAuth: vi.fn(),
}));
vi.mock('@/lib/api', () => ({ apiRequest }));
vi.mock('@/features/auth/AuthContext', () => ({ useOptionalAuth }));
function view() {
  return render(
    <MemoryRouter>
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <AdmissionsPage />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}
describe('AdmissionsPage', () => {
  beforeEach(() => {
    apiRequest.mockReset();
    useOptionalAuth.mockReturnValue({
      activeCompanyId: 'company-horizon',
      hasCapability: () => true,
    });
  });
  it('renders empty state', async () => {
    apiRequest.mockResolvedValue([]);
    view();
    expect(
      await screen.findByText('Nenhuma admissão demonstrativa encontrada.'),
    ).toBeInTheDocument();
  });

  it('uses the shared responsive table and hides management actions without capability', async () => {
    useOptionalAuth.mockReturnValue({
      activeCompanyId: 'company-horizon',
      hasCapability: () => false,
    });
    apiRequest.mockResolvedValue([
      {
        id: 'admission-read-only',
        status: 'DRAFT',
        plannedAdmissionDate: '2026-08-20T00:00:00.000Z',
        employee: { legalName: 'Colaborador demonstrativo' },
        checklistInstances: [],
      },
    ]);
    view();

    const table = await screen.findByRole('table', { name: 'Tabela de admissões' });
    expect(table).toHaveClass('ui-data-table');
    expect(screen.getByTestId('responsive-table-wrapper')).toHaveClass('ui-table-scroll');
    expect(screen.getByRole('link', { name: 'Detalhes' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Nova admissão' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Editar' })).not.toBeInTheDocument();
  });
});

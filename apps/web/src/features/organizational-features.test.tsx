import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BranchesPage } from './branches';
import { CompaniesPage } from './companies';
import { CostCentersPage } from './cost-centers';
import { DepartmentsPage } from './departments';
import { PositionsPage } from './positions';

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));
vi.mock('@/lib/api', () => ({ apiRequest }));

function renderFeature(element: React.ReactNode) {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      {element}
    </QueryClientProvider>,
  );
}

describe('organizational structure features', () => {
  beforeEach(() => apiRequest.mockReset());
  it.each([
    [CompaniesPage, 'Empresas'],
    [BranchesPage, 'Filiais'],
    [DepartmentsPage, 'Departamentos'],
    [PositionsPage, 'Cargos'],
    [CostCentersPage, 'Centros de custo'],
  ])('renders %s', async (Page, title) => {
    apiRequest.mockResolvedValueOnce({ items: [], pagination: { totalPages: 1 } });
    renderFeature(<Page />);
    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
  });

  it('shows error, filters and confirms inactivation', async () => {
    apiRequest.mockRejectedValueOnce(new Error('Falha simulada'));
    const errorView = renderFeature(<CompaniesPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Falha simulada');
    errorView.unmount();

    apiRequest.mockResolvedValue({
      items: [
        {
          id: 'company-demo',
          legalName: 'Empresa Fictícia',
          tradeName: 'Demo',
          taxId: '00',
          status: 'ACTIVE',
        },
      ],
      pagination: { totalPages: 2 },
    });
    renderFeature(<CompaniesPage />);
    fireEvent.change(screen.getByLabelText('Filtrar por status'), {
      target: { value: 'ACTIVE' },
    });
    expect(await screen.findByRole('button', { name: 'Inativar' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Inativar' }));
    expect(
      screen.getByRole('dialog', { name: 'Confirmar alteração de status' }),
    ).toBeInTheDocument();
  });
});

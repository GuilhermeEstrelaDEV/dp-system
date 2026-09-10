import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BranchesPage } from './branches';
import { CompaniesPage } from './companies';
import { CostCentersPage } from './cost-centers';
import { DepartmentsPage } from './departments';
import { PositionsPage } from './positions';

const { apiRequest, useOptionalAuth } = vi.hoisted(() => ({
  apiRequest: vi.fn(),
  useOptionalAuth: vi.fn(),
}));
vi.mock('@/lib/api', () => ({ apiRequest }));
vi.mock('@/features/auth/AuthContext', () => ({ useOptionalAuth }));

function renderFeature(element: React.ReactNode) {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter>{element}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('organizational structure features', () => {
  beforeEach(() => {
    apiRequest.mockReset();
    useOptionalAuth.mockReturnValue({ hasCapability: () => true });
  });
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
    expect(screen.getByTestId('responsive-table-wrapper')).toHaveClass('ui-table-scroll');
    expect(screen.getByRole('table', { name: 'Tabela de empresas' })).toHaveClass('ui-data-table');
    expect(screen.getByRole('button', { name: 'Detalhes' }).parentElement).toHaveClass(
      'ui-table-actions',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Inativar' }));
    expect(
      screen.getByRole('dialog', { name: 'Confirmar alteração de status' }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Inativar registro' }));
    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith('/companies/company-demo/inactivate', {
        method: 'PATCH',
      }),
    );
  });

  it('supports detail, editing, creation and pagination with the shared resource flow', async () => {
    apiRequest.mockResolvedValue({
      items: [
        {
          id: 'company-demo',
          legalName: 'Empresa Fictícia',
          tradeName: 'Demo',
          taxId: '00.000.000/0001-00',
          status: 'ACTIVE',
        },
      ],
      pagination: { totalPages: 2 },
    });

    renderFeature(<CompaniesPage />);
    expect(await screen.findByRole('button', { name: 'Detalhes' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Detalhes' }));
    expect(screen.getByRole('region', { name: 'Detalhes do registro' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    expect(screen.queryByRole('region', { name: 'Detalhes do registro' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Razão social/), {
      target: { value: 'Empresa Fictícia Atualizada' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith(
        '/companies/company-demo',
        expect.objectContaining({ method: 'PATCH' }),
      ),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Nova empresa' }));
    fireEvent.change(screen.getByLabelText(/Razão social/), {
      target: { value: 'Nova Empresa Fictícia' },
    });
    fireEvent.change(screen.getByLabelText(/Nome fantasia/), { target: { value: 'Nova Demo' } });
    fireEvent.change(screen.getByLabelText(/CNPJ fictício/), {
      target: { value: '11.111.111/0001-11' },
    });
    fireEvent.click(screen.getAllByRole('button', { name: 'Nova empresa' })[1]!);
    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith(
        '/companies',
        expect.objectContaining({ method: 'POST' }),
      ),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Próxima página' }));
    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith(expect.stringContaining('/companies?page=2')),
    );
  });

  it('keeps details visible and hides management actions without capability', async () => {
    useOptionalAuth.mockReturnValue({ hasCapability: () => false });
    apiRequest.mockResolvedValue({
      items: [
        {
          id: 'company-read-only',
          legalName: 'Empresa Fictícia de Nome Extenso para Leitura',
          tradeName: 'Somente leitura',
          taxId: '00.000.000/0001-00',
          status: 'ACTIVE',
        },
      ],
      pagination: { totalPages: 1 },
    });
    renderFeature(<CompaniesPage />);
    expect(await screen.findByRole('button', { name: 'Detalhes' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Inativar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Novo' })).not.toBeInTheDocument();
  });

  it('keeps the optional branch tax identifier optional and accessible', async () => {
    useOptionalAuth.mockReturnValue({
      activeCompanyId: '00000000-0000-4000-8000-000000000001',
      hasCapability: () => true,
    });
    apiRequest
      .mockResolvedValueOnce({ items: [], pagination: { totalPages: 1 } })
      .mockResolvedValueOnce({ id: 'branch-demo', status: 'ACTIVE' })
      .mockResolvedValue({ items: [], pagination: { totalPages: 1 } });
    renderFeature(<BranchesPage />);

    await screen.findByText('Nenhum registro em filiais');
    fireEvent.click(screen.getAllByRole('button', { name: 'Nova filial' })[0]!);
    fireEvent.change(screen.getByLabelText(/Código/), { target: { value: 'FIL-01' } });
    fireEvent.change(screen.getByLabelText(/^Nome/), { target: { value: 'Filial Demo' } });
    const taxId = screen.getByLabelText(/CNPJ fictício/);
    expect(taxId).toHaveAttribute('aria-required', 'false');

    const submit = screen
      .getAllByRole('button', { name: 'Nova filial' })
      .find((button) => button.getAttribute('type') === 'submit');
    expect(submit).toBeDefined();
    fireEvent.click(submit!);

    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith(
        '/branches',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            code: 'FIL-01',
            name: 'Filial Demo',
            taxId: '',
            companyId: '00000000-0000-4000-8000-000000000001',
          }),
        }),
      ),
    );
  });
});

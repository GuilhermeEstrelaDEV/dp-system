import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EmploymentContractDetailsPage, EmploymentContractsPage } from './index';
const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));
vi.mock('@/lib/api', () => ({ apiRequest }));
function renderPage(path = '/contratos') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <Routes>
          <Route path="/contratos" element={<EmploymentContractsPage />} />
          <Route path="/contratos/:contractId" element={<EmploymentContractDetailsPage />} />
          <Route path="/employees/:employeeId/contracts" element={<EmploymentContractsPage />} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}
describe('EmploymentContractsPage', () => {
  beforeEach(() => apiRequest.mockReset());
  it('supports the employee contracts route and displays the demonstrative empty state', async () => {
    apiRequest.mockResolvedValue({ items: [] });
    renderPage('/employees/00000000-0000-4000-8000-000000000001/contracts');
    expect(await screen.findByText('Nenhum contrato demonstrativo encontrado')).toBeInTheDocument();
    expect(screen.getByLabelText(/^ID do colaborador/)).toHaveValue(
      '00000000-0000-4000-8000-000000000001',
    );
  });
  it('shows a contract with its active status', async () => {
    apiRequest.mockResolvedValue({
      items: [
        {
          id: 'contract-demo',
          registrationNumber: 'DEMO-01',
          employeeId: 'employee-1',
          companyId: 'company-1',
          status: 'ACTIVE',
          employee: { legalName: 'Pessoa Fictícia' },
          company: { tradeName: 'Empresa Demo' },
        },
      ],
    });
    renderPage();
    expect(await screen.findByText('DEMO-01')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Detalhes' })).toHaveAttribute(
      'href',
      '/contratos/contract-demo',
    );
    expect(screen.getByTestId('responsive-table-wrapper')).toHaveClass('ui-table-scroll');
    expect(screen.getByRole('table', { name: 'Tabela de contratos de trabalho' })).toHaveClass(
      'ui-data-table',
    );
    expect(screen.getByRole('columnheader', { name: 'Matrícula' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Colaborador' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Empresa' })).toBeInTheDocument();
    expect(screen.getByText('Ativo')).toHaveClass('ui-badge--success');
  });

  it('exposes contract editing through the detail flow', async () => {
    apiRequest.mockResolvedValue({
      id: 'contract-demo',
      employeeId: '00000000-0000-4000-8000-000000000001',
      companyId: '00000000-0000-4000-8000-000000000002',
      branchId: null,
      departmentId: null,
      positionId: '00000000-0000-4000-8000-000000000003',
      costCenterId: null,
      registrationNumber: 'DEMO-01',
      contractType: 'DEMONSTRATIVO',
      employmentRegime: 'DEMONSTRATIVO',
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: null,
      weeklyHours: 44,
      status: 'ACTIVE',
      employee: { legalName: 'Pessoa Fictícia' },
      company: { tradeName: 'Empresa Demo' },
      history: [],
    });
    renderPage('/contratos/contract-demo');
    expect(await screen.findByRole('heading', { name: 'Contrato DEMO-01' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Editar contrato' }));
    expect(screen.getByLabelText(/^ID do colaborador/)).toHaveAttribute('readonly');
    fireEvent.change(screen.getByLabelText(/Matrícula manual/), {
      target: { value: 'DEMO-02' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith(
        '/employment-contracts/contract-demo',
        expect.objectContaining({ method: 'PATCH' }),
      ),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Inativar contrato' }));
    expect(
      screen.getByRole('dialog', { name: 'Confirmar alteração do contrato' }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(
      screen.queryByRole('dialog', { name: 'Confirmar alteração do contrato' }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Inativar contrato' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Inativar contrato' })[1]!);
    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith('/employment-contracts/contract-demo/inactivate', {
        method: 'PATCH',
        body: JSON.stringify({ reason: 'Alteração demonstrativa de status' }),
      }),
    );
  });
});

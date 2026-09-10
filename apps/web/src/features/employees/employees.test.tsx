import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EmployeeDetailsPage } from './EmployeeDetailsPage';
import { EmployeesPage } from './index';

const { apiRequest, useOptionalAuth } = vi.hoisted(() => ({
  apiRequest: vi.fn(),
  useOptionalAuth: vi.fn(),
}));
vi.mock('@/lib/api', () => ({ apiRequest }));
vi.mock('@/features/auth/AuthContext', () => ({ useOptionalAuth }));
function renderPage(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <Routes>
          <Route path="/colaboradores" element={<EmployeesPage />} />
          <Route path="/colaboradores/:employeeId" element={<EmployeeDetailsPage />} />
          <Route
            path="/colaboradores/:employeeId/contratos"
            element={<p>Cadastro inicial de contrato</p>}
          />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}
describe('EmployeesPage', () => {
  beforeEach(() => {
    apiRequest.mockReset();
    useOptionalAuth.mockReset();
    useOptionalAuth.mockReturnValue({
      activeCompanyId: 'company-demo',
      hasCapability: () => true,
    });
  });
  it('renders an empty demonstrative list and employee form validation', async () => {
    apiRequest.mockResolvedValue({ items: [] });
    renderPage('/colaboradores');
    expect(
      await screen.findByText('Nenhum colaborador demonstrativo encontrado'),
    ).toBeInTheDocument();
    expect(apiRequest).toHaveBeenCalledWith('/employees');
    fireEvent.click(screen.getAllByRole('button', { name: 'Novo colaborador' })[0]!);
    fireEvent.click(screen.getByRole('button', { name: 'Criar colaborador' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Nome legal é obrigatório');
  });

  it('routes a newly created employee to its first contract before opening the scoped detail', async () => {
    apiRequest.mockImplementation((path: string, options?: RequestInit) => {
      if (path === '/employees' && options?.method === 'POST') {
        return Promise.resolve({
          id: 'employee-new',
          legalName: 'Nova Pessoa Fictícia',
          preferredName: null,
          status: 'ACTIVE',
        });
      }
      return Promise.resolve({ items: [] });
    });
    renderPage('/colaboradores');

    await screen.findByText('Nenhum colaborador demonstrativo encontrado');
    fireEvent.click(screen.getAllByRole('button', { name: 'Novo colaborador' })[0]!);
    fireEvent.change(screen.getByLabelText(/Nome legal/), {
      target: { value: 'Nova Pessoa Fictícia' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar colaborador' }));

    expect(await screen.findByText('Cadastro inicial de contrato')).toBeInTheDocument();
    expect(apiRequest).toHaveBeenCalledWith('/employees', {
      method: 'POST',
      body: JSON.stringify({ legalName: 'Nova Pessoa Fictícia' }),
    });
  });
  it('shows active employee and allows logical inactivation', async () => {
    apiRequest.mockResolvedValue({
      items: [
        {
          id: 'employee-demo',
          legalName: 'Pessoa Fictícia',
          preferredName: null,
          status: 'ACTIVE',
        },
      ],
    });
    renderPage('/colaboradores');
    expect(await screen.findByRole('link', { name: 'Pessoa Fictícia' })).toBeInTheDocument();
    expect(screen.getByTestId('responsive-table-wrapper')).toHaveClass('ui-table-scroll');
    expect(screen.getByRole('table', { name: 'Tabela de colaboradores' })).toHaveClass(
      'ui-data-table',
    );
    expect(screen.getByRole('button', { name: 'Inativar' }).parentElement).toHaveClass(
      'ui-table-actions',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Inativar' }));
    expect(
      screen.getByRole('dialog', { name: 'Confirmar alteração de status' }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Inativar colaborador' }));
    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith('/employees/employee-demo/inactivate', {
        method: 'PATCH',
      }),
    );
  });

  it('edits a collaborator from the detail flow and refreshes its projections', async () => {
    apiRequest.mockResolvedValue({
      id: 'employee-demo',
      legalName: 'Pessoa Fictícia',
      preferredName: null,
      status: 'ACTIVE',
      contacts: [],
      employmentContracts: [],
    });
    renderPage('/colaboradores/employee-demo');
    expect(await screen.findByRole('heading', { name: 'Pessoa Fictícia' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Editar colaborador' }));
    fireEvent.change(screen.getByLabelText(/Nome legal/), {
      target: { value: 'Pessoa Atualizada' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith('/employees/employee-demo', {
        method: 'PATCH',
        body: JSON.stringify({ legalName: 'Pessoa Atualizada' }),
      }),
    );
  });

  it('blocks an unsupported preferred-name removal instead of reporting a false save', async () => {
    apiRequest.mockResolvedValue({
      id: 'employee-demo',
      legalName: 'Pessoa Fictícia',
      preferredName: 'Pessoa Demo',
      status: 'ACTIVE',
      contacts: [],
      employmentContracts: [],
    });
    renderPage('/colaboradores/employee-demo');
    expect(await screen.findByRole('heading', { name: 'Pessoa Demo' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Editar colaborador' }));
    fireEvent.change(screen.getByLabelText(/Nome social ou preferencial/), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'A API atual não permite remover o nome preferencial',
    );
    expect(apiRequest).toHaveBeenCalledTimes(1);
  });

  it('uses contract.manage independently for contract creation actions', async () => {
    apiRequest.mockResolvedValue({
      id: 'employee-demo',
      legalName: 'Pessoa Fictícia',
      preferredName: null,
      status: 'ACTIVE',
      contacts: [],
      employmentContracts: [],
    });
    useOptionalAuth.mockReturnValue({
      activeCompanyId: 'company-demo',
      hasCapability: (capability: string) => capability === 'employee.manage',
    });

    const employeeManager = renderPage('/colaboradores/employee-demo');
    expect(await screen.findByRole('button', { name: 'Editar colaborador' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Novo contrato/ })).not.toBeInTheDocument();
    employeeManager.unmount();

    useOptionalAuth.mockReturnValue({
      activeCompanyId: 'company-demo',
      hasCapability: (capability: string) => capability === 'contract.manage',
    });
    renderPage('/colaboradores/employee-demo');
    expect((await screen.findAllByRole('link', { name: /Novo contrato/ })).length).toBeGreaterThan(
      0,
    );
    expect(screen.queryByRole('button', { name: 'Editar colaborador' })).not.toBeInTheDocument();
  });

  it('shows a failed status mutation inside the confirmation dialog', async () => {
    apiRequest
      .mockResolvedValueOnce({
        items: [
          {
            id: 'employee-demo',
            legalName: 'Pessoa Fictícia',
            preferredName: null,
            status: 'ACTIVE',
          },
        ],
      })
      .mockRejectedValueOnce(new Error('Falha controlada ao inativar'));
    renderPage('/colaboradores');
    fireEvent.click(await screen.findByRole('button', { name: 'Inativar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Inativar colaborador' }));

    const dialog = screen.getByRole('dialog', { name: 'Confirmar alteração de status' });
    expect(await screen.findByRole('alert')).toHaveTextContent('Falha controlada ao inativar');
    expect(dialog).toContainElement(screen.getByRole('alert'));
  });

  it('edits and inactivates a contact while preserving the employee detail flow', async () => {
    apiRequest.mockResolvedValue({
      id: 'employee-demo',
      legalName: 'Pessoa Fictícia',
      preferredName: null,
      status: 'ACTIVE',
      contacts: [
        {
          id: 'contact-demo',
          employeeId: 'employee-demo',
          type: 'EMAIL',
          value: 'pessoa@demo.local',
          isPrimary: true,
          status: 'ACTIVE',
        },
      ],
      employmentContracts: [
        {
          id: 'contract-demo',
          registrationNumber: 'DEMO-001',
          status: 'ACTIVE',
        },
      ],
    });

    renderPage('/colaboradores/employee-demo');
    expect(await screen.findByText('pessoa@demo.local')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Detalhes' })).toHaveAttribute(
      'href',
      '/contratos/contract-demo',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    fireEvent.change(screen.getByLabelText(/Contato \*/), {
      target: { value: 'atualizado@demo.local' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar contato' }));
    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith(
        '/employees/employee-demo/contacts/contact-demo',
        expect.objectContaining({ method: 'PATCH' }),
      ),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Inativar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Inativar contato' }));
    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith(
        '/employees/employee-demo/contacts/contact-demo/inactivate',
        { method: 'PATCH' },
      ),
    );
  });
});

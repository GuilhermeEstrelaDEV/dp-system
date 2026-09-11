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
    const view = renderPage('/colaboradores');
    expect(
      await screen.findByText('Nenhum colaborador demonstrativo encontrado'),
    ).toBeInTheDocument();
    expect(apiRequest).toHaveBeenCalledWith('/employees');
    fireEvent.click(screen.getAllByRole('button', { name: 'Novo colaborador' })[0]!);
    expect(view.container.querySelectorAll('.ui-form-section')).toHaveLength(4);
    expect(view.container.querySelectorAll('.ui-form-grid')).toHaveLength(4);
    expect(view.container.querySelector('.ui-form-actions')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Criar colaborador' }));
    expect(await screen.findByText('Nome completo é obrigatório')).toBeInTheDocument();
    expect(screen.getByText('CPF é obrigatório')).toBeInTheDocument();
    expect(screen.getByText('Data de nascimento é obrigatória')).toBeInTheDocument();
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
    fireEvent.change(screen.getByLabelText(/Nome completo/), {
      target: { value: 'Nova Pessoa Fictícia' },
    });
    fireEvent.change(screen.getByLabelText(/CPF/), { target: { value: '529.982.247-25' } });
    fireEvent.change(screen.getByLabelText(/Data de nascimento/), {
      target: { value: '1990-02-28' },
    });
    fireEvent.change(screen.getByLabelText(/Estado civil/), { target: { value: 'SINGLE' } });
    fireEvent.change(screen.getByLabelText(/E-mail pessoal/), {
      target: { value: 'nova.pessoa@dp-system.local' },
    });
    fireEvent.change(screen.getByLabelText(/^CEP/), { target: { value: '70000-001' } });
    fireEvent.change(screen.getByLabelText(/Logradouro/), {
      target: { value: 'Rua Demonstrativa' },
    });
    fireEvent.change(screen.getByLabelText(/^Número/), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText(/^Cidade/), {
      target: { value: 'Cidade Demonstrativa' },
    });
    fireEvent.change(screen.getByLabelText(/^UF/), { target: { value: 'DF' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar colaborador' }));

    expect(await screen.findByText('Cadastro inicial de contrato')).toBeInTheDocument();
    expect(apiRequest).toHaveBeenCalledWith('/employees', {
      method: 'POST',
      body: JSON.stringify({
        legalName: 'Nova Pessoa Fictícia',
        cpf: '52998224725',
        birthDate: '1990-02-28',
        maritalStatus: 'SINGLE',
        personalEmail: 'nova.pessoa@dp-system.local',
        address: {
          postalCode: '70000001',
          street: 'Rua Demonstrativa',
          number: '10',
          city: 'Cidade Demonstrativa',
          state: 'DF',
          country: 'Brasil',
        },
      }),
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
      cpf: '52998224725',
      birthDate: '1990-02-28T00:00:00.000Z',
      status: 'ACTIVE',
      contacts: [],
      employmentContracts: [],
    });
    renderPage('/colaboradores/employee-demo');
    expect(await screen.findByRole('heading', { name: 'Pessoa Fictícia' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Editar colaborador' }));
    fireEvent.change(screen.getByLabelText(/Nome completo/), {
      target: { value: 'Pessoa Atualizada' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith('/employees/employee-demo', {
        method: 'PATCH',
        body: JSON.stringify({
          legalName: 'Pessoa Atualizada',
          cpf: '52998224725',
          birthDate: '1990-02-28',
        }),
      }),
    );
  });

  it('shows the expanded sections, masks CPF in detail and blocks invalid editing', async () => {
    apiRequest.mockResolvedValue({
      id: 'employee-demo',
      legalName: 'Pessoa Fictícia',
      preferredName: 'Pessoa Demo',
      cpf: '52998224725',
      birthDate: '1990-02-28T00:00:00.000Z',
      maritalStatus: 'MARRIED',
      nationality: 'Brasil',
      placeOfBirth: 'Cidade Demonstrativa',
      status: 'ACTIVE',
      contacts: [],
      address: {
        postalCode: '70000001',
        street: 'Rua Demonstrativa',
        number: '10',
        complement: null,
        district: 'Bairro Exemplo',
        city: 'Cidade Demonstrativa',
        state: 'DF',
        country: 'Brasil',
      },
      emergencyContact: {
        name: 'Contato Fictício',
        relationship: 'Pessoa indicada',
        phone: '11988880000',
      },
      employmentContracts: [],
    });
    renderPage('/colaboradores/employee-demo');
    expect(await screen.findByRole('heading', { name: 'Pessoa Demo' })).toBeInTheDocument();
    expect(screen.getByText('***.***.247-25')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Endereço' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Contato de emergência' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Editar colaborador' }));
    fireEvent.change(screen.getByLabelText(/CPF/), { target: { value: '111.111.111-11' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(await screen.findByText('CPF inválido')).toBeInTheDocument();
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
    expect((await screen.findAllByText('pessoa@demo.local')).length).toBeGreaterThan(0);
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

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EmploymentContractsPage } from './index';
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
    expect(
      await screen.findByText('Nenhum contrato demonstrativo encontrado.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('ID do colaborador')).toHaveValue(
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
    expect(await screen.findByRole('link', { name: 'DEMO-01' })).toBeInTheDocument();
  });
});

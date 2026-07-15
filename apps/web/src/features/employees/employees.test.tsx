import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EmployeesPage } from './index';

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));
vi.mock('@/lib/api', () => ({ apiRequest }));
function renderPage() {
  return render(
    <MemoryRouter>
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <EmployeesPage />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}
describe('EmployeesPage', () => {
  beforeEach(() => apiRequest.mockReset());
  it('renders an empty demonstrative list and employee form validation', async () => {
    apiRequest.mockResolvedValue({ items: [] });
    renderPage();
    expect(
      await screen.findByText('Nenhum colaborador demonstrativo encontrado.'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Novo colaborador' }));
    fireEvent.click(screen.getByRole('button', { name: 'Criar colaborador' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Nome legal é obrigatório');
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
    renderPage();
    expect(await screen.findByRole('link', { name: 'Pessoa Fictícia' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Inativar' }));
    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith('/employees/employee-demo/inactivate', {
        method: 'PATCH',
      }),
    );
  });
});

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PayrollPage } from './index';

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));
vi.mock('@/lib/api', () => ({ apiRequest }));

function renderPage() {
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter initialEntries={['/folha/competencias']}>
        <PayrollPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Payroll period workflows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiRequest.mockResolvedValue({
      items: [],
      pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 },
    });
  });
  it('renders navigation and the permanent non-homologated notice', () => {
    renderPage();
    expect(screen.getByRole('link', { name: 'Competências' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByText(/não representa folha de pagamento homologada/i)).toBeInTheDocument();
  });
  it('requires a company before listing and shows its empty state', async () => {
    renderPage();
    fireEvent.change(screen.getByRole('textbox', { name: 'Filtrar por empresa' }), {
      target: { value: 'company' },
    });
    expect(
      await screen.findByText('Nenhuma competência demonstrativa encontrada.'),
    ).toBeInTheDocument();
    expect(apiRequest).toHaveBeenCalledWith(
      '/payroll-periods?companyId=company&page=1&pageSize=20',
    );
  });
  it('creates a period and preserves the form on a conflict', async () => {
    apiRequest.mockRejectedValueOnce(new Error('Competência duplicada'));
    renderPage();
    fireEvent.change(screen.getByRole('textbox', { name: 'Empresa' }), {
      target: { value: 'company' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Calendário' }), {
      target: { value: 'calendar' },
    });
    fireEvent.change(screen.getByLabelText('Referência'), { target: { value: '2026-07-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar competência' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Competência duplicada');
    expect(screen.getByRole('textbox', { name: 'Empresa' })).toHaveValue('company');
  });
  it('shows immutable closed periods and opens the reopening workflow', async () => {
    apiRequest.mockResolvedValueOnce({
      items: [{ id: 'period', referenceDate: '2026-07-01', status: 'CLOSED' }],
      pagination: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
    });
    renderPage();
    fireEvent.change(screen.getByRole('textbox', { name: 'Filtrar por empresa' }), {
      target: { value: 'company' },
    });
    expect(await screen.findByText(/imutável/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reabrir' }));
    expect(screen.getByRole('button', { name: 'Confirmar reabertura' })).toBeDisabled();
  });
});

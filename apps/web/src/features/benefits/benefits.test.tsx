import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BenefitsPage } from './index';

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));
vi.mock('@/lib/api', () => ({ apiRequest }));

function renderPage() {
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <BenefitsPage />
    </QueryClientProvider>,
  );
}

describe('BenefitsPage', () => {
  beforeEach(() => apiRequest.mockResolvedValue([]));

  it('shows the demonstrative catalog empty state and main forms', async () => {
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Benefícios' })).toBeInTheDocument();
    expect(
      await screen.findByText('Nenhum benefício demonstrativo encontrado.'),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Salvar' })).toHaveLength(3);
  });

  it('applies the accessible catalog search filter', async () => {
    renderPage();
    await screen.findByText('Nenhum benefício demonstrativo encontrado.');
    fireEvent.change(screen.getByRole('textbox', { name: 'Pesquisar catálogo' }), {
      target: { value: 'vale' },
    });
    expect(apiRequest).toHaveBeenLastCalledWith('/benefits?search=vale');
  });

  it('shows an API failure without hiding the benefit workspace', async () => {
    apiRequest.mockRejectedValueOnce(new Error('Falha demonstrativa'));
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent('Falha demonstrativa');
    expect(screen.getByRole('heading', { name: 'Adesões por contrato' })).toBeInTheDocument();
  });
});

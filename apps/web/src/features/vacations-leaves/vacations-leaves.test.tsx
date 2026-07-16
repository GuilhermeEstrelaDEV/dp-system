import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VacationsLeavesPage } from './index';

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));
vi.mock('@/lib/api', () => ({ apiRequest }));

describe('VacationsLeavesPage', () => {
  beforeEach(() => apiRequest.mockResolvedValue([]));
  it('identifies the demonstrative vacation and leave controls', async () => {
    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <VacationsLeavesPage />
      </QueryClientProvider>,
    );
    expect(
      await screen.findByRole('heading', { name: 'Férias e afastamentos' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Nenhum período demonstrativo encontrado.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Registrar afastamento' })).toBeInTheDocument();
  });
});

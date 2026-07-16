import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TimeManagementPage } from './index';
const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));
vi.mock('@/lib/api', () => ({ apiRequest }));
describe('TimeManagementPage', () => {
  beforeEach(() => apiRequest.mockResolvedValue([]));
  it('identifies the demonstrative time controls', async () => {
    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <TimeManagementPage />
      </QueryClientProvider>,
    );
    expect(
      await screen.findByRole('heading', { name: 'Jornada e banco de horas' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fechar competência' })).toBeInTheDocument();
  });
});

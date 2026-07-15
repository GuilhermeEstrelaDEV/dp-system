import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdmissionsPage } from './index';
const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));
vi.mock('@/lib/api', () => ({ apiRequest }));
function view() {
  return render(
    <MemoryRouter>
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <AdmissionsPage />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}
describe('AdmissionsPage', () => {
  beforeEach(() => apiRequest.mockReset());
  it('renders empty state', async () => {
    apiRequest.mockResolvedValue([]);
    view();
    expect(
      await screen.findByText('Nenhuma admissão demonstrativa encontrada.'),
    ).toBeInTheDocument();
  });
});

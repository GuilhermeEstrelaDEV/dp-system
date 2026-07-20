import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PayrollPage } from './index';

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));
vi.mock('@/lib/api', () => ({ apiRequest }));

function renderPage() {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter initialEntries={['/folha/parametros']}>
        <PayrollPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const emptyPage = {
  items: [],
  pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 },
};

describe('Payroll parameters page', () => {
  beforeEach(() => {
    apiRequest.mockReset();
    apiRequest.mockResolvedValue(emptyPage);
  });

  it('lists configurable parameter versions without legal values', async () => {
    apiRequest.mockResolvedValueOnce({
      items: [
        {
          id: 'parameter-1',
          code: 'DEMO',
          name: 'Parâmetro demonstrativo',
          category: 'CONFIGURATION',
          version: 'v1',
          validFrom: '2026-01-01',
          status: 'DRAFT',
          definition: { mode: 'demonstrative' },
        },
      ],
      pagination: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
    });
    renderPage();

    expect(await screen.findByRole('listitem')).toHaveTextContent('Parâmetro demonstrativo');
    expect(screen.getByText('Definição configurável registrada.')).toBeInTheDocument();
    expect(apiRequest).toHaveBeenCalledWith(
      '/payroll-parameters?page=1&pageSize=20&sortBy=validFrom&sortDirection=desc',
    );
  });

  it('preserves a parameter form when the API rejects an overlapping validity', async () => {
    apiRequest.mockImplementation((path: string, init?: RequestInit) => {
      if (path === '/payroll-parameters' && init?.method === 'POST') {
        return Promise.reject(new Error('Há vigência incompatível para este parâmetro'));
      }
      return Promise.resolve(emptyPage);
    });
    renderPage();

    fireEvent.change(screen.getByLabelText('Código'), { target: { value: 'DEMO' } });
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Parâmetro demo' } });
    fireEvent.change(screen.getByLabelText('Categoria'), { target: { value: 'CONFIGURATION' } });
    fireEvent.change(screen.getByLabelText('Vigente a partir de'), {
      target: { value: '2026-01-01' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar parâmetro' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('vigência incompatível');
    expect(screen.getByDisplayValue('Parâmetro demo')).toBeInTheDocument();
  });

  it('activates a non-active parameter through the API', async () => {
    apiRequest
      .mockResolvedValueOnce({
        items: [
          {
            id: 'parameter-1',
            code: 'DEMO',
            name: 'Parâmetro demonstrativo',
            category: 'CONFIGURATION',
            version: 'v1',
            validFrom: '2026-01-01',
            status: 'DRAFT',
          },
        ],
        pagination: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
      })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce(emptyPage);
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Ativar parâmetro' }));

    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith('/payroll-parameters/parameter-1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'ACTIVE' }),
      }),
    );
  });
});

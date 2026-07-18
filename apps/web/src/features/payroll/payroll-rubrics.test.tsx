import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PayrollPage } from './index';

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));

vi.mock('@/lib/api', () => ({ apiRequest }));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/folha/rubricas']}>
        <PayrollPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Payroll rubrics page', () => {
  beforeEach(() => apiRequest.mockReset());

  it('filters rubrics by company and renders their validity and incidence metadata', async () => {
    apiRequest.mockResolvedValueOnce({
      items: [
        {
          id: 'rubric-1',
          companyId: 'company-1',
          code: 'DEMO',
          name: 'Rubrica demonstrativa',
          status: 'ACTIVE',
          payrollRubricCategory: { name: 'Demonstrativa', nature: 'EARNING' },
          versions: [
            {
              id: 'version-1',
              version: 'v1',
              validFrom: '2026-01-01',
              incidenceConfiguration: { configurable: true },
            },
          ],
        },
      ],
      pagination: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
    });
    renderPage();

    fireEvent.change(screen.getByLabelText('Filtrar por empresa'), {
      target: { value: 'company-1' },
    });

    expect(await screen.findByRole('listitem')).toHaveTextContent('Rubrica demonstrativa');
    expect(screen.getByText('Incidências configuráveis registradas.')).toBeInTheDocument();
    expect(apiRequest).toHaveBeenCalledWith(
      '/payroll-rubrics?companyId=company-1&page=1&pageSize=20&sortBy=code&sortDirection=asc',
    );
  });

  it('keeps the rubric form visible when creation conflicts', async () => {
    apiRequest.mockRejectedValueOnce(new Error('Rubrica já existe.'));
    renderPage();

    fireEvent.change(screen.getByLabelText('Empresa', { selector: 'input' }), {
      target: { value: 'company-1' },
    });
    fireEvent.change(screen.getByLabelText('Categoria da rubrica'), {
      target: { value: 'category-1' },
    });
    fireEvent.change(screen.getByLabelText('Código'), { target: { value: 'DEMO' } });
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Rubrica demo' } });
    fireEvent.change(screen.getByLabelText('Vigente a partir de'), {
      target: { value: '2026-01-01' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar rubrica' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Rubrica já existe.');
    expect(screen.getByDisplayValue('Rubrica demo')).toBeInTheDocument();
  });

  it('updates rubric activation status through the API', async () => {
    apiRequest
      .mockResolvedValueOnce({
        items: [
          {
            id: 'rubric-1',
            companyId: 'company-1',
            code: 'DEMO',
            name: 'Rubrica demonstrativa',
            status: 'ACTIVE',
            payrollRubricCategory: { name: 'Demonstrativa', nature: 'EARNING' },
            versions: [],
          },
        ],
        pagination: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
      })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        items: [],
        pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 },
      });
    renderPage();

    fireEvent.change(screen.getByLabelText('Filtrar por empresa'), {
      target: { value: 'company-1' },
    });
    fireEvent.click(await screen.findByRole('button', { name: 'Inativar rubrica' }));

    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith('/payroll-rubrics/rubric-1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'INACTIVE' }),
      }),
    );
  });
});

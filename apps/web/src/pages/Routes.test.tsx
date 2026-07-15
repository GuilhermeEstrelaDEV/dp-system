import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { App } from '@/app/App';
import { renderWithRouter } from '@/test/renderWithRouter';
import { RouteErrorPage } from './RouteErrorPage';

describe('application routes', () => {
  it('renders the not-found page for an unknown path', () => {
    renderWithRouter('/nao-existe');

    expect(screen.getByRole('heading', { name: 'Página não encontrada' })).toBeInTheDocument();
    expect(screen.getByText('Erro 404')).toBeInTheDocument();
  });

  it('renders the route error fallback', async () => {
    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: <App />,
          errorElement: <RouteErrorPage />,
          children: [
            {
              path: 'erro',
              element: <p>Não deve renderizar</p>,
              loader: () => {
                throw new Error('Erro de teste');
              },
            },
          ],
        },
      ],
      { initialEntries: ['/erro'] },
    );

    render(<RouterProvider router={router} />);

    expect(
      await screen.findByRole('heading', { name: 'Ocorreu um erro inesperado' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar para a visão geral' })).toBeInTheDocument();
  });
});

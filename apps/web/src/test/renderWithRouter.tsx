import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { appRoutes } from '@/router';
import { AppProviders } from '@/app/AppProviders';

export function renderWithRouter(initialEntry = '/') {
  const router = createMemoryRouter(appRoutes, { initialEntries: [initialEntry] });
  return {
    router,
    ...render(
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>,
    ),
  };
}

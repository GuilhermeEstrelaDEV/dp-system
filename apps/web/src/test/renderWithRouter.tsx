import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { appRoutes } from '@/router';
import { AppProviders } from '@/app/AppProviders';

const testSession = {
  token: 'test-token',
  user: {
    actorId: 'user-1',
    activeCompanyId: 'company-1',
    permissions: [
      'payroll.review.view',
      'payroll.review.create',
      'payroll.review.finding.create',
      'payroll.review.finding.resolve',
      'payroll.review.finding.reopen',
      'payroll.review.submit',
      'payroll.review.approve',
      'payroll.review.reject',
      'payroll.review.close',
      'payroll.review.reopen',
    ],
  },
  companies: [{ id: 'company-1', legalName: 'Empresa Teste SA', tradeName: 'Empresa Teste' }],
};

export function renderWithRouter(initialEntry = '/', authenticated = true, permissions?: string[]) {
  sessionStorage.clear();
  if (authenticated)
    sessionStorage.setItem(
      'dp-system.session.v1',
      JSON.stringify(
        permissions ? { ...testSession, user: { ...testSession.user, permissions } } : testSession,
      ),
    );
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

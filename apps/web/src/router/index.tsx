import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { App } from '@/app/App';
import { DashboardPage } from '@/pages/DashboardPage';
import { ModulePlaceholderPage } from '@/pages/ModulePlaceholderPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { RouteErrorPage } from '@/pages/RouteErrorPage';
import { BranchesPage } from '@/features/branches';
import { CompaniesPage } from '@/features/companies';
import { CostCentersPage } from '@/features/cost-centers';
import { DepartmentsPage } from '@/features/departments';
import { PositionsPage } from '@/features/positions';

export const appRoutes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'administracao', element: <ModulePlaceholderPage /> },
      { path: 'estrutura', element: <CompaniesPage /> },
      { path: 'estrutura/empresas', element: <CompaniesPage /> },
      { path: 'estrutura/filiais', element: <BranchesPage /> },
      { path: 'estrutura/departamentos', element: <DepartmentsPage /> },
      { path: 'estrutura/cargos', element: <PositionsPage /> },
      { path: 'estrutura/centros-de-custo', element: <CostCentersPage /> },
      { path: 'colaboradores', element: <ModulePlaceholderPage /> },
      { path: 'admissoes', element: <ModulePlaceholderPage /> },
      { path: 'movimentacoes', element: <ModulePlaceholderPage /> },
      { path: 'jornada', element: <ModulePlaceholderPage /> },
      { path: 'beneficios', element: <ModulePlaceholderPage /> },
      { path: 'folha', element: <ModulePlaceholderPage /> },
      { path: 'desligamentos', element: <ModulePlaceholderPage /> },
      { path: 'documentos', element: <ModulePlaceholderPage /> },
      { path: 'relatorios', element: <ModulePlaceholderPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export const router = createBrowserRouter(appRoutes);

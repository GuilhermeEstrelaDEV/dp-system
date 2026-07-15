import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { App } from '@/app/App';
import { DashboardPage } from '@/pages/DashboardPage';
import { ModulePlaceholderPage } from '@/pages/ModulePlaceholderPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { RouteErrorPage } from '@/pages/RouteErrorPage';

export const appRoutes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'administracao', element: <ModulePlaceholderPage /> },
      { path: 'estrutura', element: <ModulePlaceholderPage /> },
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

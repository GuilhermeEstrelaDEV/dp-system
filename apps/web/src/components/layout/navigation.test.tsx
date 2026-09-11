import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import type { RouteObject } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { appRoutes } from '@/router';
import { renderWithRouter } from '@/test/renderWithRouter';
import { navigationGroups, navigationItems } from './navigation';

const nonMenuStaticRoutes = new Set([
  '/login',
  '/selecionar-empresa',
  '/folha',
  '/estrutura',
  '/admissoes/nova',
]);

function joinRoutePath(parentPath: string, routePath: string) {
  if (routePath.startsWith('/')) return routePath;
  if (!parentPath || parentPath === '/') return `/${routePath}`;
  return `${parentPath}/${routePath}`;
}

function collectRoutePaths(routes: readonly RouteObject[], parentPath = ''): string[] {
  return routes.flatMap((route) => {
    const currentPath = route.index
      ? parentPath || '/'
      : route.path
        ? joinRoutePath(parentPath, route.path)
        : parentPath;
    const ownPath = route.path && route.path !== '*' ? [currentPath] : [];
    return [...ownPath, ...collectRoutePaths(route.children ?? [], currentPath)];
  });
}

describe('capability-aware navigation', () => {
  it('shows People and Organization entries backed by explicit capabilities', () => {
    renderWithRouter('/', true, [
      'employee.read',
      'company.read',
      'contract.read',
      'organization.read',
    ]);

    expect(screen.getByRole('region', { name: 'Pessoas' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Organização' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Colaboradores' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Empresas' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Contratos' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Filiais' })).toBeInTheDocument();
  });

  it('hides Colaboradores without employee.read', () => {
    renderWithRouter('/', true, ['company.read']);
    expect(screen.queryByRole('link', { name: 'Colaboradores' })).not.toBeInTheDocument();
  });

  it('hides Empresas without company.read while preserving authorized Organization entries', () => {
    renderWithRouter('/', true, ['organization.read']);
    expect(screen.getByRole('region', { name: 'Organização' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Empresas' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Filiais' })).toBeInTheDocument();
  });

  it('does not render headings for groups without visible items', () => {
    renderWithRouter('/', true, []);
    expect(screen.queryByRole('region', { name: 'Pessoas' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Organização' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Jornada' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Folha' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Administração' })).not.toBeInTheDocument();
    expect(screen.queryByText('Cadastros')).not.toBeInTheDocument();
  });

  it.each([
    ['Colaboradores', '/colaboradores', 'employee.read'],
    ['Empresas', '/estrutura/empresas', 'company.read'],
    ['Contratos', '/contratos', 'contract.read'],
  ])('opens the canonical %s route from the sidebar', async (label, path, capability) => {
    const { router } = renderWithRouter('/', true, [capability]);
    fireEvent.click(screen.getByRole('link', { name: label }));
    await waitFor(() => expect(router.state.location.pathname).toBe(path));
  });

  it.each([
    {
      path: '/colaboradores',
      capabilities: ['employee.read'],
      activeLabel: 'Colaboradores',
    },
    {
      path: '/colaboradores/employee-1',
      capabilities: ['employee.read'],
      activeLabel: 'Colaboradores',
    },
    {
      path: '/colaboradores/employee-1/contratos',
      capabilities: ['employee.read', 'contract.read'],
      activeLabel: 'Contratos',
      inactiveLabel: 'Colaboradores',
    },
    {
      path: '/folha/execucoes/run-1',
      capabilities: ['payroll.run.read', 'payroll.review.view'],
      activeLabel: 'Revisão',
      inactiveLabel: 'Processamentos',
    },
    {
      path: '/folha/competencias/period-1/historico',
      capabilities: ['payroll.period.close.view', 'payroll.period.close.history'],
      activeLabel: 'Histórico',
      inactiveLabel: 'Períodos',
    },
  ])(
    'keeps $activeLabel active for $path',
    ({ path, capabilities, activeLabel, inactiveLabel }) => {
      renderWithRouter(path, true, capabilities);
      expect(screen.getByRole('link', { name: activeLabel })).toHaveAttribute(
        'aria-current',
        'page',
      );
      if (inactiveLabel) {
        expect(screen.getByRole('link', { name: inactiveLabel })).not.toHaveAttribute(
          'aria-current',
        );
      }
    },
  );

  it('keeps the bottom navigation available in the mobile drawer', async () => {
    const { router } = renderWithRouter('/', true, ['admission.read']);
    expect(screen.getByLabelText('Barra lateral')).toHaveClass('hidden', 'lg:block');
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menu de navegação' }));
    const dialog = screen.getByRole('dialog', { name: 'Menu de navegação' });
    const panel = dialog.querySelector('aside');
    expect(panel).toHaveClass('mobile-navigation__panel');
    fireEvent.click(within(dialog).getByRole('link', { name: 'Modelos de checklist' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/configuracoes/checklists'));
    expect(screen.queryByRole('dialog', { name: 'Menu de navegação' })).not.toBeInTheDocument();
  });
});

describe('navigation route contract', () => {
  it('has zero orphan user-facing routes and zero links to missing routes', () => {
    const routerPaths = new Set(collectRoutePaths(appRoutes));
    const actionableItems = navigationItems.filter((item) => item.path && !item.comingSoon);
    const menuPaths = actionableItems.flatMap((item) => (item.path ? [item.path] : []));
    const menuRequiredRoutes = [...routerPaths].filter(
      (path) => !path.includes(':') && !nonMenuStaticRoutes.has(path),
    );
    const orphanRoutes = menuRequiredRoutes.filter((path) => !menuPaths.includes(path));
    const unknownMenuRoutes = menuPaths.filter((path) => !menuRequiredRoutes.includes(path));

    expect(orphanRoutes).toEqual([]);
    expect(unknownMenuRoutes).toEqual([]);
    expect(menuRequiredRoutes).toHaveLength(22);
    expect(menuPaths).toHaveLength(22);
    expect(menuPaths.every((path) => routerPaths.has(path))).toBe(true);
    expect(new Set(menuPaths).size).toBe(menuPaths.length);
    expect(actionableItems.every((item) => item.path === '/' || item.capability)).toBe(true);
    expect(navigationItems.filter((item) => item.comingSoon).every((item) => !item.path)).toBe(
      true,
    );
    expect(new Set(navigationGroups).size).toBe(navigationGroups.length);
  });
});

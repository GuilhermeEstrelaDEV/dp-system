export type NavigationIcon =
  | 'dashboard'
  | 'administration'
  | 'structure'
  | 'people'
  | 'admissions'
  | 'movements'
  | 'time'
  | 'benefits'
  | 'payroll'
  | 'termination'
  | 'documents'
  | 'reports';

export type NavigationGroup = 'Visão geral' | 'Cadastros' | 'Pessoas' | 'Administração';

export interface NavigationItem {
  readonly label: string;
  readonly path?: string;
  readonly description: string;
  readonly icon: NavigationIcon;
  readonly group: NavigationGroup;
  readonly comingSoon?: boolean;
  readonly availabilityLabel?: string;
}

export const navigationItems: readonly NavigationItem[] = [
  {
    label: 'Visão geral',
    path: '/',
    description: 'Resumo visual do ambiente demonstrativo.',
    icon: 'dashboard',
    group: 'Visão geral',
  },
  {
    label: 'Estrutura',
    path: '/estrutura',
    description: 'Empresas, filiais, departamentos, cargos e centros de custo.',
    icon: 'structure',
    group: 'Cadastros',
    comingSoon: true,
    availabilityLabel: 'Fora do MVP',
  },
  {
    label: 'Colaboradores',
    path: '/colaboradores',
    description: 'Cadastros de colaboradores e contatos.',
    icon: 'people',
    group: 'Pessoas',
    comingSoon: true,
    availabilityLabel: 'Fora do MVP',
  },
  {
    label: 'Contratos',
    path: '/contratos',
    description: 'Vínculos de trabalho e histórico.',
    icon: 'people',
    group: 'Pessoas',
    comingSoon: true,
    availabilityLabel: 'Fora do MVP',
  },
  {
    label: 'Admissões',
    path: '/admissoes',
    description: 'Processos admissionais, checklists e documentos.',
    icon: 'admissions',
    group: 'Pessoas',
    comingSoon: true,
    availabilityLabel: 'Fora do MVP',
  },
  {
    label: 'Movimentações',
    path: '/movimentacoes',
    description: 'Férias e afastamentos.',
    icon: 'movements',
    group: 'Pessoas',
    comingSoon: true,
    availabilityLabel: 'Fora do MVP',
  },
  {
    label: 'Jornada',
    path: '/jornada',
    description: 'Jornadas e registros de ponto.',
    icon: 'time',
    group: 'Pessoas',
    comingSoon: true,
    availabilityLabel: 'Fora do MVP',
  },
  {
    label: 'Benefícios',
    path: '/beneficios',
    description: 'Benefícios vinculados aos colaboradores.',
    icon: 'benefits',
    group: 'Pessoas',
    comingSoon: true,
    availabilityLabel: 'Fora do MVP',
  },
  {
    label: 'Folha',
    path: '/folha/conferencia',
    description: 'Conferência e fechamento no recorte aprovado do MVP.',
    icon: 'payroll',
    group: 'Administração',
  },
  {
    label: 'Desligamentos',
    description: 'Fluxo ainda não implementado.',
    icon: 'termination',
    group: 'Administração',
    comingSoon: true,
  },
  {
    label: 'Documentos',
    description: 'Central ainda não implementada.',
    icon: 'documents',
    group: 'Administração',
    comingSoon: true,
  },
  {
    label: 'Relatórios',
    description: 'Relatórios executivos pertencem a uma etapa futura.',
    icon: 'reports',
    group: 'Administração',
    comingSoon: true,
  },
];

export const navigationGroups: readonly NavigationGroup[] = [
  'Visão geral',
  'Cadastros',
  'Pessoas',
  'Administração',
];

export function getNavigationItem(pathname: string) {
  return navigationItems.find(
    (item) =>
      item.path &&
      (pathname === item.path || (item.path !== '/' && pathname.startsWith(`${item.path}/`))),
  );
}

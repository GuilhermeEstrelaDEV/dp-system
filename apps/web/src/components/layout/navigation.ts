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
  readonly capability?: string;
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
    capability: 'company.read',
  },
  {
    label: 'Colaboradores',
    path: '/colaboradores',
    description: 'Cadastros de colaboradores e contatos.',
    icon: 'people',
    group: 'Pessoas',
    capability: 'employee.read',
  },
  {
    label: 'Contratos',
    path: '/contratos',
    description: 'Vínculos de trabalho e histórico.',
    icon: 'people',
    group: 'Pessoas',
    capability: 'contract.read',
  },
  {
    label: 'Admissões',
    path: '/admissoes',
    description: 'Processos admissionais, checklists e documentos.',
    icon: 'admissions',
    group: 'Pessoas',
    capability: 'admission.read',
  },
  {
    label: 'Movimentações',
    path: '/movimentacoes',
    description: 'Afastamentos e retornos da empresa ativa.',
    icon: 'movements',
    group: 'Pessoas',
    capability: 'leave.read',
  },
  {
    label: 'Jornada',
    path: '/jornada',
    description: 'Jornadas e registros de ponto.',
    icon: 'time',
    group: 'Pessoas',
    capability: 'time.read',
  },
  {
    label: 'Benefícios',
    path: '/beneficios',
    description: 'Benefícios vinculados aos colaboradores.',
    icon: 'benefits',
    group: 'Pessoas',
    capability: 'benefit.read',
  },
  {
    label: 'Férias',
    path: '/ferias',
    description: 'Períodos e solicitações da empresa ativa.',
    icon: 'movements',
    group: 'Pessoas',
    capability: 'vacation.read',
  },
  {
    label: 'Folha',
    path: '/folha/conferencia',
    description: 'Conferência e fechamento no recorte aprovado do MVP.',
    icon: 'payroll',
    group: 'Administração',
  },
  {
    label: 'Rubricas',
    path: '/folha/rubricas',
    description: 'Cadastro operacional de rubricas da empresa ativa.',
    icon: 'payroll',
    group: 'Administração',
    capability: 'payroll.rubric.read',
  },
  {
    label: 'Parâmetros',
    path: '/folha/parametros',
    description: 'Parâmetros versionados da empresa ativa.',
    icon: 'payroll',
    group: 'Administração',
    capability: 'payroll.parameter.read',
  },
  {
    label: 'Remuneração variável',
    path: '/folha/remuneracao-variavel',
    description: 'Eventos, adiantamentos, pagamentos externos e conciliações.',
    icon: 'payroll',
    group: 'Administração',
    capability: 'variable_compensation.read',
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

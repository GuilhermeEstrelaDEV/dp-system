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

export type NavigationGroup =
  'Visão geral' | 'Pessoas' | 'Organização' | 'Jornada' | 'Folha' | 'Administração' | 'Futuro';

export interface NavigationItem {
  readonly label: string;
  readonly path?: string;
  readonly aliases?: readonly string[];
  readonly activePatterns?: readonly RegExp[];
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
    label: 'Colaboradores',
    path: '/colaboradores',
    activePatterns: [/^\/colaboradores(?:\/[^/]+)?$/],
    description: 'Cadastros de colaboradores e contatos.',
    icon: 'people',
    group: 'Pessoas',
    capability: 'employee.read',
  },
  {
    label: 'Contratos',
    path: '/contratos',
    activePatterns: [
      /^\/contratos(?:\/[^/]+)?$/,
      /^\/colaboradores\/[^/]+\/contratos(?:\/.*)?$/,
      /^\/employees\/[^/]+\/contracts(?:\/.*)?$/,
    ],
    description: 'Vínculos de trabalho e histórico.',
    icon: 'documents',
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
    label: 'Afastamentos',
    path: '/movimentacoes',
    description: 'Afastamentos e retornos da empresa ativa.',
    icon: 'movements',
    group: 'Pessoas',
    capability: 'leave.read',
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
    label: 'Benefícios',
    path: '/beneficios',
    description: 'Benefícios vinculados aos colaboradores.',
    icon: 'benefits',
    group: 'Pessoas',
    capability: 'benefit.read',
  },
  {
    label: 'Empresas',
    path: '/estrutura/empresas',
    aliases: ['/estrutura'],
    description: 'Empresas disponíveis no escopo autorizado.',
    icon: 'administration',
    group: 'Organização',
    capability: 'company.read',
  },
  {
    label: 'Filiais',
    path: '/estrutura/filiais',
    description: 'Filiais da empresa ativa.',
    icon: 'structure',
    group: 'Organização',
    capability: 'organization.read',
  },
  {
    label: 'Departamentos',
    path: '/estrutura/departamentos',
    description: 'Departamentos da estrutura organizacional.',
    icon: 'structure',
    group: 'Organização',
    capability: 'organization.read',
  },
  {
    label: 'Cargos',
    path: '/estrutura/cargos',
    description: 'Cargos da estrutura organizacional.',
    icon: 'people',
    group: 'Organização',
    capability: 'organization.read',
  },
  {
    label: 'Centros de custo',
    path: '/estrutura/centros-de-custo',
    description: 'Centros de custo da empresa ativa.',
    icon: 'reports',
    group: 'Organização',
    capability: 'organization.read',
  },
  {
    label: 'Jornada / Ponto',
    path: '/jornada',
    description: 'Jornadas, ocorrências e saldos de ponto.',
    icon: 'time',
    group: 'Jornada',
    capability: 'time.read',
  },
  {
    label: 'Períodos',
    path: '/folha/competencias',
    aliases: ['/folha'],
    activePatterns: [/^\/folha(?:\/competencias)?$/],
    description: 'Competências e períodos da folha.',
    icon: 'payroll',
    group: 'Folha',
    capability: 'payroll.period.close.view',
  },
  {
    label: 'Lançamentos',
    path: '/folha/lancamentos',
    description: 'Lançamentos demonstrativos da folha.',
    icon: 'payroll',
    group: 'Folha',
    capability: 'payroll.input.read',
  },
  {
    label: 'Processamentos',
    path: '/folha/execucoes',
    activePatterns: [/^\/folha\/execucoes$/],
    description: 'Execuções técnicas da folha.',
    icon: 'payroll',
    group: 'Folha',
    capability: 'payroll.run.read',
  },
  {
    label: 'Revisão',
    path: '/folha/conferencia',
    activePatterns: [/^\/folha\/conferencia(?:\/[^/]+)?$/, /^\/folha\/execucoes\/[^/]+$/],
    description: 'Conferência e aprovação da folha.',
    icon: 'payroll',
    group: 'Folha',
    capability: 'payroll.review.view',
  },
  {
    label: 'Parâmetros',
    path: '/folha/parametros',
    description: 'Parâmetros versionados da empresa ativa.',
    icon: 'payroll',
    group: 'Folha',
    capability: 'payroll.parameter.read',
  },
  {
    label: 'Rubricas',
    path: '/folha/rubricas',
    description: 'Cadastro operacional de rubricas da empresa ativa.',
    icon: 'payroll',
    group: 'Folha',
    capability: 'payroll.rubric.read',
  },
  {
    label: 'Histórico',
    path: '/folha/fechamentos',
    activePatterns: [
      /^\/folha\/fechamentos(?:\/.*)?$/,
      /^\/folha\/competencias\/[^/]+\/historico(?:\/.*)?$/,
    ],
    description: 'Fechamentos e histórico público dos períodos.',
    icon: 'reports',
    group: 'Folha',
    capability: 'payroll.period.close.history',
  },
  {
    label: 'Remuneração variável',
    path: '/folha/remuneracao-variavel',
    description: 'Eventos, adiantamentos, pagamentos externos e conciliações.',
    icon: 'payroll',
    group: 'Folha',
    capability: 'variable_compensation.read',
  },
  {
    label: 'Modelos de checklist',
    path: '/configuracoes/checklists',
    description: 'Modelos reutilizáveis para processos admissionais.',
    icon: 'documents',
    group: 'Administração',
    capability: 'admission.read',
  },
  {
    label: 'Desligamentos',
    description: 'Fluxo ainda não implementado.',
    icon: 'termination',
    group: 'Futuro',
    comingSoon: true,
  },
  {
    label: 'Documentos',
    description: 'Central ainda não implementada.',
    icon: 'documents',
    group: 'Futuro',
    comingSoon: true,
  },
  {
    label: 'Relatórios',
    description: 'Relatórios executivos pertencem a uma etapa futura.',
    icon: 'reports',
    group: 'Futuro',
    comingSoon: true,
  },
];

export const navigationGroups: readonly NavigationGroup[] = [
  'Visão geral',
  'Pessoas',
  'Organização',
  'Jornada',
  'Folha',
  'Administração',
  'Futuro',
];

export function isNavigationItemActive(item: NavigationItem, pathname: string) {
  if (!item.path) return false;
  if (item.activePatterns) return item.activePatterns.some((pattern) => pattern.test(pathname));
  if (item.aliases?.includes(pathname)) return true;
  return pathname === item.path || (item.path !== '/' && pathname.startsWith(`${item.path}/`));
}

export function getNavigationItem(pathname: string) {
  return navigationItems.find((item) => isNavigationItemActive(item, pathname));
}

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

export interface NavigationItem {
  readonly label: string;
  readonly path: string;
  readonly description: string;
  readonly icon: NavigationIcon;
}

export const navigationItems: readonly NavigationItem[] = [
  {
    label: 'Visão geral',
    path: '/',
    description: 'Resumo visual do ambiente demonstrativo.',
    icon: 'dashboard',
  },
  {
    label: 'Administração',
    path: '/administracao',
    description: 'Configurações administrativas estarão disponíveis neste módulo.',
    icon: 'administration',
  },
  {
    label: 'Estrutura',
    path: '/estrutura',
    description: 'A estrutura organizacional será organizada neste módulo.',
    icon: 'structure',
  },
  {
    label: 'Colaboradores',
    path: '/colaboradores',
    description: 'Cadastros demonstrativos de colaboradores e contatos.',
    icon: 'people',
  },
  {
    label: 'Contratos',
    path: '/contratos',
    description: 'Vínculos de trabalho demonstrativos e seu histórico.',
    icon: 'people',
  },
  {
    label: 'Admissões',
    path: '/admissoes',
    description: 'Processos admissionais demonstrativos, checklists e prazos internos.',
    icon: 'admissions',
  },
  {
    label: 'Movimentações',
    path: '/movimentacoes',
    description: 'Férias, afastamentos e outras movimentações serão tratadas aqui.',
    icon: 'movements',
  },
  {
    label: 'Jornada',
    path: '/jornada',
    description: 'Os recursos de jornada estarão disponíveis neste módulo.',
    icon: 'time',
  },
  {
    label: 'Benefícios',
    path: '/beneficios',
    description: 'Os recursos de benefícios estarão disponíveis neste módulo.',
    icon: 'benefits',
  },
  {
    label: 'Folha',
    path: '/folha',
    description: 'Os recursos de folha estarão disponíveis neste módulo.',
    icon: 'payroll',
  },
  {
    label: 'Desligamentos',
    path: '/desligamentos',
    description: 'Os fluxos de desligamento serão construídos neste módulo.',
    icon: 'termination',
  },
  {
    label: 'Documentos',
    path: '/documentos',
    description: 'Os documentos serão organizados neste módulo.',
    icon: 'documents',
  },
  {
    label: 'Relatórios',
    path: '/relatorios',
    description: 'Relatórios e integrações futuras serão apresentados neste módulo.',
    icon: 'reports',
  },
];

export function getNavigationItem(pathname: string) {
  return navigationItems.find(
    (item) => pathname === item.path || (item.path !== '/' && pathname.startsWith(`${item.path}/`)),
  );
}

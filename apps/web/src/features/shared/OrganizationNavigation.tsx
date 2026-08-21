import { Link, useLocation } from 'react-router-dom';
import { useOptionalAuth } from '@/features/auth/AuthContext';

const links = [
  ['/estrutura/empresas', 'Empresas', 'company.read'],
  ['/estrutura/filiais', 'Filiais', 'organization.read'],
  ['/estrutura/departamentos', 'Departamentos', 'organization.read'],
  ['/estrutura/cargos', 'Cargos', 'organization.read'],
  ['/estrutura/centros-de-custo', 'Centros de custo', 'organization.read'],
] as const;

export function OrganizationNavigation() {
  const auth = useOptionalAuth();
  const location = useLocation();
  return (
    <nav className="mb-5 flex flex-wrap gap-2" aria-label="Cadastros da estrutura">
      {links
        .filter(([, , capability]) => auth?.hasCapability(capability) ?? true)
        .map(([path, label]) => (
          <Link
            className="rounded border px-3 py-2 text-sm"
            aria-current={location.pathname === path ? 'page' : undefined}
            key={path}
            to={path}
          >
            {label}
          </Link>
        ))}
    </nav>
  );
}

import { NavLink } from 'react-router-dom';
import { NavigationIcon } from './NavigationIcon';
import { navigationItems } from './navigation';

interface NavigationLinksProps {
  readonly collapsed?: boolean;
  readonly onNavigate?: () => void;
}

export function NavigationLinks({ collapsed = false, onNavigate }: NavigationLinksProps) {
  return (
    <nav aria-label="Navegação principal" className="space-y-1">
      {navigationItems.map((item) => (
        <NavLink
          aria-label={collapsed ? item.label : undefined}
          className={({ isActive }) =>
            `flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
              isActive
                ? 'bg-sky-500 text-slate-950 shadow-sm'
                : 'text-slate-200 hover:bg-slate-800 hover:text-white'
            } ${collapsed ? 'justify-center' : ''}`
          }
          end={item.path === '/'}
          key={item.path}
          onClick={onNavigate}
          title={collapsed ? item.label : undefined}
          to={item.path}
        >
          <NavigationIcon name={item.icon} />
          <span className={collapsed ? 'sr-only' : undefined}>{item.label}</span>
          <span className="sr-only">
            {item.path === '/' ? 'Página atual: ' : 'Ir para: '}
            {item.label}
          </span>
        </NavLink>
      ))}
    </nav>
  );
}

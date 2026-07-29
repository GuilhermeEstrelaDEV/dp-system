import { NavLink } from 'react-router-dom';
import { NavigationIcon } from './NavigationIcon';
import { navigationGroups, navigationItems } from './navigation';

interface NavigationLinksProps {
  readonly collapsed?: boolean;
  readonly onNavigate?: () => void;
}

export function NavigationLinks({ collapsed = false, onNavigate }: NavigationLinksProps) {
  return (
    <nav aria-label="Navegação principal" className="navigation">
      {navigationGroups.map((group) => {
        const items = navigationItems.filter((item) => item.group === group);
        return (
          <section aria-label={group} className="navigation__group" key={group}>
            {!collapsed && <p className="navigation__heading">{group}</p>}
            {items.map((item) =>
              item.comingSoon ? (
                <div
                  aria-disabled="true"
                  className="navigation__item navigation__item--disabled"
                  key={item.label}
                  title={item.description}
                >
                  <NavigationIcon name={item.icon} />
                  <span className={collapsed ? 'sr-only' : undefined}>{item.label}</span>
                  {!collapsed && <span className="navigation__soon">Em breve</span>}
                </div>
              ) : (
                <NavLink
                  aria-label={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `navigation__item ${isActive ? 'navigation__item--active' : ''}`
                  }
                  end={item.path === '/'}
                  key={item.path}
                  onClick={onNavigate}
                  title={collapsed ? item.label : undefined}
                  to={item.path ?? '/'}
                >
                  <NavigationIcon name={item.icon} />
                  <span className={collapsed ? 'sr-only' : undefined}>{item.label}</span>
                </NavLink>
              ),
            )}
          </section>
        );
      })}
    </nav>
  );
}

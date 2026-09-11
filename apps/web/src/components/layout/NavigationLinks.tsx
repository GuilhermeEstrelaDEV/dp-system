import { Link, useLocation } from 'react-router-dom';
import { NavigationIcon } from './NavigationIcon';
import { isNavigationItemActive, navigationGroups, navigationItems } from './navigation';
import { useAuth } from '@/features/auth/AuthContext';

interface NavigationLinksProps {
  readonly collapsed?: boolean;
  readonly onNavigate?: () => void;
}

export function NavigationLinks({ collapsed = false, onNavigate }: NavigationLinksProps) {
  const auth = useAuth();
  const { pathname } = useLocation();
  return (
    <nav aria-label="Navegação principal" className="navigation">
      {navigationGroups.map((group) => {
        const items = navigationItems.filter(
          (item) =>
            item.group === group && (!item.capability || auth.hasCapability(item.capability)),
        );
        if (items.length === 0) return null;
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
                  {!collapsed && (
                    <span className="navigation__soon">{item.availabilityLabel ?? 'Em breve'}</span>
                  )}
                </div>
              ) : (
                <Link
                  aria-label={collapsed ? item.label : undefined}
                  aria-current={isNavigationItemActive(item, pathname) ? 'page' : undefined}
                  className={`navigation__item ${
                    isNavigationItemActive(item, pathname) ? 'navigation__item--active' : ''
                  }`}
                  key={item.path}
                  onClick={onNavigate}
                  title={collapsed ? item.label : undefined}
                  to={item.path ?? '/'}
                >
                  <NavigationIcon name={item.icon} />
                  <span className={collapsed ? 'sr-only' : undefined}>{item.label}</span>
                </Link>
              ),
            )}
          </section>
        );
      })}
    </nav>
  );
}

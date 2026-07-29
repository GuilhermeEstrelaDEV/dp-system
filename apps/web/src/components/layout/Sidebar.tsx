import { NavigationLinks } from './NavigationLinks';
import { Brand } from '@/components/brand/Brand';

interface SidebarProps {
  readonly collapsed: boolean;
}

export function Sidebar({ collapsed }: SidebarProps) {
  return (
    <aside
      aria-label="Barra lateral"
      className="app-sidebar hidden lg:block"
      data-collapsed={collapsed || undefined}
    >
      <div className="app-sidebar__brand">
        <Brand compact={collapsed} inverse />
      </div>
      <NavigationLinks collapsed={collapsed} />
    </aside>
  );
}

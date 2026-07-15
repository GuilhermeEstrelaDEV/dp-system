import { NavigationLinks } from './NavigationLinks';

interface SidebarProps {
  readonly collapsed: boolean;
}

export function Sidebar({ collapsed }: SidebarProps) {
  return (
    <aside
      aria-label="Barra lateral"
      className={`hidden min-h-screen shrink-0 bg-slate-950 px-3 py-5 text-white transition-[width] duration-200 lg:block ${
        collapsed ? 'w-20' : 'w-72'
      }`}
    >
      <div className={`mb-8 flex items-center gap-3 px-3 ${collapsed ? 'justify-center' : ''}`}>
        <span
          aria-hidden="true"
          className="grid h-9 w-9 place-items-center rounded-lg bg-sky-400 font-bold text-slate-950"
        >
          DP
        </span>
        {!collapsed && <span className="font-semibold tracking-tight">DP System</span>}
      </div>
      <NavigationLinks collapsed={collapsed} />
    </aside>
  );
}

import { Outlet } from 'react-router-dom';
import { AppFooter } from './AppFooter';

export function StandaloneShell() {
  return (
    <div className="standalone-shell">
      <div className="standalone-shell__content">
        <Outlet />
      </div>
      <AppFooter />
    </div>
  );
}

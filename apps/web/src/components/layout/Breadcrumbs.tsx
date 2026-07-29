import { Link, useLocation } from 'react-router-dom';
import { getNavigationItem } from './navigation';

export function Breadcrumbs() {
  const { pathname } = useLocation();
  const currentItem = getNavigationItem(pathname);
  return (
    <nav aria-label="Navegação estrutural" className="breadcrumbs">
      <ol>
        <li>
          <Link to="/">Início</Link>
        </li>
        {pathname !== '/' && <li aria-hidden="true">/</li>}
        {pathname !== '/' && (
          <li aria-current="page">{currentItem?.label ?? 'Página não encontrada'}</li>
        )}
      </ol>
    </nav>
  );
}

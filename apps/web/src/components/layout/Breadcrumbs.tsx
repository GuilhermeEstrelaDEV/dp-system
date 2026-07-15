import { Link, useLocation } from 'react-router-dom';
import { getNavigationItem } from './navigation';

export function Breadcrumbs() {
  const { pathname } = useLocation();
  const currentItem = getNavigationItem(pathname);

  return (
    <nav aria-label="Navegação estrutural" className="mb-5 text-sm text-slate-600">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <li>
          <Link
            className="rounded hover:text-sky-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
            to="/"
          >
            Início
          </Link>
        </li>
        {pathname !== '/' && <li aria-hidden="true">/</li>}
        {pathname !== '/' && (
          <li aria-current="page" className="font-medium text-slate-900">
            {currentItem?.label ?? 'Página não encontrada'}
          </li>
        )}
      </ol>
    </nav>
  );
}

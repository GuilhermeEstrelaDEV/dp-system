import { Link, useLocation } from 'react-router-dom';
import { getNavigationItem } from './navigation';

function childLabel(pathname: string): string {
  if (pathname.endsWith('/nova')) return 'Novo cadastro';
  if (pathname.endsWith('/editar')) return 'Editar';
  if (pathname.endsWith('/checklist')) return 'Checklist';
  if (pathname.endsWith('/documentos')) return 'Documentos';
  if (pathname.includes('/historico')) return 'Historico';
  if (pathname.includes('/eventos')) return 'Eventos';
  if (pathname.includes('/manifesto')) return 'Manifesto';
  return 'Detalhes';
}

export function Breadcrumbs() {
  const location = useLocation();
  const { pathname } = location;
  const currentItem = getNavigationItem(pathname);
  const isChild = Boolean(
    currentItem?.path && pathname !== currentItem.path && !currentItem.aliases?.includes(pathname),
  );
  const state = location.state as { from?: unknown } | null;
  const returnPath =
    currentItem?.path && typeof state?.from === 'string' && state.from.startsWith(currentItem.path)
      ? state.from
      : currentItem?.path;

  return (
    <nav aria-label="Navegacao estrutural" className="breadcrumbs">
      <ol>
        <li>
          <Link to="/">Inicio</Link>
        </li>
        {pathname !== '/' && (
          <>
            <li aria-hidden="true">/</li>
            {currentItem ? (
              <>
                <li>{currentItem.group}</li>
                <li aria-hidden="true">/</li>
                {isChild ? (
                  <>
                    <li>
                      <Link to={returnPath!}>{currentItem.label}</Link>
                    </li>
                    <li aria-hidden="true">/</li>
                    <li aria-current="page">{childLabel(pathname)}</li>
                  </>
                ) : (
                  <li aria-current="page">{currentItem.label}</li>
                )}
              </>
            ) : (
              <li aria-current="page">Pagina nao encontrada</li>
            )}
          </>
        )}
      </ol>
    </nav>
  );
}

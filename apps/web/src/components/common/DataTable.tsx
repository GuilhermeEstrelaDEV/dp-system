import type { PropsWithChildren } from 'react';
import { Badge } from './Primitives';

export function DataTable({ children, label }: PropsWithChildren<{ readonly label?: string }>) {
  return (
    <div className="ui-table-scroll" data-testid="responsive-table-wrapper">
      <table className="ui-data-table" aria-label={label}>
        {children}
      </table>
    </div>
  );
}

export function DataTableActions({ children }: PropsWithChildren) {
  return <div className="ui-table-actions">{children}</div>;
}

export function DataTableStatus({ active }: { readonly active: boolean }) {
  return <Badge tone={active ? 'success' : 'neutral'}>{active ? 'Ativo' : 'Inativo'}</Badge>;
}

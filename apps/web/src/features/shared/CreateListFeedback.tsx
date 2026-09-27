import type { ReactNode } from 'react';
import { Alert } from '@/components/common/Primitives';

interface CreateListFeedbackProps {
  readonly visible?: boolean;
  readonly action?: ReactNode;
  readonly resourceLabel?: string;
}

export function CreateListFeedback({
  visible,
  action,
  resourceLabel = 'Registro',
}: CreateListFeedbackProps) {
  return (
    <Alert tone="success">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span>
          {resourceLabel} criado com sucesso.
          {visible === false
            ? ' Ele não aparece na visualização atual devido aos filtros, à ordenação ou à paginação.'
            : ''}
        </span>
        {action}
      </div>
    </Alert>
  );
}

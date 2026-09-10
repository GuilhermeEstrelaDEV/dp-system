import {
  forwardRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type PropsWithChildren,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  useEffect,
  useId,
  useRef,
} from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  readonly variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className = '', variant = 'primary', ...props },
  ref,
) {
  return <button className={`ui-button ui-button--${variant} ${className}`} ref={ref} {...props} />;
});

export const IconButton = forwardRef<HTMLButtonElement, ButtonProps>(function IconButton(
  { className = '', ...props },
  ref,
) {
  return (
    <button
      className={`ui-button ui-button--ghost ui-icon-button ${className}`}
      ref={ref}
      {...props}
    />
  );
});

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`ui-input ${className}`} {...props} />;
}

export function Select({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`ui-input ui-select ${className}`} {...props} />;
}

export function Textarea({
  className = '',
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`ui-input ui-textarea ${className}`} {...props} />;
}

export function Card({
  children,
  className = '',
}: PropsWithChildren<{ readonly className?: string }>) {
  return <section className={`ui-card ${className}`}>{children}</section>;
}

export function Badge({
  children,
  tone = 'info',
}: PropsWithChildren<{ readonly tone?: 'info' | 'success' | 'warning' | 'neutral' }>) {
  return <span className={`ui-badge ui-badge--${tone}`}>{children}</span>;
}

export function Alert({
  children,
  tone = 'info',
}: PropsWithChildren<{ readonly tone?: 'info' | 'success' | 'warning' | 'danger' }>) {
  return (
    <div className={`ui-alert ui-alert--${tone}`} role={tone === 'danger' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}

export function Spinner({ label = 'Carregando' }: { readonly label?: string }) {
  return (
    <span className="ui-spinner" role="status">
      <span aria-hidden="true" /> <span>{label}</span>
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  readonly title: string;
  readonly description: string;
  readonly action?: ReactNode;
}) {
  return (
    <div className="ui-empty-state">
      <strong>{title}</strong>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function FilterBar({ children }: PropsWithChildren) {
  return <div className="ui-filter-bar">{children}</div>;
}

export function FormSection({
  title,
  description,
  children,
}: PropsWithChildren<{ readonly title: string; readonly description?: string }>) {
  return (
    <section className="ui-form-section">
      <div className="ui-form-section__heading">
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      <div className="ui-form-grid">{children}</div>
    </section>
  );
}

export function FormActions({ children }: PropsWithChildren) {
  return <div className="ui-form-actions">{children}</div>;
}

export function FieldError({ children, id }: PropsWithChildren<{ readonly id?: string }>) {
  if (!children) return null;
  return (
    <span className="ui-field-error" id={id} role="alert">
      {children}
    </span>
  );
}

export function LoadingState({ label }: { readonly label: string }) {
  return (
    <div className="ui-state-panel" role="status">
      <Spinner label={label} />
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  readonly message: string;
  readonly onRetry?: () => void;
}) {
  return (
    <Alert tone="danger">
      <span>{message}</span>
      {onRetry ? (
        <Button onClick={onRetry} type="button" variant="secondary">
          Tentar novamente
        </Button>
      ) : null}
    </Alert>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onCancel,
  onConfirm,
  error,
  pending = false,
}: {
  readonly open: boolean;
  readonly title: string;
  readonly description: string;
  readonly confirmLabel: string;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
  readonly error?: string;
  readonly pending?: boolean;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return undefined;
    cancelRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !pending) onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel, open, pending]);

  if (!open) return null;

  return (
    <div className="ui-dialog-backdrop">
      <section
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="ui-dialog"
        role="dialog"
      >
        <h2 id={titleId}>{title}</h2>
        <p id={descriptionId}>{description}</p>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <FormActions>
          <Button
            disabled={pending}
            onClick={onCancel}
            ref={cancelRef}
            type="button"
            variant="secondary"
          >
            Cancelar
          </Button>
          <Button disabled={pending} onClick={onConfirm} type="button" variant="danger">
            {pending ? 'Processando…' : confirmLabel}
          </Button>
        </FormActions>
      </section>
    </div>
  );
}

export function Skeleton({ label = 'Carregando conteúdo' }: { readonly label?: string }) {
  return <span aria-label={label} className="ui-skeleton" role="status" />;
}

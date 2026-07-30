import {
  forwardRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type PropsWithChildren,
  type ReactNode,
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

export function Skeleton({ label = 'Carregando conteúdo' }: { readonly label?: string }) {
  return <span aria-label={label} className="ui-skeleton" role="status" />;
}

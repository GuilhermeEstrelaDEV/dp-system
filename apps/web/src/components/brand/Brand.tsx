interface BrandProps {
  readonly compact?: boolean;
  readonly inverse?: boolean;
}

export function Brand({ compact = false, inverse = false }: BrandProps) {
  return (
    <div className="brand" data-compact={compact || undefined}>
      <svg aria-hidden="true" className="brand__symbol" viewBox="0 0 48 48">
        <rect height="44" rx="12" width="44" x="2" y="2" />
        <path d="M13 14h11c8 0 12 4 12 10s-4 10-12 10H13V14Zm8 6v8h3c3 0 5-1 5-4s-2-4-5-4h-3Z" />
        <path d="M31 11h5v8h-5z" />
      </svg>
      {!compact && (
        <span className={inverse ? 'brand__copy brand__copy--inverse' : 'brand__copy'}>
          <strong>DP-System</strong>
          <small>Gestão integrada de Departamento Pessoal</small>
        </span>
      )}
    </div>
  );
}

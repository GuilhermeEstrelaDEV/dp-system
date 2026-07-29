import { useEffect, useRef } from 'react';
import { NavigationLinks } from './NavigationLinks';
import { Brand } from '@/components/brand/Brand';

interface MobileNavigationProps {
  readonly onClose: () => void;
}

export function MobileNavigation({ onClose }: MobileNavigationProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  return (
    <div
      aria-label="Menu de navegação"
      aria-modal="true"
      className="mobile-navigation lg:hidden"
      id="mobile-navigation"
      role="dialog"
    >
      <button
        aria-label="Fechar menu pelo plano de fundo"
        className="mobile-navigation__backdrop"
        onClick={onClose}
        type="button"
      />
      <aside className="mobile-navigation__panel">
        <div className="mb-6 flex items-center justify-between">
          <Brand inverse />
          <button
            aria-label="Fechar menu"
            className="rounded-md p-2 text-slate-100 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            <span aria-hidden="true" className="text-xl leading-none">
              ×
            </span>
          </button>
        </div>
        <NavigationLinks onNavigate={onClose} />
      </aside>
    </div>
  );
}

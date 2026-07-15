import { useEffect, useRef } from 'react';
import { NavigationLinks } from './NavigationLinks';

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
      className="fixed inset-0 z-50 lg:hidden"
      id="mobile-navigation"
      role="dialog"
    >
      <button
        aria-label="Fechar menu pelo plano de fundo"
        className="absolute inset-0 cursor-default bg-slate-950/60"
        onClick={onClose}
        type="button"
      />
      <aside className="relative flex h-full w-[min(18rem,calc(100vw-2rem))] flex-col bg-slate-950 p-4 text-white shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <span className="font-semibold">DP System</span>
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

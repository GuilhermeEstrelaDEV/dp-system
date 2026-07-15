import { useLocation } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { getNavigationItem } from '@/components/layout/navigation';

export function ModulePlaceholderPage() {
  const { pathname } = useLocation();
  const module = getNavigationItem(pathname);

  return (
    <section
      aria-labelledby="module-title"
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <PageHeader
        description={module?.description ?? 'Este módulo será disponibilizado em uma etapa futura.'}
        title={module?.label ?? 'Módulo'}
      />
      <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
        <p className="font-semibold">Ambiente demonstrativo</p>
        <p className="mt-1">
          Esta é uma rota de placeholder. Nenhum dado, integração ou regra de negócio está
          disponível nesta etapa.
        </p>
      </div>
    </section>
  );
}

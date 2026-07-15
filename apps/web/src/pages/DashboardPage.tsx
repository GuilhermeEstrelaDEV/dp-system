import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';

const demonstrativeStats = [
  {
    label: 'Pendências fictícias',
    value: '3',
    detail: 'Indicador demonstrativo — sem dados operacionais.',
  },
  {
    label: 'Tarefas fictícias',
    value: '8',
    detail: 'Indicador demonstrativo — sem dados operacionais.',
  },
  {
    label: 'Documentos simulados',
    value: '12',
    detail: 'Indicador demonstrativo — sem dados operacionais.',
  },
];

export function DashboardPage() {
  return (
    <section aria-labelledby="dashboard-title">
      <div
        className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950"
        role="status"
      >
        <p className="font-semibold">Ambiente demonstrativo</p>
        <p className="mt-1 text-sm">
          Todos os números e atividades abaixo são fictícios e existem apenas para apresentar a
          interface.
        </p>
      </div>
      <PageHeader
        description="Uma visão inicial da estrutura do sistema, usando exclusivamente conteúdo demonstrativo."
        title="Visão geral"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {demonstrativeStats.map((stat) => (
          <StatCard {...stat} key={stat.label} />
        ))}
      </div>
      <section
        aria-labelledby="demonstrative-activities"
        className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-slate-950" id="demonstrative-activities">
          Atividades demonstrativas
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Exemplos fictícios de como o acompanhamento poderá ser apresentado.
        </p>
        <ul className="mt-4 divide-y divide-slate-100">
          {[
            'Atividade fictícia 01 — exemplo de acompanhamento',
            'Atividade fictícia 02 — exemplo de documentação',
            'Atividade fictícia 03 — exemplo de revisão',
          ].map((activity) => (
            <li className="py-3 text-sm text-slate-700" key={activity}>
              {activity}
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}

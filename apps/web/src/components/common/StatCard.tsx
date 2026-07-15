interface StatCardProps {
  readonly label: string;
  readonly value: string;
  readonly detail: string;
}

export function StatCard({ label, value, detail }: StatCardProps) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{detail}</p>
    </article>
  );
}

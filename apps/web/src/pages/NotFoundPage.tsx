import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section
      aria-labelledby="not-found-title"
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <p className="text-sm font-semibold text-sky-800">Erro 404</p>
      <h1 className="mt-2 text-2xl font-bold text-slate-950" id="not-found-title">
        Página não encontrada
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        O endereço informado não corresponde a uma página deste ambiente demonstrativo.
      </p>
      <Link
        className="mt-5 inline-flex rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
        to="/"
      >
        Ir para a visão geral
      </Link>
    </section>
  );
}

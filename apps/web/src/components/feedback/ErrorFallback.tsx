import { Link } from 'react-router-dom';

export function ErrorFallback() {
  return (
    <section
      aria-labelledby="error-title"
      className="rounded-xl border border-rose-200 bg-rose-50 p-6"
    >
      <p className="text-sm font-semibold text-rose-800">Não foi possível carregar esta área</p>
      <h1 className="mt-2 text-2xl font-bold text-slate-950" id="error-title">
        Ocorreu um erro inesperado
      </h1>
      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-700">
        Tente voltar para a visão geral. Nenhum dado foi alterado.
      </p>
      <Link
        className="mt-5 inline-flex rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
        to="/"
      >
        Voltar para a visão geral
      </Link>
    </section>
  );
}

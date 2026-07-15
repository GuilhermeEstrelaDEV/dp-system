import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { PageHeader } from '@/components/common/PageHeader';
import { apiRequest } from '@/lib/api';

type Field = readonly [string, string];
interface RecordItem {
  id: string;
  status: string;
}
interface PageProps {
  title: string;
  endpoint: string;
  fields: readonly Field[];
  companyScoped?: boolean;
}
export function ResourcePage<TItem extends RecordItem>({
  title,
  endpoint,
  fields,
  companyScoped = false,
}: PageProps) {
  const [companyId, setCompanyId] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();
  const schema = z.object(
    Object.fromEntries(
      fields.map(([key, label]) => [
        key,
        key === 'description'
          ? z.string().max(1000).optional()
          : z.string().min(1, `${label} é obrigatório`),
      ]),
    ),
  );
  const form = useForm<Record<string, string | undefined>>({
    resolver: zodResolver(schema),
    defaultValues: Object.fromEntries(fields.map(([key]) => [key, ''])),
  });
  const ready = !companyScoped || Boolean(companyId);
  const list = useQuery({
    queryKey: [endpoint, companyId, search],
    enabled: ready,
    queryFn: () =>
      apiRequest<{ items: TItem[] }>(
        `${endpoint}?page=1&pageSize=20${companyScoped ? `&companyId=${companyId}` : ''}&search=${encodeURIComponent(search)}`,
      ),
  });
  const create = useMutation({
    mutationFn: (values: Record<string, string | undefined>) =>
      apiRequest<TItem>(endpoint, {
        method: 'POST',
        body: JSON.stringify(companyScoped ? { ...values, companyId } : values),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [endpoint] });
      setShowForm(false);
      form.reset();
    },
  });
  const toggle = useMutation({
    mutationFn: (item: TItem) =>
      apiRequest<TItem>(
        `${endpoint}/${item.id}/${item.status === 'ACTIVE' ? 'inactivate' : 'activate'}`,
        { method: 'PATCH' },
      ),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [endpoint] }),
  });
  return (
    <section aria-labelledby="resource-title">
      <PageHeader title={title} description="Cadastro estrutural multiempresa." />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input
          aria-label={`Pesquisar ${title}`}
          className="rounded border p-2"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar"
        />
        {companyScoped && (
          <input
            aria-label="ID da empresa"
            className="rounded border p-2"
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            placeholder="ID da empresa"
          />
        )}
        <button
          type="button"
          className="rounded bg-slate-950 px-4 py-2 text-white"
          onClick={() => setShowForm(true)}
        >
          Novo
        </button>
      </div>
      {showForm && (
        <form
          className="mb-5 rounded border p-4"
          onSubmit={form.handleSubmit((values) => create.mutate(values))}
        >
          <h2 className="font-semibold">Novo cadastro</h2>
          {fields.map(([key, label]) => (
            <label className="mt-3 block" key={key}>
              {label}
              <input className="mt-1 block w-full rounded border p-2" {...form.register(key)} />
              <span className="text-sm text-rose-700">{form.formState.errors[key]?.message}</span>
            </label>
          ))}
          <button className="mt-4 rounded bg-sky-700 px-4 py-2 text-white" type="submit">
            Salvar
          </button>
        </form>
      )}
      {!ready ? (
        <p>Informe uma empresa para consultar os registros.</p>
      ) : list.isLoading ? (
        <p role="status">Carregando…</p>
      ) : list.isError ? (
        <p role="alert">{list.error.message}</p>
      ) : list.data?.items.length === 0 ? (
        <p>Nenhum registro encontrado.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                {fields.map(([, label]) => (
                  <th key={label}>{label}</th>
                ))}
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {list.data?.items.map((item) => (
                <tr key={item.id}>
                  {fields.map(([key]) => (
                    <td key={key}>{String(item[key as keyof TItem] ?? '—')}</td>
                  ))}
                  <td>{item.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Confirmar alteração de status de ${title}?`))
                          toggle.mutate(item);
                      }}
                    >
                      {item.status === 'ACTIVE' ? 'Inativar' : 'Ativar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

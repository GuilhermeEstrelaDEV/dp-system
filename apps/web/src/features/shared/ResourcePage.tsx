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
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TItem | null>(null);
  const [selected, setSelected] = useState<TItem | null>(null);
  const [pendingStatus, setPendingStatus] = useState<TItem | null>(null);
  const client = useQueryClient();
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
    queryKey: [endpoint, companyId, search, status, page],
    enabled: ready,
    queryFn: () =>
      apiRequest<{ items: TItem[]; pagination: { totalPages: number } }>(
        `${endpoint}?page=${page}&pageSize=20${companyScoped ? `&companyId=${companyId}` : ''}&search=${encodeURIComponent(search)}${status ? `&status=${status}` : ''}`,
      ),
  });
  const save = useMutation({
    mutationFn: (values: Record<string, string | undefined>) =>
      apiRequest<TItem>(editing ? `${endpoint}/${editing.id}` : endpoint, {
        method: editing ? 'PATCH' : 'POST',
        body: JSON.stringify(companyScoped && !editing ? { ...values, companyId } : values),
      }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: [endpoint] });
      setEditing(null);
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
    onSuccess: () => void client.invalidateQueries({ queryKey: [endpoint] }),
  });
  const beginEdit = (item: TItem) => {
    setEditing(item);
    setShowForm(true);
    fields.forEach(([key]) => form.setValue(key, String(item[key as keyof TItem] ?? '')));
  };
  return (
    <section aria-labelledby="resource-title">
      <PageHeader title={title} description="Cadastro estrutural multiempresa." />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input
          aria-label={`Pesquisar ${title}`}
          className="rounded border p-2"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Pesquisar"
        />
        {companyScoped && (
          <input
            aria-label="ID da empresa"
            className="rounded border p-2"
            value={companyId}
            onChange={(event) => setCompanyId(event.target.value)}
            placeholder="ID da empresa"
          />
        )}
        <select
          aria-label="Filtrar por status"
          className="rounded border p-2"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
        >
          <option value="">Todos os status</option>
          <option value="ACTIVE">Ativos</option>
          <option value="INACTIVE">Inativos</option>
        </select>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            form.reset();
            setShowForm(true);
          }}
        >
          Novo
        </button>
      </div>
      {showForm && (
        <form
          onSubmit={form.handleSubmit((values) => save.mutate(values))}
          className="mb-5 rounded border p-4"
        >
          <h2>{editing ? `Editar ${title}` : `Novo cadastro`}</h2>
          {fields.map(([key, label]) => (
            <label className="mt-3 block" key={key}>
              {label}
              <input className="mt-1 block w-full rounded border p-2" {...form.register(key)} />
              <span>{form.formState.errors[key]?.message}</span>
            </label>
          ))}
          <button type="submit">Salvar</button>
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
          <table>
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
                    <button type="button" onClick={() => setSelected(item)}>
                      Detalhes
                    </button>
                    <button type="button" onClick={() => beginEdit(item)}>
                      Editar
                    </button>
                    <button type="button" onClick={() => setPendingStatus(item)}>
                      {item.status === 'ACTIVE' ? 'Inativar' : 'Ativar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {list.data && (
        <nav aria-label="Paginação" className="mt-4">
          <button type="button" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>
            Página anterior
          </button>
          <span>Página {page}</span>
          <button
            type="button"
            disabled={page >= list.data.pagination.totalPages}
            onClick={() => setPage((value) => value + 1)}
          >
            Próxima página
          </button>
        </nav>
      )}
      {selected && (
        <section aria-label="Detalhes do registro">
          <h2>Detalhes</h2>
          {fields.map(([key, label]) => (
            <p key={key}>
              {label}: {String(selected[key as keyof TItem] ?? '—')}
            </p>
          ))}
          <button type="button" onClick={() => setSelected(null)}>
            Fechar detalhes
          </button>
        </section>
      )}
      {pendingStatus && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirmar alteração de status"
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50"
        >
          <div className="bg-white p-5">
            <p>Deseja {pendingStatus.status === 'ACTIVE' ? 'inativar' : 'ativar'} este registro?</p>
            <button type="button" onClick={() => setPendingStatus(null)}>
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                toggle.mutate(pendingStatus);
                setPendingStatus(null);
              }}
            >
              Confirmar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

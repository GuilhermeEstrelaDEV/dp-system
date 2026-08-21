import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { apiRequest } from '@/lib/api';
import { useOptionalAuth } from '@/features/auth/AuthContext';
import { useState } from 'react';

type Template = {
  id: string;
  name: string;
  description?: string;
  status: string;
  items: Array<{ id: string }>;
};

export function ChecklistTemplatesPage() {
  const auth = useOptionalAuth();
  const canManage = auth?.hasCapability('admission.manage') ?? true;
  const [selected, setSelected] = useState<Template>();
  const client = useQueryClient();
  const templates = useQuery({
    queryKey: ['checklist-templates', auth?.activeCompanyId],
    queryFn: () => apiRequest<Template[]>('/checklist-templates'),
  });
  const status = useMutation({
    mutationFn: ({ id, next }: { id: string; next: 'activate' | 'inactivate' }) =>
      apiRequest(`/checklist-templates/${id}/${next}`, { method: 'PATCH' }),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['checklist-templates'] }),
  });
  const create = useMutation({
    mutationFn: (form: FormData) =>
      apiRequest<Template>('/checklist-templates', {
        method: 'POST',
        body: JSON.stringify({
          name: form.get('name'),
          description: form.get('description') || undefined,
          items: [
            {
              title: form.get('itemTitle'),
              sortOrder: 1,
              isRequired: form.get('isRequired') === 'on',
            },
          ],
        }),
      }),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['checklist-templates'] }),
  });
  const detail = useMutation({
    mutationFn: (id: string) => apiRequest<Template>(`/checklist-templates/${id}`),
    onSuccess: setSelected,
  });
  if (templates.isLoading) return <p role="status">Carregando templates…</p>;
  if (templates.isError) return <p role="alert">{templates.error.message}</p>;
  return (
    <section aria-labelledby="checklist-templates-title">
      <PageHeader
        title="Templates de checklist"
        description="Templates são configurações internas demonstrativas; seus itens são copiados para cada processo admissional."
      />
      {canManage && (
        <form
          className="mb-5 grid max-w-xl gap-3 rounded border p-4"
          onSubmit={(event) => {
            event.preventDefault();
            create.mutate(new FormData(event.currentTarget));
          }}
        >
          <h2>Novo template</h2>
          <label>
            Nome
            <input name="name" required />
          </label>
          <label>
            Descrição
            <input name="description" />
          </label>
          <label>
            Primeiro item
            <input name="itemTitle" required />
          </label>
          <label className="flex gap-2">
            <input name="isRequired" type="checkbox" /> Item obrigatório
          </label>
          <button disabled={create.isPending}>Criar template</button>
        </form>
      )}
      {templates.data!.length ? (
        <ul className="grid gap-3">
          {templates.data!.map((item) => (
            <li key={item.id} className="rounded border p-4">
              <h2>{item.name}</h2>
              {item.description && <p>{item.description}</p>}
              <p>
                Status: {item.status} · {item.items.length} itens
              </p>
              <button type="button" onClick={() => detail.mutate(item.id)}>
                Ver detalhes
              </button>
              {canManage && (
                <button
                  type="button"
                  onClick={() =>
                    status.mutate({
                      id: item.id,
                      next: item.status === 'ACTIVE' ? 'inactivate' : 'activate',
                    })
                  }
                >
                  {item.status === 'ACTIVE' ? 'Inativar' : 'Ativar'}
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>Nenhum template demonstrativo cadastrado.</p>
      )}
      {selected && (
        <section className="mt-4 rounded border p-4" aria-label="Detalhes do template">
          <h2>{selected.name}</h2>
          <p>{selected.items.length} itens configurados.</p>
          <button type="button" onClick={() => setSelected(undefined)}>
            Fechar detalhes
          </button>
        </section>
      )}
      {status.isError || create.isError || detail.isError ? (
        <p role="alert">
          {status.error?.message ?? create.error?.message ?? detail.error?.message}
        </p>
      ) : null}
    </section>
  );
}

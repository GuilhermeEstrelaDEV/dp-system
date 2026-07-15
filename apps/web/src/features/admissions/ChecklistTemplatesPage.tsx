import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { apiRequest } from '@/lib/api';

type Template = {
  id: string;
  name: string;
  description?: string;
  status: string;
  items: Array<{ id: string }>;
};

export function ChecklistTemplatesPage() {
  const client = useQueryClient();
  const templates = useQuery({
    queryKey: ['checklist-templates'],
    queryFn: () => apiRequest<Template[]>('/checklist-templates'),
  });
  const status = useMutation({
    mutationFn: ({ id, next }: { id: string; next: 'activate' | 'inactivate' }) =>
      apiRequest(`/checklist-templates/${id}/${next}`, { method: 'PATCH' }),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['checklist-templates'] }),
  });
  if (templates.isLoading) return <p role="status">Carregando templates…</p>;
  if (templates.isError) return <p role="alert">{templates.error.message}</p>;
  return (
    <section aria-labelledby="checklist-templates-title">
      <PageHeader
        title="Templates de checklist"
        description="Templates são configurações internas demonstrativas; seus itens são copiados para cada processo admissional."
      />
      {templates.data!.length ? (
        <ul className="grid gap-3">
          {templates.data!.map((item) => (
            <li key={item.id} className="rounded border p-4">
              <h2>{item.name}</h2>
              {item.description && <p>{item.description}</p>}
              <p>
                Status: {item.status} · {item.items.length} itens
              </p>
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
            </li>
          ))}
        </ul>
      ) : (
        <p>Nenhum template demonstrativo cadastrado.</p>
      )}
      {status.isError && <p role="alert">{status.error.message}</p>}
    </section>
  );
}

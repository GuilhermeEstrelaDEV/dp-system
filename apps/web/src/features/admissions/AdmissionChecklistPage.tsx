import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { apiRequest } from '@/lib/api';

type ChecklistItem = {
  id: string;
  title: string;
  description?: string;
  status: string;
  isRequired: boolean;
  dueDate?: string;
};
type Checklist = { id: string; templateName: string; items: ChecklistItem[] };

export function AdmissionChecklistPage() {
  const { admissionId = '' } = useParams();
  const client = useQueryClient();
  const checklist = useQuery({
    queryKey: ['admission-checklist', admissionId],
    queryFn: () => apiRequest<Checklist>(`/admission-processes/${admissionId}/checklist`),
  });
  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest(`/admission-checklist-items/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          reason:
            status === 'NOT_APPLICABLE' ? 'Não aplicável no cenário demonstrativo.' : undefined,
        }),
      }),
    onSuccess: () =>
      void client.invalidateQueries({ queryKey: ['admission-checklist', admissionId] }),
  });

  if (checklist.isLoading) return <p role="status">Carregando checklist…</p>;
  if (checklist.isError) return <p role="alert">{checklist.error.message}</p>;
  return (
    <section aria-labelledby="admission-checklist-title">
      <PageHeader
        title="Checklist admissional"
        description={`Template registrado: ${checklist.data!.templateName}. Itens e prazos são demonstrativos.`}
      />
      <ul className="grid gap-3">
        {checklist.data!.items.map((item) => (
          <li key={item.id} className="rounded border p-4">
            <h2>
              {item.title}
              {item.isRequired ? ' (obrigatório)' : ''}
            </h2>
            {item.description && <p>{item.description}</p>}
            <p>
              Status: {item.status}
              {item.dueDate ? ` · prazo configurado: ${item.dueDate}` : ''}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => update.mutate({ id: item.id, status: 'COMPLETED' })}
              >
                Concluir
              </button>
              <button
                type="button"
                onClick={() => update.mutate({ id: item.id, status: 'NOT_APPLICABLE' })}
              >
                Não aplicável
              </button>
              <button
                type="button"
                onClick={() => update.mutate({ id: item.id, status: 'BLOCKED' })}
              >
                Bloquear
              </button>
            </div>
          </li>
        ))}
      </ul>
      {update.isError && <p role="alert">{update.error.message}</p>}
    </section>
  );
}

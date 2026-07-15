import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { apiRequest } from '@/lib/api';

type DocumentRequirement = {
  id: string;
  documentType: string;
  isRequired: boolean;
  receiptStatus: string;
  reviewStatus: string;
  observation?: string;
};

export function AdmissionDocumentsPage() {
  const { admissionId = '' } = useParams();
  const client = useQueryClient();
  const documents = useQuery({
    queryKey: ['admission-documents', admissionId],
    queryFn: () =>
      apiRequest<DocumentRequirement[]>(`/admission-processes/${admissionId}/documents`),
  });
  const action = useMutation({
    mutationFn: ({
      id,
      actionName,
    }: {
      id: string;
      actionName: 'mark-received' | 'mark-reviewed';
    }) =>
      apiRequest(`/admission-documents/${id}/${actionName}`, {
        method: 'POST',
        body: JSON.stringify({
          observation: 'Controle lógico atualizado no ambiente demonstrativo.',
        }),
      }),
    onSuccess: () =>
      void client.invalidateQueries({ queryKey: ['admission-documents', admissionId] }),
  });
  if (documents.isLoading) return <p role="status">Carregando documentos lógicos…</p>;
  if (documents.isError) return <p role="alert">{documents.error.message}</p>;
  return (
    <section aria-labelledby="admission-documents-title">
      <PageHeader
        title="Documentos admissionais"
        description="Não há upload ou armazenamento de arquivos: esta tela registra somente requisitos documentais lógicos demonstrativos."
      />
      {documents.data!.length ? (
        <ul className="grid gap-3">
          {documents.data!.map((item) => (
            <li key={item.id} className="rounded border p-4">
              <h2>
                {item.documentType}
                {item.isRequired ? ' (obrigatório)' : ''}
              </h2>
              <p>
                Recebimento: {item.receiptStatus} · Revisão: {item.reviewStatus}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => action.mutate({ id: item.id, actionName: 'mark-received' })}
                >
                  Marcar recebido
                </button>
                <button
                  type="button"
                  onClick={() => action.mutate({ id: item.id, actionName: 'mark-reviewed' })}
                >
                  Marcar revisado
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>Nenhum requisito documental lógico cadastrado.</p>
      )}
      {action.isError && <p role="alert">{action.error.message}</p>}
    </section>
  );
}

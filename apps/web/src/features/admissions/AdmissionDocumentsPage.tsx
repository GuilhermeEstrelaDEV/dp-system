import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { apiRequest } from '@/lib/api';
import { useOptionalAuth } from '@/features/auth/AuthContext';

type DocumentRequirement = {
  id: string;
  documentType: string;
  isRequired: boolean;
  receiptStatus: string;
  reviewStatus: string;
  observation?: string;
};

export function AdmissionDocumentsPage() {
  const auth = useOptionalAuth();
  const canManage = auth?.hasCapability('admission.manage') ?? true;
  const { admissionId = '' } = useParams();
  const client = useQueryClient();
  const [editingId, setEditingId] = useState<string>();
  const [observation, setObservation] = useState('');
  const documents = useQuery({
    queryKey: ['admission-documents', auth?.activeCompanyId, admissionId],
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
  const create = useMutation({
    mutationFn: (form: FormData) =>
      apiRequest(`/admission-processes/${admissionId}/documents`, {
        method: 'POST',
        body: JSON.stringify({
          documentType: form.get('documentType'),
          isRequired: form.get('isRequired') === 'on',
          observation: form.get('observation') || undefined,
        }),
      }),
    onSuccess: () =>
      void client.invalidateQueries({ queryKey: ['admission-documents', auth?.activeCompanyId] }),
  });
  const update = useMutation({
    mutationFn: () =>
      apiRequest(`/admission-documents/${editingId}`, {
        method: 'PATCH',
        body: JSON.stringify({ observation }),
      }),
    onSuccess: () => {
      setEditingId(undefined);
      setObservation('');
      void client.invalidateQueries({ queryKey: ['admission-documents', auth?.activeCompanyId] });
    },
  });
  if (documents.isLoading) return <p role="status">Carregando documentos lógicos…</p>;
  if (documents.isError) return <p role="alert">{documents.error.message}</p>;
  return (
    <section aria-labelledby="admission-documents-title">
      <PageHeader
        title="Documentos admissionais"
        description="Não há upload ou armazenamento de arquivos: esta tela registra somente requisitos documentais lógicos demonstrativos."
      />
      {canManage && (
        <form
          className="mb-5 grid max-w-xl gap-3 rounded border p-4"
          onSubmit={(event) => {
            event.preventDefault();
            create.mutate(new FormData(event.currentTarget));
          }}
        >
          <h2>Novo requisito documental</h2>
          <label>
            Tipo do documento
            <input name="documentType" required />
          </label>
          <label className="flex gap-2">
            <input name="isRequired" type="checkbox" /> Obrigatório
          </label>
          <label>
            Observação fictícia
            <input name="observation" />
          </label>
          <button disabled={create.isPending}>Adicionar requisito</button>
        </form>
      )}
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
              {canManage && (
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => setEditingId(item.id)}>
                    Atualizar observação
                  </button>
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
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>Nenhum requisito documental lógico cadastrado.</p>
      )}
      {editingId && (
        <form
          className="mt-4 flex flex-wrap gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            update.mutate();
          }}
        >
          <label>
            Nova observação fictícia
            <input value={observation} onChange={(event) => setObservation(event.target.value)} />
          </label>
          <button disabled={update.isPending}>Salvar observação</button>
          <button type="button" onClick={() => setEditingId(undefined)}>
            Cancelar
          </button>
        </form>
      )}
      {action.isError || create.isError || update.isError ? (
        <p role="alert">
          {action.error?.message ?? create.error?.message ?? update.error?.message}
        </p>
      ) : null}
    </section>
  );
}

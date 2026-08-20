import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { apiRequest } from '@/lib/api';
import { useOptionalAuth } from '@/features/auth/AuthContext';

type AdmissionDetails = {
  id: string;
  status: string;
  plannedAdmissionDate: string;
  employee: { legalName: string };
  employmentContract: { registrationNumber: string };
  checklistInstances: Array<{ items: Array<{ id: string; status: string; isRequired: boolean }> }>;
  documents: Array<{
    id: string;
    documentType: string;
    receiptStatus: string;
    reviewStatus: string;
  }>;
};

export function AdmissionDetailsPage() {
  const auth = useOptionalAuth();
  const canManage = auth?.hasCapability('admission.manage') ?? true;
  const { admissionId = '' } = useParams();
  const client = useQueryClient();
  const [cancelReason, setCancelReason] = useState('');
  const process = useQuery({
    queryKey: ['admission-process', auth?.activeCompanyId, admissionId],
    queryFn: () => apiRequest<AdmissionDetails>(`/admission-processes/${admissionId}`),
  });
  const complete = useMutation({
    mutationFn: () =>
      apiRequest(`/admission-processes/${admissionId}/complete`, { method: 'POST' }),
    onSuccess: () =>
      void client.invalidateQueries({ queryKey: ['admission-process', admissionId] }),
  });
  const generateChecklist = useMutation({
    mutationFn: () =>
      apiRequest(`/admission-processes/${admissionId}/checklist/from-template`, {
        method: 'POST',
      }),
    onSuccess: () =>
      void client.invalidateQueries({ queryKey: ['admission-process', auth?.activeCompanyId] }),
  });
  const cancel = useMutation({
    mutationFn: () =>
      apiRequest(`/admission-processes/${admissionId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: cancelReason }),
      }),
    onSuccess: () => {
      setCancelReason('');
      void client.invalidateQueries({ queryKey: ['admission-process', auth?.activeCompanyId] });
    },
  });

  if (process.isLoading) return <p role="status">Carregando admissão…</p>;
  if (process.isError) return <p role="alert">{process.error.message}</p>;
  const item = process.data!;
  const checklist = item.checklistInstances[0]?.items ?? [];
  const concluded = checklist.filter((entry) =>
    ['COMPLETED', 'NOT_APPLICABLE'].includes(entry.status),
  ).length;

  return (
    <section aria-labelledby="admission-details-title">
      <PageHeader
        title={`Admissão de ${item.employee.legalName}`}
        description="Ambiente demonstrativo: este processo usa somente informações fictícias e controles operacionais."
      />
      <dl className="grid gap-3 sm:grid-cols-3">
        <div>
          <dt>Contrato</dt>
          <dd>{item.employmentContract.registrationNumber}</dd>
        </div>
        <div>
          <dt>Previsão</dt>
          <dd>{item.plannedAdmissionDate}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{item.status}</dd>
        </div>
      </dl>
      <p className="mt-5">
        Checklist:{' '}
        {checklist.length
          ? `${concluded} de ${checklist.length} itens tratados`
          : 'ainda não gerado'}
        .
      </p>
      <nav className="mt-5 flex flex-wrap gap-3" aria-label="Ações da admissão">
        <Link to={`/admissoes/${admissionId}/checklist`}>Ver checklist</Link>
        <Link to={`/admissoes/${admissionId}/documentos`}>
          Ver documentos lógicos ({item.documents.length})
        </Link>
        {canManage && <Link to={`/admissoes/${admissionId}/editar`}>Editar processo</Link>}
        {canManage && checklist.length === 0 && (
          <button type="button" onClick={() => generateChecklist.mutate()}>
            Gerar checklist do template
          </button>
        )}
        {canManage && item.status !== 'COMPLETED' && item.status !== 'CANCELLED' && (
          <button type="button" onClick={() => complete.mutate()} disabled={complete.isPending}>
            Concluir processo
          </button>
        )}
      </nav>
      {canManage && item.status !== 'COMPLETED' && item.status !== 'CANCELLED' && (
        <form
          className="mt-4 flex flex-wrap gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            cancel.mutate();
          }}
        >
          <label>
            Justificativa para cancelamento
            <input
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              required
            />
          </label>
          <button disabled={cancel.isPending || !cancelReason.trim()}>Cancelar processo</button>
        </form>
      )}
      {complete.isError || generateChecklist.isError || cancel.isError ? (
        <p role="alert" className="mt-3">
          {complete.error?.message ?? generateChecklist.error?.message ?? cancel.error?.message}
        </p>
      ) : null}
    </section>
  );
}

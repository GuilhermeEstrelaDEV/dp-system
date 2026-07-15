import { useMutation, useQuery } from '@tanstack/react-query';
import { type FormEvent, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { apiRequest } from '@/lib/api';

type Admission = {
  employeeId: string;
  employmentContractId: string;
  plannedAdmissionDate: string;
  operationalOwner?: string;
  notes?: string;
};

export function AdmissionFormPage() {
  const { admissionId } = useParams();
  const navigate = useNavigate();
  const existing = useQuery({
    enabled: Boolean(admissionId),
    queryKey: ['admission-process', admissionId],
    queryFn: () => apiRequest<Admission>(`/admission-processes/${admissionId}`),
  });
  const [values, setValues] = useState<Admission>({
    employeeId: '',
    employmentContractId: '',
    plannedAdmissionDate: '',
    operationalOwner: '',
    notes: '',
  });
  const [hasChanged, setHasChanged] = useState(false);
  const mutation = useMutation({
    mutationFn: (body: Admission) =>
      apiRequest<{ id: string }>(`/admission-processes${admissionId ? `/${admissionId}` : ''}`, {
        method: admissionId ? 'PATCH' : 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: (item) => navigate(`/admissoes/${admissionId ?? item.id}`),
  });
  const current = hasChanged ? values : (existing.data ?? values);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutation.mutate(current);
  };
  if (existing.isLoading) return <p role="status">Carregando processo admissional…</p>;
  if (existing.isError) return <p role="alert">{existing.error.message}</p>;
  return (
    <section aria-labelledby="admission-form-title">
      <PageHeader
        title={admissionId ? 'Editar admissão' : 'Nova admissão'}
        description="Ambiente demonstrativo: informe apenas identificadores e observações fictícias; não há dados pessoais, documentos ou regras legais nesta tela."
      />
      <form className="grid max-w-xl gap-4" onSubmit={submit}>
        {!admissionId && (
          <>
            <label>
              Identificador do colaborador
              <input
                required
                value={current.employeeId}
                onChange={(event) => {
                  setHasChanged(true);
                  setValues({ ...current, employeeId: event.target.value });
                }}
              />
            </label>
            <label>
              Identificador do contrato
              <input
                required
                value={current.employmentContractId}
                onChange={(event) => {
                  setHasChanged(true);
                  setValues({ ...current, employmentContractId: event.target.value });
                }}
              />
            </label>
          </>
        )}
        <label>
          Data prevista
          <input
            required
            type="date"
            value={current.plannedAdmissionDate.slice(0, 10)}
            onChange={(event) => {
              setHasChanged(true);
              setValues({ ...current, plannedAdmissionDate: event.target.value });
            }}
          />
        </label>
        <label>
          Responsável operacional
          <input
            value={current.operationalOwner ?? ''}
            onChange={(event) => {
              setHasChanged(true);
              setValues({ ...current, operationalOwner: event.target.value });
            }}
          />
        </label>
        <label>
          Observação
          <textarea
            value={current.notes ?? ''}
            onChange={(event) => {
              setHasChanged(true);
              setValues({ ...current, notes: event.target.value });
            }}
          />
        </label>
        <div className="flex gap-3">
          <button type="submit" disabled={mutation.isPending}>
            {admissionId ? 'Salvar alterações' : 'Criar processo'}
          </button>
          <Link to="/admissoes">Cancelar</Link>
        </div>
      </form>
      {mutation.isError && <p role="alert">{mutation.error.message}</p>}
    </section>
  );
}

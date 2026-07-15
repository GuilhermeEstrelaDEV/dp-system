import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { apiRequest } from '@/lib/api';
type Admission = {
  id: string;
  status: string;
  plannedAdmissionDate: string;
  employee: { legalName: string };
  checklistInstances: Array<{ items: Array<{ status: string }> }>;
};
export function AdmissionsPage() {
  const query = useQuery({
    queryKey: ['admission-processes'],
    queryFn: () => apiRequest<Admission[]>('/admission-processes'),
  });
  return (
    <section aria-labelledby="admissions-title">
      <PageHeader
        title="Admissões"
        description="Ambiente demonstrativo: prazos e documentos são apenas controles lógicos configuráveis."
      >
        <div className="flex gap-3">
          <Link to="/admissoes/nova">Nova admissão</Link>
          <Link to="/configuracoes/checklists">Templates de checklist</Link>
        </div>
      </PageHeader>
      {query.isLoading ? (
        <p role="status">Carregando admissões…</p>
      ) : query.isError ? (
        <p role="alert">{query.error.message}</p>
      ) : query.data?.length === 0 ? (
        <p>Nenhuma admissão demonstrativa encontrada.</p>
      ) : (
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Colaborador</th>
                <th>Previsão</th>
                <th>Status</th>
                <th>Progresso</th>
              </tr>
            </thead>
            <tbody>
              {query.data?.map((item) => {
                const entries = item.checklistInstances[0]?.items ?? [];
                const done = entries.filter((entry) =>
                  ['COMPLETED', 'NOT_APPLICABLE'].includes(entry.status),
                ).length;
                return (
                  <tr key={item.id}>
                    <td>
                      <Link to={`/admissoes/${item.id}`}>{item.employee.legalName}</Link>
                    </td>
                    <td>{item.plannedAdmissionDate}</td>
                    <td>{item.status}</td>
                    <td>
                      {entries.length
                        ? `${Math.round((done / entries.length) * 100)}%`
                        : 'Checklist não gerado'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

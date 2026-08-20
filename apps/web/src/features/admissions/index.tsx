import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, DataTableActions, DataTableStatus } from '@/components/common/DataTable';
import { useOptionalAuth } from '@/features/auth/AuthContext';
import { apiRequest } from '@/lib/api';
type Admission = {
  id: string;
  status: string;
  plannedAdmissionDate: string;
  employee: { legalName: string };
  checklistInstances: Array<{ items: Array<{ status: string }> }>;
};
export function AdmissionsPage() {
  const auth = useOptionalAuth();
  const canManage = auth?.hasCapability('admission.manage') ?? true;
  const query = useQuery({
    queryKey: ['admission-processes', auth?.activeCompanyId],
    queryFn: () => apiRequest<Admission[]>('/admission-processes'),
  });
  return (
    <section aria-labelledby="admissions-title">
      <PageHeader
        title="Admissões"
        description="Ambiente demonstrativo: prazos e documentos são apenas controles lógicos configuráveis."
      >
        <div className="flex gap-3">
          {canManage && <Link to="/admissoes/nova">Nova admissão</Link>}
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
        <DataTable label="Tabela de admissões">
          <thead>
            <tr>
              <th>Colaborador</th>
              <th>Previsão</th>
              <th>Status</th>
              <th>Progresso</th>
              <th>Ações</th>
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
                  <td className="ui-table-cell--compact">
                    <DataTableStatus
                      active={!['CANCELLED'].includes(item.status)}
                      activeLabel={item.status}
                      inactiveLabel={item.status}
                    />
                  </td>
                  <td>
                    {entries.length
                      ? `${Math.round((done / entries.length) * 100)}%`
                      : 'Checklist não gerado'}
                  </td>
                  <td>
                    <DataTableActions>
                      <Link to={`/admissoes/${item.id}`}>Detalhes</Link>
                      {canManage && <Link to={`/admissoes/${item.id}/editar`}>Editar</Link>}
                    </DataTableActions>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      )}
    </section>
  );
}

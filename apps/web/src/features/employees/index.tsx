import type { EmployeeContract } from '@dp-system/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { apiRequest } from '@/lib/api';
import { EmployeeForm, type EmployeeValues } from './EmployeeForm';

export function EmployeesPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const client = useQueryClient();
  const navigate = useNavigate();
  const list = useQuery({
    queryKey: ['employees', search, status],
    queryFn: () =>
      apiRequest<{ items: EmployeeContract[] }>(
        `/employees?search=${encodeURIComponent(search)}&status=${status}`,
      ),
  });
  const create = useMutation({
    mutationFn: (values: EmployeeValues) =>
      apiRequest<EmployeeContract>('/employees', { method: 'POST', body: JSON.stringify(values) }),
    onSuccess: (employee) => {
      void client.invalidateQueries({ queryKey: ['employees'] });
      navigate(`/colaboradores/${employee.id}`);
    },
  });
  const toggle = useMutation({
    mutationFn: (employee: EmployeeContract) =>
      apiRequest(
        `/employees/${employee.id}/${employee.status === 'ACTIVE' ? 'inactivate' : 'activate'}`,
        { method: 'PATCH' },
      ),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['employees'] }),
  });
  return (
    <section aria-labelledby="employees-title">
      <PageHeader
        title="Colaboradores"
        description="Ambiente demonstrativo: nenhum dado pessoal real deve ser informado."
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input
          aria-label="Pesquisar colaboradores"
          className="rounded border p-2"
          placeholder="Pesquisar por nome"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          aria-label="Filtrar colaboradores por status"
          className="rounded border p-2"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="">Todos os status</option>
          <option value="ACTIVE">Ativos</option>
          <option value="INACTIVE">Inativos</option>
        </select>
        <button type="button" onClick={() => setCreateOpen((value) => !value)}>
          Novo colaborador
        </button>
      </div>
      {createOpen && (
        <EmployeeForm
          onSubmit={(values) => create.mutate(values)}
          submitLabel="Criar colaborador"
        />
      )}
      {create.isError && <p role="alert">{create.error.message}</p>}
      {list.isLoading ? (
        <p role="status">Carregando colaboradores…</p>
      ) : list.isError ? (
        <p role="alert">{list.error.message}</p>
      ) : list.data?.items.length === 0 ? (
        <p>Nenhum colaborador demonstrativo encontrado.</p>
      ) : (
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {list.data?.items.map((employee) => (
                <tr key={employee.id}>
                  <td>
                    <Link to={`/colaboradores/${employee.id}`}>
                      {employee.preferredName || employee.legalName}
                    </Link>
                  </td>
                  <td>{employee.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}</td>
                  <td>
                    <button type="button" onClick={() => toggle.mutate(employee)}>
                      {employee.status === 'ACTIVE' ? 'Inativar' : 'Ativar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

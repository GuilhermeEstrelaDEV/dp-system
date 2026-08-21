import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { DataTable, DataTableActions, DataTableStatus } from '@/components/common/DataTable';
import { PageHeader } from '@/components/common/PageHeader';
import { useOptionalAuth } from '@/features/auth/AuthContext';
import { apiRequest } from '@/lib/api';

type Benefit = {
  id: string;
  code: string;
  name: string;
  type: string;
  status: string;
  plans: Array<{
    id: string;
    name: string;
    employeeAmount: string;
    companyAmount: string;
    validFrom: string;
    validTo?: string | null;
    status: string;
  }>;
};
type Enrollment = {
  id: string;
  status: string;
  validFrom: string;
  validTo?: string | null;
  benefitPlan: { name: string; benefit: { name: string; type: string } };
};

export function BenefitsPage() {
  const auth = useOptionalAuth();
  const canManage = auth?.hasCapability('benefit.manage') ?? true;
  const client = useQueryClient();
  const [search, setSearch] = useState('');
  const [type, setType] = useState('ALL');
  const [contractId, setContractId] = useState('');
  const benefits = useQuery({
    queryKey: ['benefits', auth?.activeCompanyId, search, type],
    queryFn: () =>
      apiRequest<Benefit[]>(
        `/benefits?search=${encodeURIComponent(search)}${type === 'ALL' ? '' : `&type=${type}`}`,
      ),
  });
  const enrollments = useQuery({
    enabled: Boolean(contractId),
    queryKey: ['benefit-enrollments', auth?.activeCompanyId, contractId],
    queryFn: () => apiRequest<Enrollment[]>(`/benefits/enrollments/${contractId}`),
  });
  const invalidate = () => {
    void client.invalidateQueries({ queryKey: ['benefits'] });
    void client.invalidateQueries({ queryKey: ['benefit-enrollments'] });
  };
  const createBenefit = useMutation({
    mutationFn: (form: FormData) =>
      apiRequest('/benefits', {
        method: 'POST',
        body: JSON.stringify({
          code: form.get('code'),
          name: form.get('name'),
          type: form.get('type'),
        }),
      }),
    onSuccess: invalidate,
  });
  const createPlan = useMutation({
    mutationFn: (form: FormData) =>
      apiRequest('/benefits/plans', {
        method: 'POST',
        body: JSON.stringify({
          benefitId: form.get('benefitId'),
          name: form.get('name'),
          employeeAmount: form.get('employeeAmount'),
          companyAmount: form.get('companyAmount'),
          copayAmount: form.get('copayAmount') || undefined,
          validFrom: form.get('validFrom'),
          validTo: form.get('validTo') || undefined,
        }),
      }),
    onSuccess: invalidate,
  });
  const createEnrollment = useMutation({
    mutationFn: (form: FormData) =>
      apiRequest('/benefits/enrollments', {
        method: 'POST',
        body: JSON.stringify({
          employmentContractId: form.get('employmentContractId'),
          benefitPlanId: form.get('benefitPlanId'),
          validFrom: form.get('validFrom'),
          validTo: form.get('validTo') || undefined,
          reason: form.get('reason') || undefined,
        }),
      }),
    onSuccess: invalidate,
  });
  const changeEnrollment = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'SUSPENDED' | 'CANCELLED' }) =>
      apiRequest(`/benefits/enrollments/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, reason: 'Ação administrativa fictícia da demonstração.' }),
      }),
    onSuccess: invalidate,
  });
  const mutationError =
    createBenefit.error ?? createPlan.error ?? createEnrollment.error ?? changeEnrollment.error;

  return (
    <section aria-labelledby="benefits-title">
      <PageHeader
        title="Benefícios"
        description="Operação administrativa da empresa ativa, sem elegibilidade legal, cálculo de desconto ou integração com operadoras."
      />
      {canManage && (
        <div className="grid gap-6 lg:grid-cols-3">
          <BenefitForm title="Novo benefício" mutation={createBenefit}>
            <label>
              Código
              <input name="code" maxLength={50} required />
            </label>
            <label>
              Nome
              <input name="name" maxLength={160} required />
            </label>
            <label>
              Tipo
              <select name="type">
                <option value="GENERIC">Genérico</option>
                <option value="TRANSPORT">Transporte</option>
                <option value="MEAL">Refeição</option>
                <option value="FOOD">Alimentação</option>
              </select>
            </label>
          </BenefitForm>
          <BenefitForm title="Novo plano" mutation={createPlan}>
            <label>
              Benefício
              <select name="benefitId" required>
                <option value="">Selecione</option>
                {benefits.data?.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code} — {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Nome
              <input name="name" required />
            </label>
            <label>
              Valor colaborador
              <input name="employeeAmount" inputMode="decimal" defaultValue="0.00" required />
            </label>
            <label>
              Valor empresa
              <input name="companyAmount" inputMode="decimal" defaultValue="0.00" required />
            </label>
            <label>
              Coparticipação opcional
              <input name="copayAmount" inputMode="decimal" />
            </label>
            <label>
              Início
              <input name="validFrom" type="date" required />
            </label>
            <label>
              Fim opcional
              <input name="validTo" type="date" />
            </label>
          </BenefitForm>
          <BenefitForm title="Nova adesão" mutation={createEnrollment}>
            <label>
              Contrato
              <input name="employmentContractId" required />
            </label>
            <label>
              Plano
              <input name="benefitPlanId" required />
            </label>
            <label>
              Início
              <input name="validFrom" type="date" required />
            </label>
            <label>
              Fim opcional
              <input name="validTo" type="date" />
            </label>
            <label>
              Motivo administrativo
              <input name="reason" />
            </label>
          </BenefitForm>
        </div>
      )}
      {mutationError && <p role="alert">{mutationError.message}</p>}
      <div role="search" className="grid gap-3 md:grid-cols-2">
        <label>
          Pesquisar catálogo
          <input value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
        <label>
          Filtrar por tipo
          <select value={type} onChange={(event) => setType(event.target.value)}>
            <option value="ALL">Todos</option>
            <option value="GENERIC">Genérico</option>
            <option value="TRANSPORT">Transporte</option>
            <option value="MEAL">Refeição</option>
            <option value="FOOD">Alimentação</option>
          </select>
        </label>
      </div>
      {benefits.isLoading ? <p role="status">Carregando benefícios…</p> : null}
      {benefits.isError ? <p role="alert">{benefits.error.message}</p> : null}
      {benefits.data?.length === 0 ? <p>Nenhum benefício demonstrativo encontrado.</p> : null}
      {benefits.data?.length ? (
        <DataTable label="Tabela de benefícios">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nome</th>
              <th>Tipo</th>
              <th>Planos ativos</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {benefits.data.map((item) => (
              <tr key={item.id}>
                <td className="ui-table-cell--compact">{item.code}</td>
                <td>{item.name}</td>
                <td className="ui-table-cell--compact">{item.type}</td>
                <td>
                  {item.plans
                    .map((plan) => `${plan.name} (${plan.validFrom.slice(0, 10)})`)
                    .join(', ') || '—'}
                </td>
                <td>
                  <DataTableStatus active={item.status === 'ACTIVE'} />
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      ) : null}
      <section className="mt-6" aria-labelledby="enrollments-title">
        <h2 id="enrollments-title">Adesões por contrato</h2>
        <label>
          Identificador do contrato
          <input value={contractId} onChange={(event) => setContractId(event.target.value)} />
        </label>
        {enrollments.isLoading ? <p role="status">Carregando adesões…</p> : null}
        {enrollments.isError ? <p role="alert">{enrollments.error.message}</p> : null}
        {contractId && enrollments.data?.length === 0 ? (
          <p>Nenhuma adesão demonstrativa encontrada para o contrato.</p>
        ) : null}
        {!contractId ? <p>Informe um contrato para consultar adesões.</p> : null}
        {enrollments.data?.length ? (
          <DataTable label="Tabela de adesões a benefícios">
            <thead>
              <tr>
                <th>Benefício</th>
                <th>Plano</th>
                <th>Vigência</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.data.map((item) => (
                <tr key={item.id}>
                  <td>{item.benefitPlan.benefit.name}</td>
                  <td>{item.benefitPlan.name}</td>
                  <td className="ui-table-cell--compact">
                    {item.validFrom.slice(0, 10)} — {item.validTo?.slice(0, 10) ?? 'em aberto'}
                  </td>
                  <td>
                    <DataTableStatus
                      active={item.status === 'ACTIVE'}
                      activeLabel={item.status}
                      inactiveLabel={item.status}
                    />
                  </td>
                  <td>
                    <DataTableActions>
                      {canManage && item.status === 'ACTIVE' && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              changeEnrollment.mutate({ id: item.id, status: 'SUSPENDED' })
                            }
                          >
                            Suspender
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              changeEnrollment.mutate({ id: item.id, status: 'CANCELLED' })
                            }
                          >
                            Cancelar
                          </button>
                        </>
                      )}
                    </DataTableActions>
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        ) : null}
      </section>
    </section>
  );
}

function BenefitForm({
  title,
  mutation,
  children,
}: {
  readonly title: string;
  readonly mutation: { mutate(form: FormData): void; isPending: boolean };
  readonly children: ReactNode;
}) {
  return (
    <form
      className="grid gap-3 rounded border p-4"
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate(new FormData(event.currentTarget));
      }}
    >
      <h2>{title}</h2>
      {children}
      <DataTableActions>
        <button disabled={mutation.isPending}>Salvar</button>
      </DataTableActions>
    </form>
  );
}

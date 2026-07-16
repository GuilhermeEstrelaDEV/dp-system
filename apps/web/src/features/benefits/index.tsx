import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { PageHeader } from '@/components/common/PageHeader';
import { apiRequest } from '@/lib/api';

const benefitSchema = z.object({
  companyId: z.string().uuid('Informe o identificador da empresa.'),
  code: z.string().min(1, 'Informe o código.').max(50),
  name: z.string().min(1, 'Informe o nome.').max(160),
  type: z.enum(['TRANSPORT', 'MEAL', 'FOOD', 'GENERIC']),
});
const planSchema = z.object({
  benefitId: z.string().uuid('Informe o benefício.'),
  name: z.string().min(1, 'Informe o nome do plano.').max(160),
  employeeAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Use valor decimal com até duas casas.'),
  companyAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Use valor decimal com até duas casas.'),
  copayAmount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Use valor decimal com até duas casas.')
    .or(z.literal('')),
  validFrom: z.string().min(1, 'Informe o início da vigência.'),
  validTo: z.string(),
});
const enrollmentSchema = z.object({
  employmentContractId: z.string().uuid('Informe o contrato.'),
  benefitPlanId: z.string().uuid('Informe o plano.'),
  validFrom: z.string().min(1, 'Informe o início da vigência.'),
  validTo: z.string(),
  reason: z.string().max(1000),
});

type BenefitValues = z.infer<typeof benefitSchema>;
type PlanValues = z.infer<typeof planSchema>;
type EnrollmentValues = z.infer<typeof enrollmentSchema>;
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
    copayAmount?: string | null;
    validFrom: string;
    validTo?: string | null;
  }>;
};
type Enrollment = {
  id: string;
  status: string;
  validFrom: string;
  validTo?: string | null;
  reason?: string | null;
  benefitPlan: { name: string; benefit: { name: string; type: string } };
};

const typeLabels: Record<BenefitValues['type'], string> = {
  TRANSPORT: 'Vale-transporte',
  MEAL: 'Vale-refeição',
  FOOD: 'Vale-alimentação',
  GENERIC: 'Genérico',
};
const pageSize = 5;

function FormError({ message }: { message?: string }) {
  return message ? <span role="alert">{message}</span> : null;
}

export function BenefitsPage() {
  const client = useQueryClient();
  const [search, setSearch] = useState('');
  const [type, setType] = useState<'ALL' | BenefitValues['type']>('ALL');
  const [page, setPage] = useState(0);
  const [contractId, setContractId] = useState('');
  const benefitForm = useForm<BenefitValues>({
    resolver: zodResolver(benefitSchema),
    defaultValues: { companyId: '', code: '', name: '', type: 'GENERIC' },
  });
  const planForm = useForm<PlanValues>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      benefitId: '',
      name: '',
      employeeAmount: '0.00',
      companyAmount: '0.00',
      copayAmount: '',
      validFrom: '',
      validTo: '',
    },
  });
  const enrollmentForm = useForm<EnrollmentValues>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      employmentContractId: '',
      benefitPlanId: '',
      validFrom: '',
      validTo: '',
      reason: '',
    },
  });
  const benefits = useQuery({
    queryKey: ['benefits', search, type],
    queryFn: () =>
      apiRequest<Benefit[]>(
        `/benefits?search=${encodeURIComponent(search)}${type === 'ALL' ? '' : `&type=${type}`}`,
      ),
  });
  const enrollments = useQuery({
    enabled: Boolean(contractId),
    queryKey: ['benefit-enrollments', contractId],
    queryFn: () => apiRequest<Enrollment[]>(`/benefits/enrollments/${contractId}`),
  });
  const invalidateBenefits = () => void client.invalidateQueries({ queryKey: ['benefits'] });
  const createBenefit = useMutation({
    mutationFn: (values: BenefitValues) =>
      apiRequest('/benefits', { method: 'POST', body: JSON.stringify(values) }),
    onSuccess: () => {
      benefitForm.reset();
      invalidateBenefits();
    },
  });
  const createPlan = useMutation({
    mutationFn: ({ validTo, ...values }: PlanValues) =>
      apiRequest('/benefits/plans', {
        method: 'POST',
        body: JSON.stringify({
          ...values,
          copayAmount: values.copayAmount || undefined,
          validTo: validTo || undefined,
        }),
      }),
    onSuccess: () => {
      planForm.reset();
      invalidateBenefits();
    },
  });
  const createEnrollment = useMutation({
    mutationFn: ({ validTo, ...values }: EnrollmentValues) =>
      apiRequest('/benefits/enrollments', {
        method: 'POST',
        body: JSON.stringify({ ...values, validTo: validTo || undefined }),
      }),
    onSuccess: () => {
      enrollmentForm.reset();
      void client.invalidateQueries({ queryKey: ['benefit-enrollments'] });
    },
  });
  const changeEnrollment = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'SUSPENDED' | 'CANCELLED' }) =>
      apiRequest(`/benefits/enrollments/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          reason: 'Alteração demonstrativa registrada pela interface.',
        }),
      }),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['benefit-enrollments'] }),
  });
  const filtered = useMemo(() => benefits.data ?? [], [benefits.data]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visibleBenefits = useMemo(
    () => filtered.slice(page * pageSize, (page + 1) * pageSize),
    [filtered, page],
  );

  return (
    <section aria-labelledby="benefits-title">
      <PageHeader
        title="Benefícios"
        description="Ambiente demonstrativo: valores são parametrizações futuras para folha. Não há dados médicos, integração com operadoras, cálculo de desconto ou dados reais."
      />
      <section aria-labelledby="catalog-title">
        <h2 id="catalog-title">Catálogo por empresa</h2>
        <form onSubmit={benefitForm.handleSubmit((values) => createBenefit.mutate(values))}>
          <label>
            Identificador da empresa
            <input aria-describedby="company-error" {...benefitForm.register('companyId')} />
          </label>
          <FormError message={benefitForm.formState.errors.companyId?.message} />
          <label>
            Código
            <input {...benefitForm.register('code')} />
          </label>
          <FormError message={benefitForm.formState.errors.code?.message} />
          <label>
            Nome
            <input {...benefitForm.register('name')} />
          </label>
          <FormError message={benefitForm.formState.errors.name?.message} />
          <label>
            Tipo
            <select {...benefitForm.register('type')}>
              {Object.entries(typeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={createBenefit.isPending}>
            Criar benefício
          </button>
          {createBenefit.isError && <p role="alert">{createBenefit.error.message}</p>}
        </form>
        <div role="search">
          <label>
            Pesquisar catálogo
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(0);
              }}
            />
          </label>
          <label>
            Filtrar por tipo
            <select
              value={type}
              onChange={(event) => {
                setType(event.target.value as typeof type);
                setPage(0);
              }}
            >
              <option value="ALL">Todos</option>
              {Object.entries(typeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {benefits.isLoading ? (
          <p role="status">Carregando benefícios…</p>
        ) : benefits.isError ? (
          <p role="alert">{benefits.error.message}</p>
        ) : filtered.length === 0 ? (
          <p>Nenhum benefício demonstrativo encontrado.</p>
        ) : (
          <>
            <ul aria-label="Benefícios cadastrados">
              {visibleBenefits.map((item) => (
                <li key={item.id}>
                  <strong>
                    {item.code} — {item.name}
                  </strong>{' '}
                  ({typeLabels[item.type as BenefitValues['type']] ?? item.type}) ·{' '}
                  {item.plans.length} plano(s)
                  {item.plans.map((plan) => (
                    <div key={plan.id}>
                      Plano {plan.name}: empresa {plan.companyAmount}, colaborador{' '}
                      {plan.employeeAmount}, coparticipação {plan.copayAmount ?? 'não configurada'};
                      vigência {plan.validFrom} a {plan.validTo ?? 'em aberto'}.
                    </div>
                  ))}
                </li>
              ))}
            </ul>
            <nav aria-label="Paginação do catálogo">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((current) => current - 1)}
              >
                Anterior
              </button>
              <span>
                {' '}
                Página {page + 1} de {totalPages}{' '}
              </span>
              <button
                type="button"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Próxima
              </button>
            </nav>
          </>
        )}
      </section>
      <section aria-labelledby="plans-title">
        <h2 id="plans-title">Planos, elegibilidade e vigência</h2>
        <p>
          Um plano é vinculado ao catálogo da empresa; a elegibilidade é conferida pelo vínculo do
          contrato com essa empresa no momento da adesão.
        </p>
        <form onSubmit={planForm.handleSubmit((values) => createPlan.mutate(values))}>
          <label>
            Benefício
            <input {...planForm.register('benefitId')} />
          </label>
          <FormError message={planForm.formState.errors.benefitId?.message} />
          <label>
            Nome do plano
            <input {...planForm.register('name')} />
          </label>
          <FormError message={planForm.formState.errors.name?.message} />
          <label>
            Valor da empresa
            <input inputMode="decimal" {...planForm.register('companyAmount')} />
          </label>
          <FormError message={planForm.formState.errors.companyAmount?.message} />
          <label>
            Valor do colaborador
            <input inputMode="decimal" {...planForm.register('employeeAmount')} />
          </label>
          <FormError message={planForm.formState.errors.employeeAmount?.message} />
          <label>
            Coparticipação opcional
            <input inputMode="decimal" {...planForm.register('copayAmount')} />
          </label>
          <FormError message={planForm.formState.errors.copayAmount?.message} />
          <label>
            Início
            <input type="date" {...planForm.register('validFrom')} />
          </label>
          <FormError message={planForm.formState.errors.validFrom?.message} />
          <label>
            Fim opcional
            <input type="date" {...planForm.register('validTo')} />
          </label>
          <button type="submit" disabled={createPlan.isPending}>
            Criar plano
          </button>
          {createPlan.isError && <p role="alert">{createPlan.error.message}</p>}
        </form>
      </section>
      <section aria-labelledby="enrollments-title">
        <h2 id="enrollments-title">Adesões por colaborador</h2>
        <form onSubmit={enrollmentForm.handleSubmit((values) => createEnrollment.mutate(values))}>
          <label>
            Identificador do contrato
            <input {...enrollmentForm.register('employmentContractId')} />
          </label>
          <FormError message={enrollmentForm.formState.errors.employmentContractId?.message} />
          <label>
            Identificador do plano
            <input {...enrollmentForm.register('benefitPlanId')} />
          </label>
          <FormError message={enrollmentForm.formState.errors.benefitPlanId?.message} />
          <label>
            Início
            <input type="date" {...enrollmentForm.register('validFrom')} />
          </label>
          <FormError message={enrollmentForm.formState.errors.validFrom?.message} />
          <label>
            Fim opcional
            <input type="date" {...enrollmentForm.register('validTo')} />
          </label>
          <label>
            Justificativa opcional
            <input {...enrollmentForm.register('reason')} />
          </label>
          <button type="submit" disabled={createEnrollment.isPending}>
            Registrar adesão
          </button>
          {createEnrollment.isError && <p role="alert">{createEnrollment.error.message}</p>}
        </form>
        <label>
          Consultar adesões do contrato
          <input value={contractId} onChange={(event) => setContractId(event.target.value)} />
        </label>
        {enrollments.isLoading ? (
          <p role="status">Carregando adesões…</p>
        ) : enrollments.isError ? (
          <p role="alert">{enrollments.error.message}</p>
        ) : enrollments.data?.length ? (
          <ul aria-label="Adesões do contrato">
            {enrollments.data.map((item) => (
              <li key={item.id}>
                {item.benefitPlan.benefit.name} — {item.benefitPlan.name}; {item.status};{' '}
                {item.validFrom} a {item.validTo ?? 'em aberto'}{' '}
                {item.status === 'ACTIVE' && (
                  <>
                    <button
                      type="button"
                      onClick={() => changeEnrollment.mutate({ id: item.id, status: 'SUSPENDED' })}
                    >
                      Suspender
                    </button>
                    <button
                      type="button"
                      onClick={() => changeEnrollment.mutate({ id: item.id, status: 'CANCELLED' })}
                    >
                      Cancelar
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        ) : contractId ? (
          <p>Nenhuma adesão demonstrativa encontrada para o contrato.</p>
        ) : (
          <p>Informe um contrato para consultar adesões.</p>
        )}
        {changeEnrollment.isError && <p role="alert">{changeEnrollment.error.message}</p>}
      </section>
    </section>
  );
}

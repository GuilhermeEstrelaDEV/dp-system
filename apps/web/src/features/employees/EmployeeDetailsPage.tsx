import type {
  EmployeeContactContract,
  EmployeeContract,
  EmploymentContractContract,
} from '@dp-system/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link, useParams } from 'react-router-dom';
import { z } from 'zod';
import { PageHeader } from '@/components/common/PageHeader';
import { apiRequest } from '@/lib/api';

type Details = EmployeeContract & {
  contacts: EmployeeContactContract[];
  employmentContracts: EmploymentContractContract[];
};
const contactSchema = z.object({
  type: z.enum(['EMAIL', 'PHONE']),
  value: z.string().min(1, 'Contato é obrigatório'),
  isPrimary: z.boolean().optional(),
});
type ContactValues = z.infer<typeof contactSchema>;
export function EmployeeDetailsPage() {
  const { employeeId = '' } = useParams();
  const client = useQueryClient();
  const employee = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: () => apiRequest<Details>(`/employees/${employeeId}`),
  });
  const form = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { type: 'EMAIL', value: '', isPrimary: false },
  });
  const addContact = useMutation({
    mutationFn: (values: ContactValues) =>
      apiRequest(`/employees/${employeeId}/contacts`, {
        method: 'POST',
        body: JSON.stringify(values),
      }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['employee', employeeId] });
      form.reset();
    },
  });
  if (employee.isLoading) return <p role="status">Carregando colaborador…</p>;
  if (employee.isError) return <p role="alert">{employee.error.message}</p>;
  const item = employee.data!;
  return (
    <section aria-labelledby="employee-details-title">
      <PageHeader
        title={item.preferredName || item.legalName}
        description="Cadastro demonstrativo sem CPF, endereço, documentos, banco ou remuneração."
      />
      <p>Status: {item.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}</p>
      <p>
        <Link to={`/employees/${employeeId}/contracts`}>
          Ver e criar contratos deste colaborador
        </Link>
      </p>
      <section aria-labelledby="contacts-title" className="mt-6">
        <h2 id="contacts-title">Contatos</h2>
        <p>Use apenas dados fictícios em ambiente demonstrativo.</p>
        {item.contacts.length ? (
          <ul>
            {item.contacts.map((contact) => (
              <li key={contact.id}>
                {contact.type === 'EMAIL' ? 'E-mail' : 'Telefone'}: {contact.value}{' '}
                {contact.isPrimary ? '(principal)' : ''}
              </li>
            ))}
          </ul>
        ) : (
          <p>Nenhum contato cadastrado.</p>
        )}
        <form
          onSubmit={form.handleSubmit((values) => addContact.mutate(values))}
          className="mt-3 grid gap-3 rounded border p-4"
        >
          <label>
            Tipo
            <select className="mt-1 block w-full rounded border p-2" {...form.register('type')}>
              <option value="EMAIL">E-mail</option>
              <option value="PHONE">Telefone</option>
            </select>
          </label>
          <label>
            Contato
            <input className="mt-1 block w-full rounded border p-2" {...form.register('value')} />
            {form.formState.errors.value && (
              <span role="alert">{form.formState.errors.value.message}</span>
            )}
          </label>
          <label>
            <input type="checkbox" {...form.register('isPrimary')} /> Contato principal
          </label>
          <button type="submit">Adicionar contato</button>
        </form>
        {addContact.isError && <p role="alert">{addContact.error.message}</p>}
      </section>
      <section aria-labelledby="employee-contracts-title" className="mt-6">
        <h2 id="employee-contracts-title">Contratos</h2>
        {item.employmentContracts.length ? (
          <ul>
            {item.employmentContracts.map((contract) => (
              <li key={contract.id}>
                <Link to={`/contratos/${contract.id}`}>
                  Matrícula {contract.registrationNumber}
                </Link>{' '}
                — {contract.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
              </li>
            ))}
          </ul>
        ) : (
          <p>Nenhum contrato cadastrado.</p>
        )}
      </section>
    </section>
  );
}

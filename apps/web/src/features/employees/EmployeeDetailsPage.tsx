import type {
  EmployeeContactContract,
  EmployeeContract,
  EmploymentContractContract,
} from '@dp-system/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useParams } from 'react-router-dom';
import { z } from 'zod';
import { DataTable, DataTableActions, DataTableStatus } from '@/components/common/DataTable';
import { PageHeader } from '@/components/common/PageHeader';
import {
  Alert,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  FieldError,
  FormActions,
  FormSection,
  Input,
  LoadingState,
  Select,
} from '@/components/common/Primitives';
import { useOptionalAuth } from '@/features/auth/AuthContext';
import { apiRequest } from '@/lib/api';
import { EmployeeForm, type EmployeeValues } from './EmployeeForm';

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
  const auth = useOptionalAuth();
  const canManage = auth?.hasCapability('employee.manage') ?? true;
  const canManageContracts = auth?.hasCapability('contract.manage') ?? true;
  const { employeeId = '' } = useParams();
  const client = useQueryClient();
  const [editingEmployee, setEditingEmployee] = useState(false);
  const [editingContact, setEditingContact] = useState<EmployeeContactContract | null>(null);
  const [pendingContact, setPendingContact] = useState<EmployeeContactContract | null>(null);
  const contactValueErrorId = `${useId()}-contact-value-error`;
  const employee = useQuery({
    queryKey: ['employee', auth?.activeCompanyId, employeeId],
    queryFn: () => apiRequest<Details>(`/employees/${employeeId}`),
  });
  const contactForm = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { type: 'EMAIL', value: '', isPrimary: false },
  });
  const updateEmployee = useMutation({
    mutationFn: (values: EmployeeValues) =>
      apiRequest<Details>(`/employees/${employeeId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          legalName: values.legalName,
          ...(values.preferredName ? { preferredName: values.preferredName } : {}),
        }),
      }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['employee'] });
      void client.invalidateQueries({ queryKey: ['employees'] });
      setEditingEmployee(false);
    },
  });
  const saveContact = useMutation({
    mutationFn: (values: ContactValues) =>
      apiRequest(
        editingContact
          ? `/employees/${employeeId}/contacts/${editingContact.id}`
          : `/employees/${employeeId}/contacts`,
        {
          method: editingContact ? 'PATCH' : 'POST',
          body: JSON.stringify(values),
        },
      ),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['employee'] });
      setEditingContact(null);
      contactForm.reset({ type: 'EMAIL', value: '', isPrimary: false });
    },
  });
  const toggleContact = useMutation({
    mutationFn: (contact: EmployeeContactContract) =>
      apiRequest(
        `/employees/${employeeId}/contacts/${contact.id}/${contact.status === 'ACTIVE' ? 'inactivate' : 'activate'}`,
        { method: 'PATCH' },
      ),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['employee'] }),
  });

  if (employee.isLoading) return <LoadingState label="Carregando colaborador…" />;
  if (employee.isError)
    return <ErrorState message={employee.error.message} onRetry={() => void employee.refetch()} />;

  const item = employee.data!;
  const beginContactEdit = (contact: EmployeeContactContract) => {
    setEditingContact(contact);
    contactForm.reset({
      type: contact.type,
      value: contact.value,
      isPrimary: contact.isPrimary,
    });
  };

  return (
    <section aria-labelledby="employee-details-title">
      <PageHeader
        description="Cadastro demonstrativo sem CPF, endereço, documentos, banco ou remuneração."
        headingId="employee-details-title"
        title={item.preferredName || item.legalName}
      >
        {canManage ? (
          <Button onClick={() => setEditingEmployee(true)} type="button">
            Editar colaborador
          </Button>
        ) : null}
      </PageHeader>

      {editingEmployee ? (
        <EmployeeForm
          initialValues={{
            legalName: item.legalName,
            preferredName: item.preferredName ?? '',
          }}
          onCancel={() => setEditingEmployee(false)}
          onSubmit={(values) => updateEmployee.mutate(values)}
          pending={updateEmployee.isPending}
          submitLabel="Salvar alterações"
        />
      ) : null}
      {updateEmployee.isError ? <Alert tone="danger">{updateEmployee.error.message}</Alert> : null}
      {updateEmployee.isSuccess ? (
        <Alert tone="success">Colaborador atualizado com sucesso.</Alert>
      ) : null}

      <Card>
        <dl className="ui-details-list">
          <div>
            <dt>Nome legal</dt>
            <dd>{item.legalName}</dd>
          </div>
          <div>
            <dt>Nome preferencial</dt>
            <dd>{item.preferredName || 'Não informado'}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>
              <DataTableStatus active={item.status === 'ACTIVE'} />
            </dd>
          </div>
        </dl>
      </Card>

      <section aria-labelledby="contacts-title" className="mt-6">
        <h2 id="contacts-title">Contatos</h2>
        <p>Use apenas dados fictícios em ambiente demonstrativo.</p>
        {item.contacts.length ? (
          <DataTable label="Contatos do colaborador">
            <thead>
              <tr>
                <th scope="col">Tipo</th>
                <th scope="col">Contato</th>
                <th scope="col">Principal</th>
                <th scope="col">Status</th>
                {canManage ? <th scope="col">Ações</th> : null}
              </tr>
            </thead>
            <tbody>
              {item.contacts.map((contact) => (
                <tr key={contact.id}>
                  <td className="ui-table-cell--compact">
                    {contact.type === 'EMAIL' ? 'E-mail' : 'Telefone'}
                  </td>
                  <td>{contact.value}</td>
                  <td className="ui-table-cell--compact">{contact.isPrimary ? 'Sim' : 'Não'}</td>
                  <td className="ui-table-cell--compact">
                    <DataTableStatus active={contact.status === 'ACTIVE'} />
                  </td>
                  {canManage ? (
                    <td>
                      <DataTableActions>
                        <Button
                          onClick={() => beginContactEdit(contact)}
                          type="button"
                          variant="ghost"
                        >
                          Editar
                        </Button>
                        <Button
                          onClick={() => {
                            toggleContact.reset();
                            setPendingContact(contact);
                          }}
                          type="button"
                          variant="ghost"
                        >
                          {contact.status === 'ACTIVE' ? 'Inativar' : 'Ativar'}
                        </Button>
                      </DataTableActions>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </DataTable>
        ) : (
          <EmptyState
            description="Adicione um e-mail ou telefone fictício para este colaborador."
            title="Nenhum contato cadastrado"
          />
        )}

        {canManage ? (
          <form
            className="ui-form-card mt-4"
            onSubmit={contactForm.handleSubmit((values) => saveContact.mutate(values))}
          >
            <FormSection
              description="O contato fica restrito à empresa ativa e pode ser inativado sem perda de histórico."
              title={editingContact ? 'Editar contato' : 'Adicionar contato'}
            >
              <label className="ui-field">
                Tipo
                <Select {...contactForm.register('type')} aria-required="true">
                  <option value="EMAIL">E-mail</option>
                  <option value="PHONE">Telefone</option>
                </Select>
              </label>
              <label className="ui-field">
                <span>
                  Contato{' '}
                  <span aria-hidden="true" className="ui-required">
                    *
                  </span>
                </span>
                <Input
                  {...contactForm.register('value')}
                  aria-describedby={
                    contactForm.formState.errors.value ? contactValueErrorId : undefined
                  }
                  aria-invalid={Boolean(contactForm.formState.errors.value)}
                  aria-required="true"
                />
                <FieldError id={contactValueErrorId}>
                  {contactForm.formState.errors.value?.message}
                </FieldError>
              </label>
              <label className="ui-field">
                <span>Preferência</span>
                <span>
                  <input type="checkbox" {...contactForm.register('isPrimary')} /> Contato principal
                </span>
              </label>
            </FormSection>
            {saveContact.isError ? <Alert tone="danger">{saveContact.error.message}</Alert> : null}
            <FormActions>
              {editingContact ? (
                <Button
                  onClick={() => {
                    setEditingContact(null);
                    contactForm.reset({ type: 'EMAIL', value: '', isPrimary: false });
                  }}
                  type="button"
                  variant="secondary"
                >
                  Cancelar edição
                </Button>
              ) : null}
              <Button disabled={saveContact.isPending} type="submit">
                {saveContact.isPending
                  ? 'Salvando…'
                  : editingContact
                    ? 'Salvar contato'
                    : 'Adicionar contato'}
              </Button>
            </FormActions>
          </form>
        ) : null}
      </section>

      <section aria-labelledby="employee-contracts-title" className="mt-6">
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <h2 id="employee-contracts-title">Contratos</h2>
            <p>Vínculos de trabalho associados a este colaborador.</p>
          </div>
          {canManageContracts ? (
            <Link
              className="ui-button ui-button--primary"
              to={`/employees/${employeeId}/contracts`}
            >
              + Novo contrato
            </Link>
          ) : null}
        </div>
        {item.employmentContracts.length ? (
          <DataTable label="Contratos do colaborador">
            <thead>
              <tr>
                <th scope="col">Matrícula</th>
                <th scope="col">Status</th>
                <th scope="col">Ações</th>
              </tr>
            </thead>
            <tbody>
              {item.employmentContracts.map((contract) => (
                <tr key={contract.id}>
                  <td>{contract.registrationNumber}</td>
                  <td className="ui-table-cell--compact">
                    <DataTableStatus active={contract.status === 'ACTIVE'} />
                  </td>
                  <td>
                    <DataTableActions>
                      <Link className="ui-button ui-button--ghost" to={`/contratos/${contract.id}`}>
                        Detalhes
                      </Link>
                    </DataTableActions>
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        ) : (
          <EmptyState
            action={
              canManageContracts ? (
                <Link
                  className="ui-button ui-button--primary"
                  to={`/employees/${employeeId}/contracts`}
                >
                  + Novo contrato
                </Link>
              ) : undefined
            }
            description="Crie o primeiro vínculo deste colaborador."
            title="Nenhum contrato cadastrado"
          />
        )}
      </section>

      <ConfirmDialog
        confirmLabel={pendingContact?.status === 'ACTIVE' ? 'Inativar contato' : 'Ativar contato'}
        description="O contato permanecerá no histórico do colaborador."
        error={toggleContact.isError ? toggleContact.error.message : undefined}
        onCancel={() => {
          toggleContact.reset();
          setPendingContact(null);
        }}
        onConfirm={() => {
          if (!pendingContact) return;
          toggleContact.mutate(pendingContact, { onSuccess: () => setPendingContact(null) });
        }}
        open={Boolean(pendingContact)}
        pending={toggleContact.isPending}
        title="Confirmar alteração do contato"
      />
    </section>
  );
}

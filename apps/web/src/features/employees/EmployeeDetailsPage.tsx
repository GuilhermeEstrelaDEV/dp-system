import type {
  EmployeeAddressContract,
  EmployeeContactContract,
  EmployeeContract,
  EmployeeEmergencyContactContract,
  EmploymentContractContract,
  MaritalStatus,
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
import { EmployeeForm } from './EmployeeForm';
import { type EmployeeValues, toEmployeeProfilePayload } from './employee-profile';

type Details = EmployeeContract & {
  contacts: EmployeeContactContract[];
  address: EmployeeAddressContract | null;
  emergencyContact: EmployeeEmergencyContactContract | null;
  employmentContracts: Array<
    EmploymentContractContract & {
      company: { id: string; tradeName: string };
      branch: { id: string; name: string } | null;
      department: { id: string; name: string } | null;
      position: { id: string; name: string };
      costCenter: { id: string; name: string } | null;
    }
  >;
};

const maritalStatusLabels: Record<MaritalStatus, string> = {
  SINGLE: 'Solteiro(a)',
  MARRIED: 'Casado(a)',
  DIVORCED: 'Divorciado(a)',
  WIDOWED: 'Viúvo(a)',
  SEPARATED: 'Separado(a)',
  OTHER: 'Outro',
};

function displayDate(value: string | null | undefined): string {
  if (!value) return 'Não informado';
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(value));
}

function displayCpf(value: string | null | undefined): string {
  if (!value || value.length !== 11) return 'Não informado';
  return `***.***.${value.slice(6, 9)}-${value.slice(9)}`;
}

function displayAddress(address: EmployeeAddressContract | null): string {
  if (!address) return 'Não informado';
  const street = [address.street, address.number].filter(Boolean).join(', ');
  const locality = [address.district, address.city, address.state].filter(Boolean).join(' — ');
  return [street, address.complement, locality, address.postalCode, address.country]
    .filter(Boolean)
    .join(' · ');
}

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
        body: JSON.stringify(toEmployeeProfilePayload(values)),
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
  const activeContacts = item.contacts.filter((contact) => contact.status === 'ACTIVE');
  const primaryEmail =
    activeContacts.find((contact) => contact.type === 'EMAIL' && contact.isPrimary) ??
    activeContacts.find((contact) => contact.type === 'EMAIL');
  const primaryPhone =
    activeContacts.find((contact) => contact.type === 'PHONE' && contact.isPrimary) ??
    activeContacts.find((contact) => contact.type === 'PHONE');
  const secondaryPhone = activeContacts.find(
    (contact) => contact.type === 'PHONE' && contact.id !== primaryPhone?.id,
  );
  const currentContract =
    item.employmentContracts.find((contract) => contract.status === 'ACTIVE') ??
    item.employmentContracts[0];
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
        description="Perfil pessoal e contatos minimizados; dados contratuais permanecem no vínculo de trabalho."
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
            cpf: item.cpf ?? '',
            birthDate: item.birthDate?.slice(0, 10) ?? '',
            maritalStatus: item.maritalStatus ?? '',
            nationality: item.nationality ?? '',
            placeOfBirth: item.placeOfBirth ?? '',
            personalEmail: primaryEmail?.value ?? '',
            phone: primaryPhone?.value ?? '',
            secondaryPhone: secondaryPhone?.value ?? '',
            address: {
              postalCode: item.address?.postalCode ?? '',
              street: item.address?.street ?? '',
              number: item.address?.number ?? '',
              complement: item.address?.complement ?? '',
              district: item.address?.district ?? '',
              city: item.address?.city ?? '',
              state: item.address?.state ?? '',
              country: item.address?.country ?? 'Brasil',
            },
            emergencyContact: {
              name: item.emergencyContact?.name ?? '',
              relationship: item.emergencyContact?.relationship ?? '',
              phone: item.emergencyContact?.phone ?? '',
            },
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

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="employee-summary-title">
          <h2 className="mb-3" id="employee-summary-title">
            Resumo
          </h2>
          <Card className="ui-details-panel">
            <dl className="ui-details-list">
              <div>
                <dt>Nome de exibição</dt>
                <dd>{item.preferredName || item.legalName}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  <DataTableStatus active={item.status === 'ACTIVE'} />
                </dd>
              </div>
            </dl>
          </Card>
        </section>

        <section aria-labelledby="employee-personal-title">
          <h2 className="mb-3" id="employee-personal-title">
            Dados pessoais
          </h2>
          <Card className="ui-details-panel">
            <dl className="ui-details-list">
              <div>
                <dt>Nome completo</dt>
                <dd>{item.legalName}</dd>
              </div>
              <div>
                <dt>Nome preferido ou social</dt>
                <dd>{item.preferredName || 'Não informado'}</dd>
              </div>
              <div>
                <dt>CPF</dt>
                <dd>{displayCpf(item.cpf)}</dd>
              </div>
              <div>
                <dt>Data de nascimento</dt>
                <dd>{displayDate(item.birthDate)}</dd>
              </div>
              <div>
                <dt>Estado civil</dt>
                <dd>
                  {item.maritalStatus ? maritalStatusLabels[item.maritalStatus] : 'Não informado'}
                </dd>
              </div>
              <div>
                <dt>Nacionalidade</dt>
                <dd>{item.nationality || 'Não informado'}</dd>
              </div>
              <div>
                <dt>Naturalidade</dt>
                <dd>{item.placeOfBirth || 'Não informado'}</dd>
              </div>
            </dl>
          </Card>
        </section>

        <section aria-labelledby="employee-contact-summary-title">
          <h2 className="mb-3" id="employee-contact-summary-title">
            Contato
          </h2>
          <Card className="ui-details-panel">
            <dl className="ui-details-list">
              <div>
                <dt>E-mail pessoal</dt>
                <dd>{primaryEmail?.value || 'Não informado'}</dd>
              </div>
              <div>
                <dt>Telefone principal</dt>
                <dd>{primaryPhone?.value || 'Não informado'}</dd>
              </div>
              <div>
                <dt>Telefone secundário</dt>
                <dd>{secondaryPhone?.value || 'Não informado'}</dd>
              </div>
            </dl>
          </Card>
        </section>

        <section aria-labelledby="employee-address-title">
          <h2 className="mb-3" id="employee-address-title">
            Endereço
          </h2>
          <Card className="ui-details-panel">
            <p>{displayAddress(item.address)}</p>
          </Card>
        </section>

        <section aria-labelledby="employee-emergency-title">
          <h2 className="mb-3" id="employee-emergency-title">
            Contato de emergência
          </h2>
          <Card className="ui-details-panel">
            <dl className="ui-details-list">
              <div>
                <dt>Nome</dt>
                <dd>{item.emergencyContact?.name || 'Não informado'}</dd>
              </div>
              <div>
                <dt>Relação</dt>
                <dd>{item.emergencyContact?.relationship || 'Não informado'}</dd>
              </div>
              <div>
                <dt>Telefone</dt>
                <dd>{item.emergencyContact?.phone || 'Não informado'}</dd>
              </div>
            </dl>
          </Card>
        </section>

        <section aria-labelledby="employee-organization-title">
          <h2 className="mb-3" id="employee-organization-title">
            Organização
          </h2>
          <Card className="ui-details-panel">
            <dl className="ui-details-list">
              <div>
                <dt>Empresa</dt>
                <dd>{currentContract?.company?.tradeName || 'Sem vínculo'}</dd>
              </div>
              <div>
                <dt>Filial</dt>
                <dd>{currentContract?.branch?.name || 'Não informado'}</dd>
              </div>
              <div>
                <dt>Departamento</dt>
                <dd>{currentContract?.department?.name || 'Não informado'}</dd>
              </div>
              <div>
                <dt>Cargo</dt>
                <dd>{currentContract?.position?.name || 'Não informado'}</dd>
              </div>
              <div>
                <dt>Centro de custo</dt>
                <dd>{currentContract?.costCenter?.name || 'Não informado'}</dd>
              </div>
            </dl>
          </Card>
        </section>

        <section aria-labelledby="employee-current-contract-title">
          <h2 className="mb-3" id="employee-current-contract-title">
            Contrato atual
          </h2>
          <Card className="ui-details-panel">
            <dl className="ui-details-list">
              <div>
                <dt>Matrícula</dt>
                <dd>{currentContract?.registrationNumber || 'Sem vínculo'}</dd>
              </div>
              <div>
                <dt>Situação</dt>
                <dd>{currentContract?.status || 'Não informado'}</dd>
              </div>
            </dl>
          </Card>
        </section>

        <section aria-labelledby="employee-history-title">
          <h2 className="mb-3" id="employee-history-title">
            Histórico
          </h2>
          <Card className="ui-details-panel">
            <dl className="ui-details-list">
              <div>
                <dt>Cadastrado em</dt>
                <dd>{displayDate(item.createdAt)}</dd>
              </div>
              <div>
                <dt>Última atualização</dt>
                <dd>{displayDate(item.updatedAt)}</dd>
              </div>
            </dl>
          </Card>
        </section>
      </div>

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

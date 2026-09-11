import { zodResolver } from '@hookform/resolvers/zod';
import { useId } from 'react';
import { useForm } from 'react-hook-form';
import {
  Button,
  FormActions,
  FormField,
  FormSection,
  Input,
  Select,
} from '@/components/common/Primitives';
import {
  employeeDefaultValues,
  employeeSchema,
  formatCpf,
  formatPostalCode,
  maritalStatusOptions,
  stateOptions,
  type EmployeeValues,
} from './employee-profile';

interface EmployeeFormProps {
  initialValues?: Partial<EmployeeValues>;
  onSubmit: (values: EmployeeValues) => void;
  submitLabel?: string;
  onCancel?: () => void;
  pending?: boolean;
}

export function EmployeeForm({
  initialValues,
  onSubmit,
  submitLabel = 'Salvar',
  onCancel,
  pending = false,
}: EmployeeFormProps) {
  const formId = useId();
  const form = useForm<EmployeeValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      ...employeeDefaultValues,
      ...initialValues,
      address: { ...employeeDefaultValues.address, ...initialValues?.address },
      emergencyContact: {
        ...employeeDefaultValues.emergencyContact,
        ...initialValues?.emergencyContact,
      },
    },
  });
  const error = (path: keyof EmployeeValues) => form.formState.errors[path]?.message;

  return (
    <form className="ui-form-card" onSubmit={form.handleSubmit(onSubmit)}>
      <FormSection
        description="Identificação pessoal mínima necessária ao cadastro. Campos legados permanecem compatíveis."
        title="Dados pessoais"
      >
        <FormField error={error('legalName')} label="Nome completo" required>
          <Input
            {...form.register('legalName')}
            aria-invalid={Boolean(error('legalName'))}
            aria-required="true"
            autoComplete="name"
          />
        </FormField>
        <FormField error={error('preferredName')} label="Nome preferido ou social" optional>
          <Input {...form.register('preferredName')} autoComplete="nickname" />
        </FormField>
        <FormField
          error={error('cpf')}
          help="A máscara é somente visual; o CPF é armazenado com 11 dígitos."
          label="CPF"
          required
        >
          <Input
            {...form.register('cpf')}
            aria-invalid={Boolean(error('cpf'))}
            aria-required="true"
            inputMode="numeric"
            onChange={(event) =>
              form.setValue('cpf', formatCpf(event.target.value), { shouldValidate: true })
            }
            placeholder="000.000.000-00"
          />
        </FormField>
        <FormField error={error('birthDate')} label="Data de nascimento" required>
          <Input {...form.register('birthDate')} aria-required="true" type="date" />
        </FormField>
        <FormField error={error('maritalStatus')} label="Estado civil" optional>
          <Select {...form.register('maritalStatus')}>
            <option value="">Selecione</option>
            {maritalStatusOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField error={error('nationality')} label="Nacionalidade" optional>
          <Input {...form.register('nationality')} />
        </FormField>
        <FormField error={error('placeOfBirth')} label="Naturalidade" optional>
          <Input {...form.register('placeOfBirth')} />
        </FormField>
      </FormSection>

      <FormSection
        description="Contatos pessoais. E-mail e telefones continuam armazenados na relação de contatos."
        title="Contato"
      >
        <FormField error={error('personalEmail')} label="E-mail pessoal" optional>
          <Input {...form.register('personalEmail')} autoComplete="email" type="email" />
        </FormField>
        <FormField error={error('phone')} label="Telefone principal" optional>
          <Input {...form.register('phone')} autoComplete="tel" inputMode="tel" />
        </FormField>
        <FormField error={error('secondaryPhone')} label="Telefone secundário" optional>
          <Input {...form.register('secondaryPhone')} inputMode="tel" />
        </FormField>
      </FormSection>

      <FormSection
        description="Endereço estruturado, sem consulta externa de CEP nesta entrega."
        title="Endereço"
      >
        <FormField error={form.formState.errors.address?.postalCode?.message} label="CEP" optional>
          <Input
            {...form.register('address.postalCode')}
            inputMode="numeric"
            onChange={(event) =>
              form.setValue('address.postalCode', formatPostalCode(event.target.value), {
                shouldValidate: true,
              })
            }
            placeholder="00000-000"
          />
        </FormField>
        <FormField
          error={form.formState.errors.address?.street?.message}
          label="Logradouro"
          optional
        >
          <Input {...form.register('address.street')} autoComplete="street-address" />
        </FormField>
        <FormField error={form.formState.errors.address?.number?.message} label="Número" optional>
          <Input {...form.register('address.number')} />
        </FormField>
        <FormField
          error={form.formState.errors.address?.complement?.message}
          label="Complemento"
          optional
        >
          <Input {...form.register('address.complement')} />
        </FormField>
        <FormField error={form.formState.errors.address?.district?.message} label="Bairro" optional>
          <Input {...form.register('address.district')} />
        </FormField>
        <FormField error={form.formState.errors.address?.city?.message} label="Cidade" optional>
          <Input {...form.register('address.city')} autoComplete="address-level2" />
        </FormField>
        <FormField error={form.formState.errors.address?.state?.message} label="UF" optional>
          <Select {...form.register('address.state')} autoComplete="address-level1">
            <option value="">Selecione</option>
            {stateOptions.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField error={form.formState.errors.address?.country?.message} label="País" optional>
          <Input {...form.register('address.country')} autoComplete="country-name" />
        </FormField>
      </FormSection>

      <FormSection
        description="Opcional. Se iniciado, nome, relação e telefone devem ser informados em conjunto."
        title="Contato de emergência"
      >
        <FormField
          error={form.formState.errors.emergencyContact?.name?.message}
          label="Nome"
          optional
        >
          <Input {...form.register('emergencyContact.name')} />
        </FormField>
        <FormField
          error={form.formState.errors.emergencyContact?.relationship?.message}
          label="Relação ou parentesco"
          optional
        >
          <Input {...form.register('emergencyContact.relationship')} />
        </FormField>
        <FormField
          error={form.formState.errors.emergencyContact?.phone?.message}
          label="Telefone"
          optional
        >
          <Input {...form.register('emergencyContact.phone')} inputMode="tel" />
        </FormField>
      </FormSection>

      <FormActions>
        {onCancel ? (
          <Button disabled={pending} onClick={onCancel} type="button" variant="secondary">
            Cancelar
          </Button>
        ) : null}
        <Button disabled={pending} type="submit">
          {pending ? 'Salvando…' : submitLabel}
        </Button>
      </FormActions>
      <span className="sr-only" id={`${formId}-privacy-note`}>
        Dados pessoais restritos ao contexto empresarial autorizado.
      </span>
    </form>
  );
}

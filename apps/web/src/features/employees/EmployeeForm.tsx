import { zodResolver } from '@hookform/resolvers/zod';
import { useId } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button, FormActions, FormField, FormSection, Input } from '@/components/common/Primitives';

const employeeSchema = z.object({
  legalName: z.string().min(1, 'Nome legal é obrigatório').max(160),
  preferredName: z.string().max(160).optional(),
});
export type EmployeeValues = z.infer<typeof employeeSchema>;

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
  const currentPreferredName = initialValues?.preferredName?.trim() ?? '';
  const form = useForm<EmployeeValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: { legalName: '', preferredName: '', ...initialValues },
  });
  const legalNameError = form.formState.errors.legalName?.message;
  const preferredNameError = form.formState.errors.preferredName?.message;
  const legalNameErrorId = `${formId}-legal-name-error`;
  const preferredNameErrorId = `${formId}-preferred-name-error`;
  const preferredNameHelpId = `${formId}-preferred-name-help`;

  return (
    <form
      className="ui-form-card"
      onSubmit={form.handleSubmit((values) => {
        if (currentPreferredName && !values.preferredName?.trim()) {
          form.setError('preferredName', {
            type: 'manual',
            message:
              'A API atual não permite remover o nome preferencial. Informe outro valor ou cancele a edição.',
          });
          return;
        }
        onSubmit(values);
      })}
    >
      <FormSection
        description="Use somente informações fictícias no ambiente demonstrativo."
        title="Informações básicas"
      >
        <FormField error={legalNameError} errorId={legalNameErrorId} label="Nome legal" required>
          <Input
            {...form.register('legalName')}
            aria-describedby={legalNameError ? legalNameErrorId : undefined}
            aria-invalid={Boolean(legalNameError)}
            aria-required="true"
            autoComplete="off"
            placeholder="Nome completo do colaborador"
          />
        </FormField>
        <FormField
          error={preferredNameError}
          errorId={preferredNameErrorId}
          help={
            currentPreferredName
              ? 'O contrato atual aceita substituir, mas ainda não permite remover este valor.'
              : undefined
          }
          helpId={preferredNameHelpId}
          label="Nome social ou preferencial"
          optional={!currentPreferredName}
        >
          <Input
            {...form.register('preferredName')}
            aria-describedby={
              [
                currentPreferredName ? preferredNameHelpId : '',
                preferredNameError ? preferredNameErrorId : '',
              ]
                .filter(Boolean)
                .join(' ') || undefined
            }
            aria-invalid={Boolean(preferredNameError)}
            aria-required={Boolean(currentPreferredName)}
            autoComplete="off"
            placeholder="Como prefere ser chamado (opcional)"
          />
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
    </form>
  );
}

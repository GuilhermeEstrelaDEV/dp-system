import { zodResolver } from '@hookform/resolvers/zod';
import { useId } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { z } from 'zod';
import { Button, FormActions, FormField, FormSection, Input } from '@/components/common/Primitives';

const contractSchema = z.object({
  employeeId: z.string().uuid('Informe o ID do colaborador'),
  companyId: z.string().uuid('Informe o ID da empresa'),
  branchId: z.string().uuid().optional().or(z.literal('')),
  departmentId: z.string().uuid().optional().or(z.literal('')),
  positionId: z.string().uuid('Informe o ID do cargo'),
  costCenterId: z.string().uuid().optional().or(z.literal('')),
  registrationNumber: z.string().min(1, 'Matrícula é obrigatória').max(50),
  contractType: z.string().min(1, 'Tipo de contrato é obrigatório').max(50),
  employmentRegime: z.string().min(1, 'Regime é obrigatório').max(50),
  startDate: z.string().min(1, 'Data de início é obrigatória'),
  endDate: z.string().optional(),
  weeklyHours: z.coerce.number().int().min(1).max(168),
  reason: z.string().max(500).optional(),
});

export type ContractValues = z.infer<typeof contractSchema>;

interface ContractFormProps {
  readonly employeeId?: string;
  readonly companyId?: string;
  readonly initialValues?: Partial<ContractValues>;
  readonly onSubmit: (values: ContractValues) => void;
  readonly onCancel?: () => void;
  readonly pending?: boolean;
  readonly submitLabel?: string;
}

export function ContractForm({
  employeeId,
  companyId,
  initialValues,
  onSubmit,
  onCancel,
  pending = false,
  submitLabel = 'Salvar contrato',
}: ContractFormProps) {
  const formId = useId();
  const editing = Boolean(initialValues);
  const form = useForm<ContractValues>({
    resolver: zodResolver(contractSchema) as Resolver<ContractValues>,
    defaultValues: {
      employeeId: employeeId ?? '',
      companyId: companyId ?? '',
      branchId: '',
      departmentId: '',
      positionId: '',
      costCenterId: '',
      registrationNumber: '',
      contractType: '',
      employmentRegime: '',
      startDate: '',
      endDate: '',
      weeklyHours: 44,
      reason: '',
      ...initialValues,
    },
  });
  const fields: Array<[keyof ContractValues, string, 'text' | 'date' | 'number', boolean]> = [
    ['employeeId', 'ID do colaborador', 'text', true],
    ['companyId', 'ID da empresa', 'text', true],
    ['branchId', 'ID da filial', 'text', false],
    ['departmentId', 'ID do departamento', 'text', false],
    ['positionId', 'ID do cargo', 'text', true],
    ['costCenterId', 'ID do centro de custo', 'text', false],
    ['registrationNumber', 'Matrícula manual', 'text', true],
    ['contractType', 'Tipo de contrato', 'text', true],
    ['employmentRegime', 'Regime de trabalho', 'text', true],
    ['startDate', 'Data de início', 'date', true],
    ['endDate', 'Data final', 'date', false],
    ['weeklyHours', 'Carga horária semanal', 'number', true],
    ['reason', 'Motivo do registro', 'text', false],
  ];

  return (
    <form className="ui-form-card" onSubmit={form.handleSubmit(onSubmit)}>
      <FormSection
        description="O vínculo usa somente identificadores já autorizados. Campos opcionais podem permanecer vazios."
        title="Dados do vínculo"
      >
        {fields.map(([key, label, type, required]) => {
          const error = form.formState.errors[key]?.message;
          const errorId = `${formId}-${key}-error`;
          return (
            <FormField
              error={error}
              errorId={errorId}
              key={key}
              label={label}
              optional={!required}
              required={required}
            >
              <Input
                {...form.register(key)}
                aria-describedby={error ? errorId : undefined}
                aria-invalid={Boolean(error)}
                aria-required={required}
                readOnly={key === 'companyId' || (editing && key === 'employeeId')}
                type={type}
              />
            </FormField>
          );
        })}
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

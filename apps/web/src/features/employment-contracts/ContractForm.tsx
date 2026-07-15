import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type Resolver } from 'react-hook-form';
import { z } from 'zod';

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
export function ContractForm({
  employeeId,
  onSubmit,
}: {
  employeeId?: string;
  onSubmit: (values: ContractValues) => void;
}) {
  const form = useForm<ContractValues>({
    resolver: zodResolver(contractSchema) as Resolver<ContractValues>,
    defaultValues: {
      employeeId: employeeId ?? '',
      companyId: '',
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
    },
  });
  const fields: Array<[keyof ContractValues, string, 'text' | 'date' | 'number']> = [
    ['employeeId', 'ID do colaborador', 'text'],
    ['companyId', 'ID da empresa', 'text'],
    ['branchId', 'ID da filial (opcional)', 'text'],
    ['departmentId', 'ID do departamento (opcional)', 'text'],
    ['positionId', 'ID do cargo', 'text'],
    ['costCenterId', 'ID do centro de custo (opcional)', 'text'],
    ['registrationNumber', 'Matrícula manual', 'text'],
    ['contractType', 'Tipo de contrato', 'text'],
    ['employmentRegime', 'Regime de trabalho', 'text'],
    ['startDate', 'Data de início', 'date'],
    ['endDate', 'Data final (opcional)', 'date'],
    ['weeklyHours', 'Carga horária semanal', 'number'],
    ['reason', 'Motivo do registro (opcional)', 'text'],
  ];
  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="grid gap-3 rounded border border-slate-200 bg-white p-4 shadow-sm"
    >
      {fields.map(([key, label, type]) => (
        <label key={key}>
          {label}
          <input
            type={type}
            className="mt-1 block w-full rounded border p-2"
            {...form.register(key)}
          />
          {form.formState.errors[key] && (
            <span role="alert">{form.formState.errors[key]?.message}</span>
          )}
        </label>
      ))}
      <button type="submit">Salvar contrato</button>
    </form>
  );
}

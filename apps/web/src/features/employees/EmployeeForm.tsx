import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const employeeSchema = z.object({
  legalName: z.string().min(1, 'Nome legal é obrigatório').max(160),
  preferredName: z.string().max(160).optional(),
});
export type EmployeeValues = z.infer<typeof employeeSchema>;

interface EmployeeFormProps {
  initialValues?: Partial<EmployeeValues>;
  onSubmit: (values: EmployeeValues) => void;
  submitLabel?: string;
}

export function EmployeeForm({
  initialValues,
  onSubmit,
  submitLabel = 'Salvar',
}: EmployeeFormProps) {
  const form = useForm<EmployeeValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: { legalName: '', preferredName: '', ...initialValues },
  });
  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="grid gap-4 rounded border border-slate-200 bg-white p-4 shadow-sm"
    >
      <label>
        Nome legal
        <input className="mt-1 block w-full rounded border p-2" {...form.register('legalName')} />
        {form.formState.errors.legalName && (
          <span role="alert">{form.formState.errors.legalName.message}</span>
        )}
      </label>
      <label>
        Nome social ou preferencial (opcional)
        <input
          className="mt-1 block w-full rounded border p-2"
          {...form.register('preferredName')}
        />
      </label>
      <button type="submit">{submitLabel}</button>
    </form>
  );
}

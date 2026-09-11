import type { MaritalStatus } from '@dp-system/types';
import { z } from 'zod';

export const maritalStatusOptions = [
  ['SINGLE', 'Solteiro(a)'],
  ['MARRIED', 'Casado(a)'],
  ['DIVORCED', 'Divorciado(a)'],
  ['WIDOWED', 'Viúvo(a)'],
  ['SEPARATED', 'Separado(a)'],
  ['OTHER', 'Outro'],
] as const satisfies readonly (readonly [MaritalStatus, string])[];

export const stateOptions = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
] as const;

const optionalText = (maximum: number) => z.string().trim().max(maximum).optional();

export function normalizeCpf(value: string): string {
  return value.replace(/\D/gu, '');
}

export function isValidCpf(value: string): boolean {
  const cpf = normalizeCpf(value);
  if (!/^\d{11}$/u.test(cpf) || /^(\d)\1{10}$/u.test(cpf)) return false;
  const digit = (length: number) => {
    const sum = cpf
      .slice(0, length)
      .split('')
      .reduce((total, current, index) => total + Number(current) * (length + 1 - index), 0);
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };
  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
}

function isValidBirthDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) return false;
  const [yearText, monthText, dayText] = value.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));
  const today = new Date();
  const todayUtc = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day &&
    date <= todayUtc &&
    value >= '1900-01-01'
  );
}

function hasValidPhone(value: string): boolean {
  const digits = value.replace(/\D/gu, '');
  return digits.length >= 8 && digits.length <= 15;
}

export function formatCpf(value: string): string {
  const digits = normalizeCpf(value).slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/u, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/u, '$1.$2.$3')
    .replace(/(\d{3})(\d{1,2})$/u, '$1-$2');
}

export function formatPostalCode(value: string): string {
  return value
    .replace(/\D/gu, '')
    .slice(0, 8)
    .replace(/^(\d{5})(\d)/u, '$1-$2');
}

const phoneSchema = z
  .string()
  .trim()
  .max(30)
  .refine((value) => !value || hasValidPhone(value), 'Telefone deve conter entre 8 e 15 dígitos');

export const employeeSchema = z
  .object({
    legalName: z.string().trim().min(1, 'Nome completo é obrigatório').max(160),
    preferredName: optionalText(160),
    cpf: z.string().trim().min(1, 'CPF é obrigatório').refine(isValidCpf, 'CPF inválido'),
    birthDate: z
      .string()
      .min(1, 'Data de nascimento é obrigatória')
      .refine(isValidBirthDate, 'Informe uma data real, não futura e posterior a 1900-01-01'),
    maritalStatus: z
      .enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED', 'OTHER'])
      .or(z.literal('')),
    nationality: optionalText(80),
    placeOfBirth: optionalText(120),
    personalEmail: z.string().trim().email('Informe um e-mail válido').max(254).or(z.literal('')),
    phone: phoneSchema,
    secondaryPhone: phoneSchema,
    address: z.object({
      postalCode: z
        .string()
        .trim()
        .refine(
          (value) => !value || /^\d{8}$/u.test(value.replace(/\D/gu, '')),
          'CEP deve conter 8 dígitos',
        ),
      street: optionalText(160),
      number: optionalText(30),
      complement: optionalText(120),
      district: optionalText(120),
      city: optionalText(120),
      state: z
        .string()
        .refine(
          (value) => !value || stateOptions.includes(value as (typeof stateOptions)[number]),
          'UF inválida',
        ),
      country: optionalText(80),
    }),
    emergencyContact: z.object({
      name: optionalText(160),
      relationship: optionalText(80),
      phone: phoneSchema,
    }),
  })
  .superRefine((values, context) => {
    const contact = values.emergencyContact;
    const provided = Boolean(contact.name || contact.relationship || contact.phone);
    if (!provided) return;
    for (const [field, message] of [
      ['name', 'Informe o nome do contato de emergência'],
      ['relationship', 'Informe a relação com o colaborador'],
      ['phone', 'Informe o telefone do contato de emergência'],
    ] as const) {
      if (!contact[field]) {
        context.addIssue({ code: 'custom', path: ['emergencyContact', field], message });
      }
    }
  });

export type EmployeeValues = z.infer<typeof employeeSchema>;

export interface EmployeeProfilePayload {
  legalName: string;
  preferredName?: string;
  cpf: string;
  birthDate: string;
  maritalStatus?: MaritalStatus;
  nationality?: string;
  placeOfBirth?: string;
  personalEmail?: string;
  phone?: string;
  secondaryPhone?: string;
  address?: {
    postalCode?: string;
    street?: string;
    number?: string;
    complement?: string;
    district?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  emergencyContact?: { name: string; relationship: string; phone: string };
}

const present = (value: string | undefined) => value?.trim() || undefined;

export function toEmployeeProfilePayload(values: EmployeeValues): EmployeeProfilePayload {
  const address = {
    postalCode: present(values.address.postalCode)?.replace(/\D/gu, ''),
    street: present(values.address.street),
    number: present(values.address.number),
    complement: present(values.address.complement),
    district: present(values.address.district),
    city: present(values.address.city),
    state: present(values.address.state),
    country: present(values.address.country),
  };
  const hasAddress = Object.entries(address).some(
    ([key, value]) => key !== 'country' && value !== undefined,
  );
  const emergencyName = present(values.emergencyContact.name);
  const emergencyRelationship = present(values.emergencyContact.relationship);
  const emergencyPhone = present(values.emergencyContact.phone);
  return {
    legalName: values.legalName.trim(),
    ...(present(values.preferredName) ? { preferredName: present(values.preferredName) } : {}),
    cpf: normalizeCpf(values.cpf),
    birthDate: values.birthDate,
    ...(values.maritalStatus ? { maritalStatus: values.maritalStatus } : {}),
    ...(present(values.nationality) ? { nationality: present(values.nationality) } : {}),
    ...(present(values.placeOfBirth) ? { placeOfBirth: present(values.placeOfBirth) } : {}),
    ...(present(values.personalEmail) ? { personalEmail: present(values.personalEmail) } : {}),
    ...(present(values.phone) ? { phone: present(values.phone) } : {}),
    ...(present(values.secondaryPhone) ? { secondaryPhone: present(values.secondaryPhone) } : {}),
    ...(hasAddress ? { address } : {}),
    ...(emergencyName && emergencyRelationship && emergencyPhone
      ? {
          emergencyContact: {
            name: emergencyName,
            relationship: emergencyRelationship,
            phone: emergencyPhone,
          },
        }
      : {}),
  };
}

export const employeeDefaultValues: EmployeeValues = {
  legalName: '',
  preferredName: '',
  cpf: '',
  birthDate: '',
  maritalStatus: '',
  nationality: '',
  placeOfBirth: '',
  personalEmail: '',
  phone: '',
  secondaryPhone: '',
  address: {
    postalCode: '',
    street: '',
    number: '',
    complement: '',
    district: '',
    city: '',
    state: '',
    country: 'Brasil',
  },
  emergencyContact: { name: '', relationship: '', phone: '' },
};

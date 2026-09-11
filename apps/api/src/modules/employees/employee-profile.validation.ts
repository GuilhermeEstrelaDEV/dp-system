const MINIMUM_BIRTH_DATE = '1900-01-01';

export function normalizeCpf(value: string): string {
  return value.replace(/\D/gu, '');
}

export function isValidCpf(value: string): boolean {
  const cpf = normalizeCpf(value);
  if (!/^\d{11}$/u.test(cpf) || /^(\d)\1{10}$/u.test(cpf)) return false;

  const calculateDigit = (length: number): number => {
    const sum = cpf
      .slice(0, length)
      .split('')
      .reduce((total, digit, index) => total + Number(digit) * (length + 1 - index), 0);
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  return calculateDigit(9) === Number(cpf[9]) && calculateDigit(10) === Number(cpf[10]);
}

export function parseEmployeeBirthDate(value: string, today = new Date()): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) return null;
  const [yearText, monthText, dayText] = value.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  const todayUtc = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );
  if (date > todayUtc || value < MINIMUM_BIRTH_DATE) return null;
  return date;
}

export function normalizePhone(value: string): string {
  return value.replace(/\D/gu, '');
}

export function isValidPhone(value: string): boolean {
  const digits = normalizePhone(value);
  return digits.length >= 8 && digits.length <= 15;
}

export function normalizePostalCode(value: string): string {
  return value.replace(/\D/gu, '');
}

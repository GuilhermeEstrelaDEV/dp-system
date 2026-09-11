import { isValidCpf, normalizeCpf, parseEmployeeBirthDate } from './employee-profile.validation';

describe('employee profile validation', () => {
  it('normalizes and validates a CPF with correct check digits', () => {
    expect(normalizeCpf('529.982.247-25')).toBe('52998224725');
    expect(isValidCpf('529.982.247-25')).toBe(true);
  });

  it.each(['111.111.111-11', '529.982.247-24', '123'])('rejects invalid CPF %s', (cpf) => {
    expect(isValidCpf(cpf)).toBe(false);
  });

  it('accepts a real past date without introducing a minimum working age rule', () => {
    expect(parseEmployeeBirthDate('1990-02-28', new Date('2026-09-11T00:00:00.000Z'))).toEqual(
      new Date('1990-02-28T00:00:00.000Z'),
    );
  });

  it.each(['2030-01-01', '2025-02-30', '1899-12-31'])('rejects invalid birth date %s', (date) => {
    expect(parseEmployeeBirthDate(date, new Date('2026-09-11T00:00:00.000Z'))).toBeNull();
  });
});

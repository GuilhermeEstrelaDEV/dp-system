import { Injectable } from '@nestjs/common';

export type PayrollNature = 'EARNING' | 'DEDUCTION';
export type CalculationInput = {
  inputId: string;
  rubricId: string;
  rubricVersionId: string;
  amount: string;
  quantity: string | null;
  nature: PayrollNature;
};
export type CalculationItem = {
  rubricId: string;
  rubricVersionId: string;
  baseAmount: string;
  amount: string;
  memory: { inputIds: string[]; operation: 'SUM_INPUTS'; quantity: string | null };
};
export type EmployeeCalculation = {
  grossAmount: string;
  netAmount: string;
  items: CalculationItem[];
  memory: {
    earnings: string;
    deductions: string;
    rounding: 'HALF_AWAY_FROM_ZERO_2_DECIMALS';
  };
};

const decimalPattern = /^(-?)(\d+)(?:\.(\d{1,4}))?$/;

function toCents(value: string): bigint {
  const match = decimalPattern.exec(value);
  if (!match) throw new Error(`Invalid decimal value: ${value}`);
  const sign = match[1] ?? '';
  const whole = match[2] ?? '0';
  const fraction = match[3] ?? '';
  const padded = `${fraction}000`;
  let cents = BigInt(whole) * 100n + BigInt(padded.slice(0, 2));
  if (Number(padded[2]) >= 5) cents += 1n;
  return sign ? -cents : cents;
}

function fromCents(value: bigint): string {
  const sign = value < 0n ? '-' : '';
  const absolute = value < 0n ? -value : value;
  const digits = absolute.toString().padStart(3, '0');
  return `${sign}${digits.slice(0, -2)}.${digits.slice(-2)}`;
}

@Injectable()
export class PayrollCalculationService {
  calculate(inputs: CalculationInput[]): EmployeeCalculation {
    const grouped = new Map<string, CalculationInput[]>();
    for (const input of inputs) {
      const key = `${input.rubricId}:${input.rubricVersionId}`;
      grouped.set(key, [...(grouped.get(key) ?? []), input]);
    }
    let earnings = 0n;
    let deductions = 0n;
    const items = [...grouped.values()].map((group) => {
      const first = group[0];
      if (!first) throw new Error('Calculation group cannot be empty');
      const amount = group.reduce((total, input) => total + toCents(input.amount), 0n);
      if (first.nature === 'EARNING') earnings += amount;
      else deductions += amount;
      return {
        rubricId: first.rubricId,
        rubricVersionId: first.rubricVersionId,
        baseAmount: fromCents(amount),
        amount: fromCents(amount),
        memory: {
          inputIds: group.map((input) => input.inputId).sort(),
          operation: 'SUM_INPUTS' as const,
          quantity: group.length === 1 ? first.quantity : null,
        },
      };
    });
    return {
      grossAmount: fromCents(earnings),
      netAmount: fromCents(earnings - deductions),
      items,
      memory: {
        earnings: fromCents(earnings),
        deductions: fromCents(deductions),
        rounding: 'HALF_AWAY_FROM_ZERO_2_DECIMALS',
      },
    };
  }
}

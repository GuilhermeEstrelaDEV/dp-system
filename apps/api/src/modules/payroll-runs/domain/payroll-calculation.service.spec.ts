import { PayrollCalculationService } from './payroll-calculation.service';

describe('PayrollCalculationService', () => {
  const service = new PayrollCalculationService();

  it('aggregates configured earnings and deductions deterministically', () => {
    const result = service.calculate([
      {
        inputId: 'earning-2',
        rubricId: 'salary',
        rubricVersionId: 'salary-v1',
        amount: '1000.005',
        quantity: null,
        nature: 'EARNING',
      },
      {
        inputId: 'earning-1',
        rubricId: 'salary',
        rubricVersionId: 'salary-v1',
        amount: '250.00',
        quantity: null,
        nature: 'EARNING',
      },
      {
        inputId: 'deduction-1',
        rubricId: 'discount',
        rubricVersionId: 'discount-v1',
        amount: '50.00',
        quantity: '1',
        nature: 'DEDUCTION',
      },
    ]);

    expect(result).toEqual({
      grossAmount: '1250.01',
      netAmount: '1200.01',
      items: [
        expect.objectContaining({
          rubricId: 'salary',
          amount: '1250.01',
          memory: expect.objectContaining({ inputIds: ['earning-1', 'earning-2'] }),
        }),
        expect.objectContaining({ rubricId: 'discount', amount: '50.00' }),
      ],
      memory: {
        earnings: '1250.01',
        deductions: '50.00',
        rounding: 'HALF_AWAY_FROM_ZERO_2_DECIMALS',
      },
    });
  });

  it('returns zero totals for an employee without configured inputs', () => {
    expect(service.calculate([])).toEqual({
      grossAmount: '0.00',
      netAmount: '0.00',
      items: [],
      memory: {
        earnings: '0.00',
        deductions: '0.00',
        rounding: 'HALF_AWAY_FROM_ZERO_2_DECIMALS',
      },
    });
  });
});

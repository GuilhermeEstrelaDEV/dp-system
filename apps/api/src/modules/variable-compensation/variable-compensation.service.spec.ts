import { NotFoundException } from '@nestjs/common';
import { VariableCompensationService } from './variable-compensation.service';

describe('VariableCompensationService', () => {
  const prisma = {
    employmentContract: { findUnique: jest.fn() },
    payrollRun: { findUnique: jest.fn() },
    variableCompensationEvent: { findMany: jest.fn(), create: jest.fn() },
    salaryAdvance: { findMany: jest.fn(), create: jest.fn() },
    offCyclePayment: { findMany: jest.fn(), create: jest.fn() },
    payrollReconciliation: { findMany: jest.fn(), create: jest.fn() },
  };
  const service = new VariableCompensationService(prisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('creates a decimal variable compensation event for an existing contract', async () => {
    prisma.employmentContract.findUnique.mockResolvedValue({ id: 'contract' });
    prisma.variableCompensationEvent.create.mockResolvedValue({ id: 'event' });

    await service.createEvent({
      employmentContractId: 'contract',
      referencePeriod: '2026-07-01',
      type: 'COMMISSION',
      amount: '125.50',
      policyReference: 'Política pendente de homologação',
    });

    expect(prisma.variableCompensationEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        employmentContractId: 'contract',
        amount: expect.objectContaining({}),
        type: 'COMMISSION',
      }),
    });
  });

  it('rejects an advance when the contract does not exist', async () => {
    prisma.employmentContract.findUnique.mockResolvedValue(null);
    await expect(
      service.createAdvance({
        employmentContractId: 'missing',
        referencePeriod: '2026-07-01',
        amount: '100.00',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates an off-cycle payment without triggering payroll calculation', async () => {
    prisma.employmentContract.findUnique.mockResolvedValue({ id: 'contract' });
    prisma.offCyclePayment.create.mockResolvedValue({ id: 'payment' });
    await service.createOffCyclePayment({
      employmentContractId: 'contract',
      referencePeriod: '2026-07-01',
      amount: '80.00',
      reason: 'Registro administrativo demonstrativo',
    });
    expect(prisma.offCyclePayment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ reason: 'Registro administrativo demonstrativo' }),
    });
  });

  it('requires an existing payroll run for reconciliation', async () => {
    prisma.payrollRun.findUnique.mockResolvedValue(null);
    await expect(
      service.createReconciliation({
        payrollRunId: 'missing',
        type: 'MANUAL_COMPARISON',
        differenceAmount: '-10.00',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

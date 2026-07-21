import { ConflictException, NotFoundException } from '@nestjs/common';
import { PayrollCalculationService } from './domain/payroll-calculation.service';
import { PayrollRunsService } from './payroll-runs.service';

describe('PayrollRunsService', () => {
  const prisma = {
    payrollPeriod: { findUnique: jest.fn() },
    payrollInput: { findMany: jest.fn() },
    payrollRun: {
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    payrollRunEmployee: { create: jest.fn() },
    payrollCalculationItem: { createMany: jest.fn() },
    payrollRunMessage: { create: jest.fn(), count: jest.fn(), findMany: jest.fn() },
    $transaction: jest.fn(),
  };
  const service = new PayrollRunsService(prisma as never, new PayrollCalculationService());

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation((callback) => callback(prisma));
    prisma.payrollInput.findMany.mockResolvedValue([]);
    prisma.payrollRunMessage.count.mockResolvedValue(0);
    prisma.payrollRun.update.mockResolvedValue({ id: 'run', status: 'COMPLETED' });
  });

  it('rejects a missing period', async () => {
    prisma.payrollPeriod.findUnique.mockResolvedValue(null);
    await expect(
      service.start({ payrollPeriodId: 'period', engineVersion: 'calculation-v1' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects a closed period', async () => {
    prisma.payrollPeriod.findUnique.mockResolvedValue({ id: 'period', status: 'CLOSED' });
    await expect(
      service.start({ payrollPeriodId: 'period', engineVersion: 'calculation-v1' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects a concurrent run', async () => {
    prisma.payrollPeriod.findUnique.mockResolvedValue({ id: 'period', status: 'OPEN' });
    prisma.payrollRun.count.mockResolvedValue(1);
    await expect(
      service.start({ payrollPeriodId: 'period', engineVersion: 'calculation-v1' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('calculates employees and preserves the selected rubric version', async () => {
    const referenceDate = new Date('2026-07-01');
    prisma.payrollPeriod.findUnique.mockResolvedValue({
      id: 'period',
      status: 'OPEN',
      referenceDate,
    });
    prisma.payrollRun.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
    prisma.payrollRun.create.mockResolvedValue({ id: 'run' });
    prisma.payrollRunEmployee.create.mockResolvedValue({ id: 'run-employee' });
    prisma.payrollInput.findMany.mockResolvedValue([
      {
        id: 'input',
        employmentContractId: 'contract',
        payrollRubricId: 'rubric',
        amount: { toString: () => '1500.00' },
        quantity: null,
        payrollRubric: {
          code: 'BASE',
          payrollRubricCategory: { nature: 'EARNING' },
          versions: [{ id: 'version', status: 'ACTIVE', validFrom: referenceDate, validTo: null }],
        },
      },
    ]);

    await service.start({
      payrollPeriodId: 'period',
      engineVersion: 'calculation-v1',
      parameterSnapshotVersion: 'parameters-v1',
    });

    expect(prisma.payrollRunEmployee.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        employmentContractId: 'contract',
        status: 'CALCULATED',
        grossAmount: expect.objectContaining({}),
        netAmount: expect.objectContaining({}),
      }),
    });
    expect(prisma.payrollCalculationItem.createMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({ payrollRubricVersionId: 'version' })],
    });
    expect(prisma.payrollRun.update).toHaveBeenCalledWith({
      where: { id: 'run' },
      data: expect.objectContaining({ status: 'COMPLETED' }),
    });
  });

  it('fails safely when a rubric nature is unsupported', async () => {
    prisma.payrollPeriod.findUnique.mockResolvedValue({
      id: 'period',
      status: 'OPEN',
      referenceDate: new Date('2026-07-01'),
    });
    prisma.payrollRun.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
    prisma.payrollRun.create.mockResolvedValue({ id: 'run' });
    prisma.payrollInput.findMany.mockResolvedValue([
      { payrollRubric: { payrollRubricCategory: { nature: 'UNKNOWN' } } },
    ]);
    prisma.payrollRun.update.mockResolvedValue({ id: 'run', status: 'FAILED' });

    await service.start({ payrollPeriodId: 'period', engineVersion: 'calculation-v1' });

    expect(prisma.payrollRunMessage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        code: 'UNSUPPORTED_RUBRIC_NATURE',
        severity: 'BLOCKING_ERROR',
      }),
    });
    expect(prisma.payrollRun.update).toHaveBeenCalledWith({
      where: { id: 'run' },
      data: expect.objectContaining({ status: 'FAILED' }),
    });
  });
});

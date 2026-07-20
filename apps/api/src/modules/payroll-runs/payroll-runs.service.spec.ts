import { ConflictException, NotFoundException } from '@nestjs/common';
import { PayrollRunsService } from './payroll-runs.service';

describe('PayrollRunsService', () => {
  const prisma = {
    payrollPeriod: { findUnique: jest.fn() },
    payrollRun: { count: jest.fn(), create: jest.fn(), findUnique: jest.fn(), findMany: jest.fn() },
    payrollRunMessage: { create: jest.fn(), findMany: jest.fn() },
    $transaction: jest.fn(),
  };
  const service = new PayrollRunsService(prisma as never);
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation((callback) => callback(prisma));
  });
  it('rejects a missing period', async () => {
    prisma.payrollPeriod.findUnique.mockResolvedValue(null);
    await expect(
      service.start({ payrollPeriodId: 'period', engineVersion: 'foundation-1' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
  it('rejects a closed period', async () => {
    prisma.payrollPeriod.findUnique.mockResolvedValue({ id: 'period', status: 'CLOSED' });
    await expect(
      service.start({ payrollPeriodId: 'period', engineVersion: 'foundation-1' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
  it('rejects a concurrent run', async () => {
    prisma.payrollPeriod.findUnique.mockResolvedValue({ id: 'period', status: 'OPEN' });
    prisma.payrollRun.count.mockResolvedValue(1);
    await expect(
      service.start({ payrollPeriodId: 'period', engineVersion: 'foundation-1' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
  it('preserves engine and parameter versions and records the demonstrative warning', async () => {
    prisma.payrollPeriod.findUnique.mockResolvedValue({ id: 'period', status: 'OPEN' });
    prisma.payrollRun.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
    prisma.payrollRun.create.mockResolvedValue({ id: 'run' });
    await service.start({
      payrollPeriodId: 'period',
      engineVersion: 'engine-test',
      parameterSnapshotVersion: 'parameters-test',
    });
    expect(prisma.payrollRun.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        engineVersion: 'engine-test',
        parameterVersion: 'parameters-test',
        status: 'COMPLETED',
      }),
    });
    expect(prisma.payrollRunMessage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ code: 'DEMONSTRATIVE_RUN', severity: 'WARNING' }),
    });
  });
});

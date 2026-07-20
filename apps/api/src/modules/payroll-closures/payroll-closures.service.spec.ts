import { ConflictException, NotFoundException } from '@nestjs/common';
import { PayrollClosuresService } from './payroll-closures.service';

describe('PayrollClosuresService', () => {
  const prisma = {
    payrollPeriod: { findUnique: jest.fn(), update: jest.fn() },
    payrollRun: { findFirst: jest.fn() },
    payrollRunMessage: { count: jest.fn() },
    payrollPeriodClosure: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const service = new PayrollClosuresService(prisma as never);
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation((callback) => callback(prisma));
  });
  it('rejects closing a missing period', async () => {
    prisma.payrollPeriod.findUnique.mockResolvedValue(null);
    await expect(service.close({ payrollPeriodId: 'missing' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
  it('requires a completed technical run', async () => {
    prisma.payrollPeriod.findUnique.mockResolvedValue({ id: 'period', status: 'OPEN' });
    prisma.payrollRun.findFirst.mockResolvedValue(null);
    await expect(service.close({ payrollPeriodId: 'period' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
  it('rejects blocking errors', async () => {
    prisma.payrollPeriod.findUnique.mockResolvedValue({ id: 'period', status: 'OPEN' });
    prisma.payrollRun.findFirst.mockResolvedValue({ id: 'run' });
    prisma.payrollRunMessage.count.mockResolvedValue(1);
    await expect(service.close({ payrollPeriodId: 'period' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
  it('records closure history with versions', async () => {
    prisma.payrollPeriod.findUnique.mockResolvedValue({ id: 'period', status: 'OPEN' });
    prisma.payrollRun.findFirst.mockResolvedValue({
      id: 'run',
      engineVersion: 'engine',
      parameterVersion: 'parameters',
    });
    prisma.payrollRunMessage.count.mockResolvedValue(0);
    prisma.payrollPeriod.update.mockResolvedValue({
      engineVersion: 'engine',
      parameterVersion: 'parameters',
    });
    await service.close({ payrollPeriodId: 'period', reason: 'Fechamento demonstrativo' });
    expect(prisma.payrollPeriodClosure.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'CLOSED',
        engineVersion: 'engine',
        parameterVersion: 'parameters',
      }),
    });
  });
  it('requires a closed period for reopening', async () => {
    prisma.payrollPeriod.findUnique.mockResolvedValue({ id: 'period', status: 'OPEN' });
    await expect(
      service.reopen('period', { reason: 'Correção demonstrativa' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

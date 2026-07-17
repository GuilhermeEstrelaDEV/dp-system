import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PayrollPeriodsService } from './payroll-periods.service';
describe('PayrollPeriodsService', () => {
  const prisma = {
    payrollCalendar: { findUnique: jest.fn() },
    payrollPeriod: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    payrollRunMessage: { count: jest.fn() },
    payrollPeriodClosure: { create: jest.fn() },
    $transaction: jest.fn(),
  };
  const service = new PayrollPeriodsService(prisma as never);
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation((callback) => callback(prisma));
  });
  it('creates a valid period', async () => {
    prisma.payrollCalendar.findUnique.mockResolvedValue({ companyId: 'company' });
    prisma.payrollPeriod.create.mockResolvedValue({ id: 'period' });
    await service.create({
      companyId: 'company',
      payrollCalendarId: 'calendar',
      referenceDate: '2026-07-01',
    });
    expect(prisma.payrollPeriod.create).toHaveBeenCalled();
  });
  it('maps duplicate periods to conflict', async () => {
    prisma.payrollCalendar.findUnique.mockResolvedValue({ companyId: 'company' });
    prisma.payrollPeriod.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );
    await expect(
      service.create({
        companyId: 'company',
        payrollCalendarId: 'calendar',
        referenceDate: '2026-07-01',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
  it('rejects a closed period update', async () => {
    prisma.payrollPeriod.findUnique.mockResolvedValue({
      id: 'period',
      status: 'CLOSED',
      closureHistory: [],
    });
    await expect(service.update('period', {})).rejects.toBeInstanceOf(ConflictException);
  });
  it('returns 404 for a missing period', async () => {
    prisma.payrollPeriod.findUnique.mockResolvedValue(null);
    await expect(service.find('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});

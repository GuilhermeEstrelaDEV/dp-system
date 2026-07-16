import { ConflictException } from '@nestjs/common';
import { TimeManagementService } from './time-management.service';

describe('TimeManagementService', () => {
  const prisma = {
    company: { findUnique: jest.fn() },
    employmentContract: { findUnique: jest.fn() },
    workSchedule: { findUnique: jest.fn(), create: jest.fn(), findMany: jest.fn() },
    contractWorkSchedule: { create: jest.fn() },
    holiday: { create: jest.fn() },
    timeEntry: { create: jest.fn(), findMany: jest.fn() },
    timeBalanceEntry: { create: jest.fn(), findMany: jest.fn() },
    timeBalanceClosing: { findUnique: jest.fn(), upsert: jest.fn() },
    $transaction: jest.fn(),
  };
  const service = new TimeManagementService(prisma as never);
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation((callback) => callback(prisma));
  });
  it('requires a reason for a manual adjustment', async () => {
    prisma.employmentContract.findUnique.mockResolvedValue({
      id: 'contract',
      companyId: 'company',
      status: 'ACTIVE',
    });
    await expect(
      service.createEntry({
        employmentContractId: 'contract',
        occurredOn: '2026-07-01',
        type: 'ADJUSTMENT',
        minutes: 30,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
  it('creates an immutable balance movement from an occurrence', async () => {
    prisma.employmentContract.findUnique.mockResolvedValue({
      id: 'contract',
      companyId: 'company',
      status: 'ACTIVE',
    });
    prisma.timeBalanceClosing.findUnique.mockResolvedValue(null);
    prisma.timeEntry.create.mockResolvedValue({ id: 'event', occurredOn: new Date('2026-07-01') });
    await service.createEntry({
      employmentContractId: 'contract',
      occurredOn: '2026-07-01',
      type: 'OVERTIME',
      minutes: 60,
    });
    expect(prisma.timeBalanceEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ minutes: 60, timeEntryId: 'event' }),
      }),
    );
  });
  it('blocks changes to a closed competency', async () => {
    prisma.employmentContract.findUnique.mockResolvedValue({
      id: 'contract',
      companyId: 'company',
      status: 'ACTIVE',
    });
    prisma.timeBalanceClosing.findUnique.mockResolvedValue({ status: 'CLOSED' });
    await expect(
      service.createEntry({
        employmentContractId: 'contract',
        occurredOn: '2026-07-01',
        type: 'WORKED',
        minutes: 60,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

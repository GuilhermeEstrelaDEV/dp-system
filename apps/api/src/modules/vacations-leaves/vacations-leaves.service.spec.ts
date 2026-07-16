import { ConflictException } from '@nestjs/common';
import { VacationsLeavesService } from './vacations-leaves.service';

describe('VacationsLeavesService', () => {
  const prisma = {
    employmentContract: { findUnique: jest.fn() },
    vacationPeriod: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
    vacationRequest: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    vacationRequestHistory: { create: jest.fn() },
    collectiveVacation: { create: jest.fn() },
    leaveType: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
    leaveCase: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    leaveCaseHistory: { create: jest.fn() },
    $transaction: jest.fn(),
  };
  const service = new VacationsLeavesService(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation((callback) => callback(prisma));
  });

  it('rejects incoherent vacation period dates', async () => {
    await expect(
      service.createVacationPeriod({
        employmentContractId: 'contract',
        accrualStart: '2026-08-01',
        accrualEnd: '2026-07-31',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('blocks a vacation request that overlaps an open leave', async () => {
    prisma.vacationPeriod.findUnique.mockResolvedValue({
      id: 'period',
      employmentContractId: 'contract',
    });
    prisma.vacationRequest.findFirst.mockResolvedValue(null);
    prisma.leaveCase.findFirst.mockResolvedValue({ id: 'leave' });
    await expect(
      service.createVacationRequest({
        employmentContractId: 'contract',
        vacationPeriodId: 'period',
        startDate: '2026-08-01',
        endDate: '2026-08-10',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('records the return of an open leave', async () => {
    prisma.leaveCase.findUnique.mockResolvedValue({
      id: 'leave',
      status: 'OPEN',
      startDate: new Date('2026-08-01'),
    });
    prisma.leaveCase.update.mockResolvedValue({ id: 'leave', status: 'RETURNED' });
    await service.returnFromLeave('leave', {
      actualReturnDate: '2026-08-10',
      reason: 'Retorno demonstrativo',
    });
    expect(prisma.leaveCaseHistory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ leaveCaseId: 'leave', action: 'RETURNED' }),
    });
  });
});

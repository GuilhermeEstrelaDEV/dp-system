import { ConflictException } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { VacationsLeavesService } from './vacations-leaves.service';

describe('VacationsLeavesService', () => {
  const prisma = {
    employmentContract: { findUnique: jest.fn(), findFirst: jest.fn() },
    vacationPeriod: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn() },
    vacationRequest: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    vacationRequestHistory: { create: jest.fn() },
    collectiveVacation: { findFirst: jest.fn(), create: jest.fn() },
    leaveType: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn() },
    leaveCase: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    leaveCaseHistory: { create: jest.fn() },
    $transaction: jest.fn(),
  };
  const audit = {
    transaction: jest.fn((work: (tx: typeof prisma) => Promise<unknown>) => work(prisma)),
    append: jest.fn(),
  };
  const authorization = { requireCapability: jest.fn() };
  const principal = {
    actorId: 'actor',
    activeCompanyId: 'company',
    sessionId: 'session',
    traceId: 'trace',
    ipAddress: '127.0.0.1',
    userAgent: null,
    permissions: ['leave.read', 'leave.manage', 'vacation.read', 'vacation.manage'],
    accessGrants: [],
  } satisfies AuthenticatedPrincipal;
  const service = new VacationsLeavesService(
    prisma as never,
    audit as never,
    authorization as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation((callback) => callback(prisma));
  });

  it('rejects incoherent vacation period dates', async () => {
    await expect(
      service.createVacationPeriod(
        {
          employmentContractId: 'contract',
          accrualStart: '2026-08-01',
          accrualEnd: '2026-07-31',
        },
        principal,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('blocks a vacation request that overlaps an open leave', async () => {
    prisma.employmentContract.findFirst.mockResolvedValue({
      id: 'contract',
      companyId: 'company',
      status: 'ACTIVE',
    });
    prisma.vacationPeriod.findFirst.mockResolvedValue({
      id: 'period',
      employmentContractId: 'contract',
    });
    prisma.vacationRequest.findFirst.mockResolvedValue(null);
    prisma.leaveCase.findFirst.mockResolvedValue({ id: 'leave' });
    await expect(
      service.createVacationRequest(
        {
          employmentContractId: 'contract',
          vacationPeriodId: 'period',
          startDate: '2026-08-01',
          endDate: '2026-08-10',
        },
        principal,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('records and audits the return of a company-scoped open leave', async () => {
    prisma.leaveCase.findFirst.mockResolvedValue({
      id: 'leave',
      status: 'OPEN',
      startDate: new Date('2026-08-01'),
    });
    prisma.leaveCase.update.mockResolvedValue({ id: 'leave', status: 'RETURNED' });
    await service.returnFromLeave(
      'leave',
      { actualReturnDate: '2026-08-10', reason: 'Retorno demonstrativo' },
      principal,
    );
    expect(prisma.leaveCaseHistory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ leaveCaseId: 'leave', action: 'RETURNED' }),
    });
    expect(audit.append).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'LEAVE_CASE_RETURNED' }),
      prisma,
    );
  });

  it('creates a company-scoped vacation period with transactional audit', async () => {
    prisma.employmentContract.findFirst.mockResolvedValue({
      id: 'contract',
      companyId: 'company',
      status: 'ACTIVE',
    });
    prisma.vacationPeriod.create.mockResolvedValue({ id: 'period', status: 'OPEN' });
    await service.createVacationPeriod(
      {
        employmentContractId: 'contract',
        accrualStart: '2026-01-01',
        accrualEnd: '2026-12-31',
      },
      principal,
    );
    expect(audit.append).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'VACATION_PERIOD_CREATED', entityId: 'period' }),
      prisma,
    );
  });
});

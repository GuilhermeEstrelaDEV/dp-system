import { ConflictException, NotFoundException } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { TimeManagementService } from './time-management.service';

describe('TimeManagementService', () => {
  const prisma = {
    employmentContract: { findFirst: jest.fn() },
    workSchedule: { findFirst: jest.fn(), create: jest.fn(), findMany: jest.fn() },
    contractWorkSchedule: { create: jest.fn() },
    holiday: { create: jest.fn() },
    timeEntry: { create: jest.fn(), findMany: jest.fn() },
    timeBalanceEntry: { create: jest.fn(), findMany: jest.fn() },
    timeBalanceClosing: { findUnique: jest.fn(), upsert: jest.fn() },
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
    permissions: ['time.read', 'time.manage'],
    accessGrants: [],
  } satisfies AuthenticatedPrincipal;
  const service = new TimeManagementService(
    prisma as never,
    audit as never,
    authorization as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('requires a reason for a manual adjustment in the active company', async () => {
    prisma.employmentContract.findFirst.mockResolvedValue({
      id: 'contract',
      companyId: 'company',
      status: 'ACTIVE',
    });
    await expect(
      service.createEntry(
        {
          employmentContractId: 'contract',
          occurredOn: '2026-07-01',
          type: 'ADJUSTMENT',
          minutes: 30,
        },
        principal,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('creates a balance movement and transactional audit from an occurrence', async () => {
    prisma.employmentContract.findFirst.mockResolvedValue({
      id: 'contract',
      companyId: 'company',
      status: 'ACTIVE',
    });
    prisma.timeBalanceClosing.findUnique.mockResolvedValue(null);
    prisma.timeEntry.create.mockResolvedValue({
      id: 'event',
      status: 'PENDING',
      occurredOn: new Date('2026-07-01'),
    });
    await service.createEntry(
      {
        employmentContractId: 'contract',
        occurredOn: '2026-07-01',
        type: 'OVERTIME',
        minutes: 60,
      },
      principal,
    );
    expect(prisma.timeBalanceEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ minutes: 60, timeEntryId: 'event' }),
      }),
    );
    expect(audit.append).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'TIME_ENTRY_CREATED', entityId: 'event' }),
      prisma,
    );
  });

  it('blocks changes to a closed competency', async () => {
    prisma.employmentContract.findFirst.mockResolvedValue({
      id: 'contract',
      companyId: 'company',
      status: 'ACTIVE',
    });
    prisma.timeBalanceClosing.findUnique.mockResolvedValue({ status: 'CLOSED' });
    await expect(
      service.createEntry(
        {
          employmentContractId: 'contract',
          occurredOn: '2026-07-01',
          type: 'WORKED',
          minutes: 60,
        },
        principal,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns 404 semantics for a different requested company', () => {
    expect(() => service.schedules(principal, 'other-company')).toThrow(NotFoundException);
    expect(prisma.workSchedule.findMany).not.toHaveBeenCalled();
  });

  it('propagates an audit failure from the same transaction', async () => {
    prisma.employmentContract.findFirst.mockResolvedValue({
      id: 'contract',
      companyId: 'company',
      status: 'ACTIVE',
    });
    prisma.timeBalanceClosing.findUnique.mockResolvedValue(null);
    prisma.timeEntry.create.mockResolvedValue({ id: 'event', status: 'PENDING' });
    audit.append.mockRejectedValueOnce(new Error('audit unavailable'));
    await expect(
      service.createEntry(
        {
          employmentContractId: 'contract',
          occurredOn: '2026-07-01',
          type: 'WORKED',
          minutes: 60,
        },
        principal,
      ),
    ).rejects.toThrow('audit unavailable');
  });
});

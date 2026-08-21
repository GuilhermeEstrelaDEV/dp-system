import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { PayrollPeriodsService } from './payroll-periods.service';

describe('PayrollPeriodsService', () => {
  const principal: AuthenticatedPrincipal = {
    actorId: 'actor',
    activeCompanyId: 'company',
    sessionId: 'session',
    traceId: 'trace',
    ipAddress: '127.0.0.1',
    userAgent: 'test',
    permissions: ['payroll.period.close.view', 'payroll.period.manage'],
    accessGrants: [],
  };
  const prisma = {
    payrollCalendar: { findFirst: jest.fn() },
    payrollPeriod: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    payrollRunMessage: { count: jest.fn() },
    $transaction: jest.fn(),
  };
  const audit = { transaction: jest.fn(), append: jest.fn() };
  const authorization = { requireCapability: jest.fn() };
  const service = new PayrollPeriodsService(
    prisma as never,
    audit as never,
    authorization as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    audit.transaction.mockImplementation((callback) => callback(prisma));
  });

  it('creates and audits a valid company-scoped period', async () => {
    prisma.payrollCalendar.findFirst.mockResolvedValue({ id: 'calendar' });
    prisma.payrollPeriod.create.mockResolvedValue({
      id: 'period',
      status: 'OPEN',
      type: 'REGULAR',
    });
    await service.create(
      { companyId: 'company', payrollCalendarId: 'calendar', referenceDate: '2026-07-01' },
      principal,
    );
    expect(prisma.payrollCalendar.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'calendar', companyId: 'company' } }),
    );
    expect(audit.append).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PAYROLL_PERIOD_CREATED' }),
      prisma,
    );
  });

  it('maps duplicate periods to conflict', async () => {
    prisma.payrollCalendar.findFirst.mockResolvedValue({ id: 'calendar' });
    prisma.payrollPeriod.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );
    await expect(
      service.create(
        { companyId: 'company', payrollCalendarId: 'calendar', referenceDate: '2026-07-01' },
        principal,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects cross-company input without probing the calendar', async () => {
    await expect(
      service.create(
        { companyId: 'other', payrollCalendarId: 'calendar', referenceDate: '2026-07-01' },
        principal,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.payrollCalendar.findFirst).not.toHaveBeenCalled();
  });

  it('rejects a closed period update', async () => {
    prisma.payrollPeriod.findFirst.mockResolvedValue({ id: 'period', status: 'CLOSED' });
    await expect(service.update('period', {}, principal)).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns 404 for a period outside the active company', async () => {
    prisma.payrollPeriod.findFirst.mockResolvedValue(null);
    await expect(service.find('missing', principal)).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.payrollPeriod.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'missing', companyId: 'company' } }),
    );
  });
});

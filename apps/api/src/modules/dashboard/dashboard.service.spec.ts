import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  const companyFindFirst = jest.fn();
  const cycleGroupBy = jest.fn();
  const findingCount = jest.fn();
  const eventFindMany = jest.fn();
  const periodGroupBy = jest.fn();
  const service = new DashboardService({
    company: { findFirst: companyFindFirst },
    payrollReviewCycle: { groupBy: cycleGroupBy },
    payrollReviewFinding: { count: findingCount },
    payrollReviewEvent: { findMany: eventFindMany },
    payrollPeriod: { groupBy: periodGroupBy },
  } as unknown as PrismaService);
  const principal = (companyId: string | null, permissions: string[]): AuthenticatedPrincipal => ({
    actorId: 'user-1',
    activeCompanyId: companyId,
    permissions,
    traceId: 'trace',
    sessionId: 'session',
    ipAddress: '127.0.0.1',
    userAgent: 'test',
    accessGrants: [],
  });

  beforeEach(() => {
    jest.clearAllMocks();
    companyFindFirst.mockResolvedValue({ id: 'company-a', tradeName: 'Empresa A' });
    cycleGroupBy.mockResolvedValue([{ status: 'OPEN', _count: { _all: 2 } }]);
    findingCount.mockResolvedValue(1);
    eventFindMany.mockResolvedValue([
      { eventType: 'REVIEW_STARTED', occurredAt: new Date('2026-07-10T12:00:00Z') },
    ]);
    periodGroupBy.mockResolvedValue([{ status: 'OPEN', _count: { _all: 3 } }]);
  });

  it('requires an active company', async () => {
    await expect(service.summary(principal(null, []))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns a restricted contract and executes no metric query without capabilities', async () => {
    await expect(service.summary(principal('company-a', []))).resolves.toMatchObject({
      access: 'RESTRICTED',
      context: { companyId: 'company-a' },
    });
    expect(cycleGroupBy).not.toHaveBeenCalled();
    expect(periodGroupBy).not.toHaveBeenCalled();
  });

  it('scopes review metrics, timeline and activity to the active company', async () => {
    const result = await service.summary(
      principal('company-a', ['payroll.review.view']),
      new Date('2026-07-30T15:00:00Z'),
    );
    expect(result.review?.metrics.map(({ value }) => value)).toEqual([2, 1]);
    expect(result.review?.sixMonthTimeline).toHaveLength(6);
    expect(result.review?.sixMonthTimeline.at(-1)).toMatchObject({ key: '2026-07', value: 1 });
    expect(result.review?.recentActivity[0]).not.toHaveProperty('actorId');
    expect(cycleGroupBy).toHaveBeenCalledWith(
      expect.objectContaining({ where: { companyId: 'company-a' } }),
    );
  });

  it('scopes payroll period aggregation independently', async () => {
    const result = await service.summary(principal('company-a', ['payroll.period.close.view']));
    expect(result.payrollPeriod?.metrics[0]?.value).toBe(3);
    expect(result.review).toBeUndefined();
    expect(periodGroupBy).toHaveBeenCalledWith(
      expect.objectContaining({ where: { companyId: 'company-a' } }),
    );
  });

  it('returns zero only from an objectively empty aggregate', async () => {
    cycleGroupBy.mockResolvedValue([]);
    findingCount.mockResolvedValue(0);
    eventFindMany.mockResolvedValue([]);
    const result = await service.summary(principal('company-a', ['payroll.review.view']));
    expect(result.review?.metrics.map(({ value }) => value)).toEqual([0, 0]);
    expect(result.review?.recentActivity).toEqual([]);
  });

  it('does not expose another or inactive company', async () => {
    companyFindFirst.mockResolvedValue(null);
    await expect(
      service.summary(principal('company-b', ['payroll.review.view'])),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

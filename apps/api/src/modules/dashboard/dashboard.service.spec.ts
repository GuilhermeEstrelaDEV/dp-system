import { NotFoundException } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { createActiveCompanyContext } from '../auth/active-company-context';
import { EnterpriseScopeFactory } from '../auth/enterprise-scope';
import type { DashboardRepository } from './dashboard.repository';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  const companyFindFirst = jest.fn();
  const cycleGroupBy = jest.fn();
  const findingCount = jest.fn();
  const eventFindMany = jest.fn();
  const periodGroupBy = jest.fn();
  const service = new DashboardService({
    findActiveCompany: companyFindFirst,
    reviewStatusCounts: cycleGroupBy,
    openFindingCount: findingCount,
    reviewEvents: eventFindMany,
    payrollPeriodStatusCounts: periodGroupBy,
  } as unknown as DashboardRepository);
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
  const scope = (value: AuthenticatedPrincipal) =>
    new EnterpriseScopeFactory().create(
      createActiveCompanyContext({
        userId: value.actorId,
        companyId: value.activeCompanyId!,
        assignmentIds: ['assignment'],
        selectionSource: 'SESSION_TOKEN',
        resolvedAt: '2026-08-03T00:00:00.000Z',
      }),
      value,
    );

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

  it('returns a restricted contract and executes no metric query without capabilities', async () => {
    const actor = principal('company-a', []);
    await expect(service.summary(scope(actor), actor)).resolves.toMatchObject({
      access: 'RESTRICTED',
      context: { companyId: 'company-a' },
    });
    expect(cycleGroupBy).not.toHaveBeenCalled();
    expect(periodGroupBy).not.toHaveBeenCalled();
  });

  it('scopes review metrics, timeline and activity to the active company', async () => {
    const result = await service.summary(
      scope(principal('company-a', ['payroll.review.view'])),
      principal('company-a', ['payroll.review.view']),
      new Date('2026-07-30T15:00:00Z'),
    );
    expect(result.review?.metrics.map(({ value }) => value)).toEqual([2, 1]);
    expect(result.review?.sixMonthTimeline).toHaveLength(6);
    expect(result.review?.sixMonthTimeline.at(-1)).toMatchObject({ key: '2026-07', value: 1 });
    expect(result.review?.recentActivity[0]).not.toHaveProperty('actorId');
    expect(cycleGroupBy).toHaveBeenCalledWith(expect.objectContaining({ companyId: 'company-a' }));
  });

  it('scopes payroll period aggregation independently', async () => {
    const actor = principal('company-a', ['payroll.period.close.view']);
    const result = await service.summary(scope(actor), actor);
    expect(result.payrollPeriod?.metrics[0]?.value).toBe(3);
    expect(result.review).toBeUndefined();
    expect(periodGroupBy).toHaveBeenCalledWith(expect.objectContaining({ companyId: 'company-a' }));
  });

  it('returns zero only from an objectively empty aggregate', async () => {
    cycleGroupBy.mockResolvedValue([]);
    findingCount.mockResolvedValue(0);
    eventFindMany.mockResolvedValue([]);
    const actor = principal('company-a', ['payroll.review.view']);
    const result = await service.summary(scope(actor), actor);
    expect(result.review?.metrics.map(({ value }) => value)).toEqual([0, 0]);
    expect(result.review?.recentActivity).toEqual([]);
  });

  it('does not expose another or inactive company', async () => {
    companyFindFirst.mockResolvedValue(null);
    await expect(
      service.summary(
        scope(principal('company-b', ['payroll.review.view'])),
        principal('company-b', ['payroll.review.view']),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

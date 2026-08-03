import type { PrismaService } from '../../prisma/prisma.service';
import { createActiveCompanyContext } from '../auth/active-company-context';
import { EnterpriseScopeFactory } from '../auth/enterprise-scope';
import type { AuthenticatedPrincipal } from '../auth/identity-context';
import { DashboardRepository } from './dashboard.repository';

describe('DashboardRepository', () => {
  const companyFindFirst = jest.fn();
  const cycleGroupBy = jest.fn();
  const findingCount = jest.fn();
  const eventFindMany = jest.fn();
  const periodGroupBy = jest.fn();
  const repository = new DashboardRepository({
    company: { findFirst: companyFindFirst },
    payrollReviewCycle: { groupBy: cycleGroupBy },
    payrollReviewFinding: { count: findingCount },
    payrollReviewEvent: { findMany: eventFindMany },
    payrollPeriod: { groupBy: periodGroupBy },
  } as unknown as PrismaService);
  const principal: AuthenticatedPrincipal = {
    actorId: 'actor-a',
    activeCompanyId: 'company-a',
    permissions: [],
    traceId: 'trace-a',
    sessionId: 'session-a',
    ipAddress: '127.0.0.1',
    userAgent: 'test',
    accessGrants: [],
  };
  const scope = new EnterpriseScopeFactory().create(
    createActiveCompanyContext({
      userId: principal.actorId,
      companyId: principal.activeCompanyId!,
      assignmentIds: ['assignment-a'],
      selectionSource: 'SESSION_TOKEN',
      resolvedAt: '2026-08-03T00:00:00.000Z',
    }),
    principal,
  );

  beforeEach(() => jest.clearAllMocks());

  it('applies the enterprise predicate to company detail and every aggregate', async () => {
    companyFindFirst.mockResolvedValue({ id: 'company-a', tradeName: 'Horizonte' });
    cycleGroupBy.mockResolvedValue([]);
    findingCount.mockResolvedValue(0);
    eventFindMany.mockResolvedValue([]);
    periodGroupBy.mockResolvedValue([]);
    await Promise.all([
      repository.findActiveCompany(scope),
      repository.reviewStatusCounts(scope),
      repository.openFindingCount(scope),
      repository.reviewEvents(
        scope,
        new Date('2026-01-01T00:00:00.000Z'),
        new Date('2026-02-01T00:00:00.000Z'),
      ),
      repository.payrollPeriodStatusCounts(scope),
    ]);
    expect(companyFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'company-a', status: 'ACTIVE' } }),
    );
    expect(cycleGroupBy).toHaveBeenCalledWith(
      expect.objectContaining({ where: { companyId: 'company-a' } }),
    );
    expect(findingCount).toHaveBeenCalledWith({
      where: { companyId: 'company-a', status: 'OPEN' },
    });
    expect(eventFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ companyId: 'company-a' }) }),
    );
    expect(periodGroupBy).toHaveBeenCalledWith(
      expect.objectContaining({ where: { companyId: 'company-a' } }),
    );
  });
});

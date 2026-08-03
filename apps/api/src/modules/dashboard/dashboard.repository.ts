import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { EnterpriseScope } from '../auth/enterprise-scope';

@Injectable()
export class DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActiveCompany(scope: EnterpriseScope) {
    return this.prisma.company.findFirst({
      where: { id: scope.companyId, status: 'ACTIVE' },
      select: { id: true, tradeName: true },
    });
  }

  reviewStatusCounts(scope: EnterpriseScope) {
    return this.prisma.payrollReviewCycle.groupBy({
      by: ['status'],
      where: { companyId: scope.companyId },
      _count: { _all: true },
      orderBy: { status: 'asc' },
    });
  }

  openFindingCount(scope: EnterpriseScope) {
    return this.prisma.payrollReviewFinding.count({
      where: { companyId: scope.companyId, status: 'OPEN' },
    });
  }

  reviewEvents(scope: EnterpriseScope, start: Date, end: Date) {
    return this.prisma.payrollReviewEvent.findMany({
      where: { companyId: scope.companyId, occurredAt: { gte: start, lt: end } },
      select: { eventType: true, occurredAt: true },
      orderBy: { occurredAt: 'desc' },
    });
  }

  payrollPeriodStatusCounts(scope: EnterpriseScope) {
    return this.prisma.payrollPeriod.groupBy({
      by: ['status'],
      where: { companyId: scope.companyId },
      _count: { _all: true },
      orderBy: { status: 'asc' },
    });
  }
}

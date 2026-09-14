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

  activeEmployeeCount(scope: EnterpriseScope) {
    return this.prisma.employee.count({
      where: {
        status: 'ACTIVE',
        employmentContracts: { some: { companyId: scope.companyId } },
      },
    });
  }

  activeContractCount(scope: EnterpriseScope) {
    return this.prisma.employmentContract.count({
      where: { companyId: scope.companyId, status: 'ACTIVE' },
    });
  }

  pendingAdmissionCount(scope: EnterpriseScope) {
    return this.prisma.admissionProcess.count({
      where: { companyId: scope.companyId, status: { in: ['DRAFT', 'IN_PROGRESS', 'PENDING'] } },
    });
  }

  activeLeaveCount(scope: EnterpriseScope) {
    return this.prisma.leaveCase.count({
      where: { employmentContract: { companyId: scope.companyId }, status: 'OPEN' },
    });
  }

  upcomingVacationCount(scope: EnterpriseScope, start: Date, end: Date) {
    return this.prisma.vacationRequest.count({
      where: {
        employmentContract: { companyId: scope.companyId },
        status: 'APPROVED',
        startDate: { gte: start, lt: end },
      },
    });
  }

  activeBenefitCount(scope: EnterpriseScope) {
    return this.prisma.benefit.count({
      where: { companyId: scope.companyId, status: 'ACTIVE' },
    });
  }

  activePayrollRunCount(scope: EnterpriseScope) {
    return this.prisma.payrollRun.count({
      where: {
        payrollPeriod: { companyId: scope.companyId },
        status: { in: ['DRAFT', 'RUNNING'] },
      },
    });
  }

  pendingReviewCount(scope: EnterpriseScope) {
    return this.prisma.payrollReviewCycle.count({
      where: {
        companyId: scope.companyId,
        status: { in: ['OPEN', 'IN_REVIEW', 'SUBMITTED', 'REJECTED'] },
      },
    });
  }
}

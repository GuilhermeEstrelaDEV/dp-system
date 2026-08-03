import { Injectable, NotFoundException } from '@nestjs/common';
import type { PayrollReviewEventType } from '@prisma/client';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import type { EnterpriseScope } from '../auth/enterprise-scope';
import { DashboardRepository } from './dashboard.repository';
import type { DashboardDataPoint, DashboardSummary } from './dashboard.types';

const eventLabels: Record<PayrollReviewEventType, string> = {
  REVIEW_CYCLE_OPENED: 'Ciclo de conferência aberto',
  FINDING_OPENED: 'Achado de conferência criado',
  FINDING_RESOLVED: 'Achado de conferência resolvido',
  FINDING_REOPENED: 'Achado de conferência reaberto',
  REVIEW_STARTED: 'Conferência iniciada',
  REVIEW_SUBMITTED: 'Conferência submetida',
  REVIEW_APPROVED: 'Conferência aprovada',
  REVIEW_REJECTED: 'Conferência rejeitada',
  FINDING_BLOCKED: 'Achado marcado como bloqueante',
  FINDING_UNBLOCKED: 'Bloqueio de achado removido',
  REVIEW_CLOSED: 'Conferência encerrada',
  REVIEW_REOPENED: 'Conferência reaberta',
  APPROVALS_INVALIDATED: 'Decisões anteriores invalidadas',
};

@Injectable()
export class DashboardService {
  constructor(private readonly repository: DashboardRepository) {}

  async summary(
    scope: EnterpriseScope,
    principal: AuthenticatedPrincipal,
    now = new Date(),
  ): Promise<DashboardSummary> {
    const canViewReviews = principal.permissions.includes('payroll.review.view');
    const canViewPeriods = principal.permissions.includes('payroll.period.close.view');
    const company = await this.repository.findActiveCompany(scope);
    if (!company) throw new NotFoundException('Empresa não encontrada');

    const result: DashboardSummary = {
      context: {
        companyId: company.id,
        companyName: company.tradeName,
        generatedAt: now.toISOString(),
        timezone: 'UTC',
      },
      access: canViewReviews || canViewPeriods ? 'AVAILABLE' : 'RESTRICTED',
    };
    if (canViewReviews) result.review = await this.reviewSummary(scope, now);
    if (canViewPeriods) result.payrollPeriod = await this.periodSummary(scope);
    return result;
  }

  private async reviewSummary(scope: EnterpriseScope, now: Date) {
    const months = this.lastSixMonths(now);
    const [cycles, openFindings, events] = await Promise.all([
      this.repository.reviewStatusCounts(scope),
      this.repository.openFindingCount(scope),
      this.repository.reviewEvents(scope, months[0]!.start, months[5]!.end),
    ]);
    const total = cycles.reduce((sum, item) => sum + item._count._all, 0);
    const timeline = new Map(months.map(({ key }) => [key, 0]));
    for (const event of events) {
      const key = event.occurredAt.toISOString().slice(0, 7);
      timeline.set(key, (timeline.get(key) ?? 0) + 1);
    }
    return {
      metrics: [
        {
          value: total,
          label: 'Ciclos de conferência',
          description: 'Total registrado na empresa ativa.',
        },
        {
          value: openFindings,
          label: 'Achados abertos',
          description: 'Achados com status OPEN na empresa ativa.',
        },
      ],
      statusDistribution: cycles.map(({ status, _count }) => ({
        key: status,
        label: status,
        value: _count._all,
      })),
      sixMonthTimeline: months.map(({ key, label }) => ({
        key,
        label,
        value: timeline.get(key) ?? 0,
      })),
      recentActivity: events.slice(0, 5).map((event) => ({
        type: event.eventType,
        occurredAt: event.occurredAt.toISOString(),
        description: eventLabels[event.eventType],
      })),
    };
  }

  private async periodSummary(scope: EnterpriseScope) {
    const periods = await this.repository.payrollPeriodStatusCounts(scope);
    const total = periods.reduce((sum, item) => sum + item._count._all, 0);
    return {
      metrics: [
        {
          value: total,
          label: 'Competências de folha',
          description: 'Total registrado na empresa ativa.',
        },
      ],
      statusDistribution: periods.map(({ status, _count }) => ({
        key: status,
        label: status,
        value: _count._all,
      })),
    };
  }

  private lastSixMonths(now: Date): Array<DashboardDataPoint & { start: Date; end: Date }> {
    return Array.from({ length: 6 }, (_, index) => {
      const offset = index - 5;
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1));
      const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
      return {
        key: start.toISOString().slice(0, 7),
        label: new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'UTC' }).format(start),
        value: 0,
        start,
        end,
      };
    });
  }
}

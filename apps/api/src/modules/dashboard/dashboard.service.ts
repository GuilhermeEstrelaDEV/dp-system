import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { PayrollReviewEventType } from '@prisma/client';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { PrismaService } from '../../prisma/prisma.service';
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
  constructor(private readonly prisma: PrismaService) {}

  async summary(principal: AuthenticatedPrincipal, now = new Date()): Promise<DashboardSummary> {
    if (!principal.activeCompanyId) throw new ForbiddenException('Empresa ativa obrigatória');
    const companyId = principal.activeCompanyId;
    const canViewReviews = principal.permissions.includes('payroll.review.view');
    const canViewPeriods = principal.permissions.includes('payroll.period.close.view');
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, status: 'ACTIVE' },
      select: { id: true, tradeName: true },
    });
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
    if (canViewReviews) result.review = await this.reviewSummary(companyId, now);
    if (canViewPeriods) result.payrollPeriod = await this.periodSummary(companyId);
    return result;
  }

  private async reviewSummary(companyId: string, now: Date) {
    const months = this.lastSixMonths(now);
    const [cycles, openFindings, events] = await Promise.all([
      this.prisma.payrollReviewCycle.groupBy({
        by: ['status'],
        where: { companyId },
        _count: { _all: true },
        orderBy: { status: 'asc' },
      }),
      this.prisma.payrollReviewFinding.count({ where: { companyId, status: 'OPEN' } }),
      this.prisma.payrollReviewEvent.findMany({
        where: { companyId, occurredAt: { gte: months[0]!.start, lt: months[5]!.end } },
        select: { eventType: true, occurredAt: true },
        orderBy: { occurredAt: 'desc' },
      }),
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

  private async periodSummary(companyId: string) {
    const periods = await this.prisma.payrollPeriod.groupBy({
      by: ['status'],
      where: { companyId },
      _count: { _all: true },
      orderBy: { status: 'asc' },
    });
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

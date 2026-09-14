import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import type { EnterpriseScope } from '../auth/enterprise-scope';
import { DashboardRepository } from './dashboard.repository';
import type { DashboardDataPoint, DashboardMetric, DashboardSummary } from './dashboard.types';

@Injectable()
export class DashboardService {
  constructor(private readonly repository: DashboardRepository) {}

  async summary(
    scope: EnterpriseScope,
    principal: AuthenticatedPrincipal,
    now = new Date(),
  ): Promise<DashboardSummary> {
    const canViewLegacyDashboard = principal.permissions.includes('platform.read');
    const company = await this.repository.findActiveCompany(scope);
    if (!company) throw new NotFoundException('Empresa não encontrada');

    const result: DashboardSummary = {
      context: {
        companyId: company.id,
        companyName: company.tradeName,
        generatedAt: now.toISOString(),
        timezone: 'UTC',
      },
      access: 'RESTRICTED',
    };
    const operationalMetrics = await this.operationalSummary(scope, principal, now);
    if (operationalMetrics.length) {
      result.operations = { metrics: operationalMetrics };
      result.access = 'AVAILABLE';
    }
    if (canViewLegacyDashboard) {
      result.review = await this.reviewSummary(scope, now);
      result.payrollPeriod = await this.periodSummary(scope);
      result.access = 'AVAILABLE';
    } else {
      if (principal.permissions.includes('payroll.review.view')) {
        result.review = await this.reviewSummary(scope, now);
        result.access = 'AVAILABLE';
      }
      if (principal.permissions.includes('payroll.period.close.view')) {
        result.payrollPeriod = await this.periodSummary(scope);
        result.access = 'AVAILABLE';
      }
    }
    return result;
  }

  private async operationalSummary(
    scope: EnterpriseScope,
    principal: AuthenticatedPrincipal,
    now: Date,
  ) {
    const metric = async (
      capability: string,
      label: string,
      description: string,
      count: () => Promise<number>,
    ): Promise<DashboardMetric | undefined> => {
      if (!principal.permissions.includes(capability)) return undefined;
      return { value: await count(), label, description };
    };
    const vacationHorizon = new Date(now);
    vacationHorizon.setUTCDate(vacationHorizon.getUTCDate() + 90);
    const metrics = await Promise.all([
      metric('employee.read', 'Colaboradores ativos', 'Cadastros ativos na empresa.', () =>
        this.repository.activeEmployeeCount(scope),
      ),
      metric('contract.read', 'Contratos ativos', 'Vinculos ativos na empresa.', () =>
        this.repository.activeContractCount(scope),
      ),
      metric('admission.read', 'Admissoes pendentes', 'Processos ainda nao concluidos.', () =>
        this.repository.pendingAdmissionCount(scope),
      ),
      metric('leave.read', 'Afastamentos ativos', 'Casos com status OPEN.', () =>
        this.repository.activeLeaveCount(scope),
      ),
      metric(
        'vacation.read',
        'Ferias proximas',
        'Solicitacoes aprovadas nos proximos 90 dias.',
        () => this.repository.upcomingVacationCount(scope, now, vacationHorizon),
      ),
      metric('benefit.read', 'Beneficios ativos', 'Itens ativos do catalogo.', () =>
        this.repository.activeBenefitCount(scope),
      ),
      metric(
        'payroll.run.read',
        'Processamentos em andamento',
        'Execucoes em rascunho ou andamento.',
        () => this.repository.activePayrollRunCount(scope),
      ),
      metric('payroll.review.view', 'Revisoes pendentes', 'Ciclos ainda nao encerrados.', () =>
        this.repository.pendingReviewCount(scope),
      ),
    ]);
    return metrics.filter((item): item is DashboardMetric => item !== undefined);
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

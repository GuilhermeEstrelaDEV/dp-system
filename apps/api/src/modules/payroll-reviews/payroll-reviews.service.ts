import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type PayrollReviewFinding as PersistedFinding } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditWriterService } from '../auth/audit-writer.service';
import { AuthorizationService } from '../auth/authorization.service';
import {
  PayrollReviewFindingFoundation,
  PayrollReviewFindingInvariantError,
  type PayrollReviewFinding,
  type PayrollReviewFindingEvent,
} from './domain/payroll-review-finding.foundation';
import {
  CreatePayrollReviewFindingDto,
  TransitionPayrollReviewFindingDto,
} from './payroll-reviews.dto';

const CAPABILITIES = {
  view: 'payroll.review.view',
  create: 'payroll.review.create',
  findingCreate: 'payroll.review.finding.create',
  findingResolve: 'payroll.review.finding.resolve',
  findingReopen: 'payroll.review.finding.reopen',
} as const;

@Injectable()
export class PayrollReviewsService {
  private readonly foundation = new PayrollReviewFindingFoundation();

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditWriterService,
    private readonly authorization: AuthorizationService,
  ) {}

  async openCycle(payrollRunId: string, principal: AuthenticatedPrincipal) {
    this.authorize(principal, CAPABILITIES.create);
    try {
      return await this.audit.transaction(async (tx) => {
        const run = await tx.payrollRun.findFirst({
          where: { id: payrollRunId, payrollPeriod: { companyId: principal.activeCompanyId! } },
          select: { id: true, status: true, payrollPeriod: { select: { companyId: true } } },
        });
        if (!run) throw new NotFoundException('Execução de folha não encontrada');
        if (run.status !== 'COMPLETED') {
          throw new ConflictException('Somente execução concluída pode entrar em conferência');
        }
        const now = new Date();
        const cycle = await tx.payrollReviewCycle.create({
          data: {
            companyId: run.payrollPeriod.companyId,
            payrollRunId: run.id,
            createdBy: principal.actorId,
            traceId: principal.traceId,
            createdAt: now,
          },
        });
        await tx.payrollReviewEvent.create({
          data: {
            companyId: cycle.companyId,
            reviewCycleId: cycle.id,
            actorId: principal.actorId,
            traceId: principal.traceId,
            eventType: 'REVIEW_CYCLE_OPENED',
            nextState: { status: 'OPEN' },
            occurredAt: now,
            metadata: { source: 'payroll-review-api' },
          },
        });
        await this.audit.append(
          {
            principal,
            action: 'PAYROLL_REVIEW_CYCLE_OPENED',
            entityType: 'PayrollReviewCycle',
            entityId: cycle.id,
            nextState: { status: cycle.status },
            metadata: { source: 'payroll-review-api' },
          },
          tx,
        );
        return cycle;
      });
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Já existe ciclo ativo para esta execução');
      }
      throw error;
    }
  }

  async listByRun(payrollRunId: string, principal: AuthenticatedPrincipal) {
    this.authorize(principal, CAPABILITIES.view);
    const run = await this.findRunInCompany(payrollRunId, principal);
    return this.prisma.payrollReviewCycle.findMany({
      where: { payrollRunId: run.id, companyId: principal.activeCompanyId! },
      include: { findings: true, events: { orderBy: { occurredAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findCycle(reviewCycleId: string, principal: AuthenticatedPrincipal) {
    this.authorize(principal, CAPABILITIES.view);
    const cycle = await this.prisma.payrollReviewCycle.findFirst({
      where: { id: reviewCycleId, companyId: principal.activeCompanyId! },
      include: {
        findings: { orderBy: { createdAt: 'asc' } },
        events: { orderBy: [{ occurredAt: 'asc' }, { id: 'asc' }] },
      },
    });
    if (!cycle) throw new NotFoundException('Ciclo de conferência não encontrado');
    return cycle;
  }

  async createFinding(
    reviewCycleId: string,
    dto: CreatePayrollReviewFindingDto,
    principal: AuthenticatedPrincipal,
  ) {
    this.authorize(principal, CAPABILITIES.findingCreate);
    return this.audit.transaction(async (tx) => {
      const cycle = await tx.payrollReviewCycle.findFirst({
        where: { id: reviewCycleId, companyId: principal.activeCompanyId! },
      });
      if (!cycle) throw new NotFoundException('Ciclo de conferência não encontrado');
      await this.validateReferences(tx, cycle.companyId, cycle.payrollRunId, dto);
      const now = new Date();
      const findingId = randomUUID();
      const eventId = randomUUID();
      const opened = this.foundation.open({
        findingId,
        eventId,
        companyId: cycle.companyId,
        payrollRunId: cycle.payrollRunId,
        severity: dto.severity,
        description: dto.description,
        reference: {
          employmentContractId: dto.employmentContractId,
          payrollCalculationItemId: dto.payrollCalculationItemId,
        },
        traceId: principal.traceId,
        occurredAt: now,
      });
      const finding = await tx.payrollReviewFinding.create({
        data: {
          id: findingId,
          reviewCycleId: cycle.id,
          companyId: cycle.companyId,
          payrollRunId: cycle.payrollRunId,
          employmentContractId: dto.employmentContractId,
          payrollCalculationItemId: dto.payrollCalculationItemId,
          severity: dto.severity,
          code: dto.code.trim(),
          title: dto.title.trim(),
          description: opened.finding.description,
          createdBy: principal.actorId,
          traceId: principal.traceId,
          createdAt: now,
        },
      });
      await tx.payrollReviewEvent.create({
        data: {
          id: eventId,
          companyId: cycle.companyId,
          reviewCycleId: cycle.id,
          findingId,
          actorId: principal.actorId,
          traceId: principal.traceId,
          eventType: 'FINDING_OPENED',
          nextState: { status: 'OPEN', severity: dto.severity },
          occurredAt: now,
          metadata: { source: 'payroll-review-api' },
        },
      });
      await this.audit.append(
        {
          principal,
          action: 'PAYROLL_REVIEW_FINDING_OPENED',
          entityType: 'PayrollReviewFinding',
          entityId: finding.id,
          nextState: { status: finding.status, severity: finding.severity },
          metadata: { source: 'payroll-review-api' },
        },
        tx,
      );
      return finding;
    });
  }

  async listFindings(reviewCycleId: string, principal: AuthenticatedPrincipal) {
    await this.findCycle(reviewCycleId, principal);
    return this.prisma.payrollReviewFinding.findMany({
      where: { reviewCycleId, companyId: principal.activeCompanyId! },
      include: { events: { orderBy: [{ occurredAt: 'asc' }, { id: 'asc' }] } },
      orderBy: { createdAt: 'asc' },
    });
  }

  resolveFinding(
    findingId: string,
    dto: TransitionPayrollReviewFindingDto,
    principal: AuthenticatedPrincipal,
  ) {
    return this.transitionFinding(findingId, dto, principal, 'RESOLVED');
  }

  reopenFinding(
    findingId: string,
    dto: TransitionPayrollReviewFindingDto,
    principal: AuthenticatedPrincipal,
  ) {
    return this.transitionFinding(findingId, dto, principal, 'OPEN');
  }

  private async transitionFinding(
    findingId: string,
    dto: TransitionPayrollReviewFindingDto,
    principal: AuthenticatedPrincipal,
    nextStatus: 'OPEN' | 'RESOLVED',
  ) {
    this.authorize(
      principal,
      nextStatus === 'RESOLVED' ? CAPABILITIES.findingResolve : CAPABILITIES.findingReopen,
    );
    try {
      return await this.audit.transaction(async (tx) => {
        const persisted = await tx.payrollReviewFinding.findFirst({
          where: { id: findingId, companyId: principal.activeCompanyId! },
          include: { events: { orderBy: [{ occurredAt: 'asc' }, { id: 'asc' }] } },
        });
        if (!persisted) throw new NotFoundException('Achado de conferência não encontrado');
        const finding = this.toDomainFinding(persisted);
        const history = persisted.events
          .filter((event) => event.findingId !== null)
          .map((event) => this.toDomainEvent(event));
        const now = new Date();
        const eventId = randomUUID();
        const command = {
          eventId,
          companyId: persisted.companyId,
          reason: dto.reason,
          traceId: principal.traceId,
          occurredAt: now,
        };
        const change =
          nextStatus === 'RESOLVED'
            ? this.foundation.resolve(finding, history, command)
            : this.foundation.reopen(finding, history, command);
        const updated = await tx.payrollReviewFinding.update({
          where: { id: findingId },
          data:
            nextStatus === 'RESOLVED'
              ? {
                  status: 'RESOLVED',
                  resolvedBy: principal.actorId,
                  resolvedAt: now,
                  resolutionReason: dto.reason.trim(),
                  traceId: principal.traceId,
                }
              : {
                  status: 'OPEN',
                  resolvedBy: null,
                  resolvedAt: null,
                  resolutionReason: null,
                  traceId: principal.traceId,
                },
        });
        const eventType = nextStatus === 'RESOLVED' ? 'FINDING_RESOLVED' : 'FINDING_REOPENED';
        await tx.payrollReviewEvent.create({
          data: {
            id: eventId,
            companyId: persisted.companyId,
            reviewCycleId: persisted.reviewCycleId,
            findingId,
            actorId: principal.actorId,
            traceId: principal.traceId,
            eventType,
            reason: dto.reason.trim(),
            previousState: { status: persisted.status },
            nextState: { status: change.finding.status },
            occurredAt: now,
            metadata: { source: 'payroll-review-api' },
          },
        });
        await this.audit.append(
          {
            principal,
            action: `PAYROLL_REVIEW_${eventType}`,
            entityType: 'PayrollReviewFinding',
            entityId: findingId,
            previousState: { status: persisted.status },
            nextState: { status: updated.status },
            reason: dto.reason.trim(),
            metadata: { source: 'payroll-review-api' },
          },
          tx,
        );
        return updated;
      });
    } catch (error: unknown) {
      if (error instanceof PayrollReviewFindingInvariantError) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }

  private async validateReferences(
    tx: Prisma.TransactionClient,
    companyId: string,
    payrollRunId: string,
    dto: CreatePayrollReviewFindingDto,
  ): Promise<void> {
    if (dto.employmentContractId) {
      const contract = await tx.payrollRunEmployee.findFirst({
        where: {
          payrollRunId,
          employmentContractId: dto.employmentContractId,
          employmentContract: { companyId },
        },
        select: { id: true },
      });
      if (!contract) {
        throw new BadRequestException('Contrato não pertence à empresa ativa e à execução');
      }
    }
    if (dto.payrollCalculationItemId) {
      const item = await tx.payrollCalculationItem.findFirst({
        where: {
          id: dto.payrollCalculationItemId,
          payrollRunEmployee: {
            payrollRunId,
            employmentContract: { companyId },
            ...(dto.employmentContractId ? { employmentContractId: dto.employmentContractId } : {}),
          },
        },
        select: { id: true },
      });
      if (!item) {
        throw new BadRequestException(
          'Item não pertence à execução, empresa e contrato informados',
        );
      }
    }
  }

  private async findRunInCompany(payrollRunId: string, principal: AuthenticatedPrincipal) {
    const run = await this.prisma.payrollRun.findFirst({
      where: { id: payrollRunId, payrollPeriod: { companyId: principal.activeCompanyId! } },
      select: { id: true },
    });
    if (!run) throw new NotFoundException('Execução de folha não encontrada');
    return run;
  }

  private authorize(principal: AuthenticatedPrincipal, capability: string): void {
    this.authorization.requireCapability(principal, capability);
  }

  private toDomainFinding(finding: PersistedFinding): PayrollReviewFinding {
    return Object.freeze({
      id: finding.id,
      companyId: finding.companyId,
      payrollRunId: finding.payrollRunId,
      severity: finding.severity,
      description: finding.description,
      reference: Object.freeze({
        employmentContractId: finding.employmentContractId ?? undefined,
        payrollCalculationItemId: finding.payrollCalculationItemId ?? undefined,
      }),
      status: finding.status,
      createdAt: finding.createdAt,
    });
  }

  private toDomainEvent(event: {
    id: string;
    findingId: string | null;
    companyId: string;
    eventType: 'REVIEW_CYCLE_OPENED' | 'FINDING_OPENED' | 'FINDING_RESOLVED' | 'FINDING_REOPENED';
    reason: string | null;
    traceId: string;
    occurredAt: Date;
  }): PayrollReviewFindingEvent {
    if (!event.findingId || event.eventType === 'REVIEW_CYCLE_OPENED') {
      throw new PayrollReviewFindingInvariantError('Finding history has an invalid event');
    }
    const type = event.eventType.replace('FINDING_', '') as PayrollReviewFindingEvent['type'];
    return Object.freeze({ ...event, findingId: event.findingId, type });
  }
}

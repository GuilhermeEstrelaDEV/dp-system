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
  PayrollReviewWorkflowFoundation,
  PayrollReviewWorkflowInvariantError,
} from './domain/payroll-review-workflow.foundation';
import {
  CreatePayrollReviewFindingDto,
  PayrollReviewDecisionDto,
  TransitionPayrollReviewFindingDto,
} from './payroll-reviews.dto';

const CAPABILITIES = {
  view: 'payroll.review.view',
  create: 'payroll.review.create',
  findingCreate: 'payroll.review.finding.create',
  findingResolve: 'payroll.review.finding.resolve',
  findingReopen: 'payroll.review.finding.reopen',
  submit: 'payroll.review.submit',
  approve: 'payroll.review.approve',
  reject: 'payroll.review.reject',
} as const;

@Injectable()
export class PayrollReviewsService {
  private readonly foundation = new PayrollReviewFindingFoundation();
  private readonly workflow = new PayrollReviewWorkflowFoundation();

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
        await tx.payrollReviewApprovalStage.createMany({
          data: [1, 2].map((sequence) => ({
            reviewCycleId: cycle.id,
            sequence,
            code: `V1_STAGE_${sequence}`,
            requiredCapability: CAPABILITIES.approve,
          })),
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
        approvalStages: { orderBy: { sequence: 'asc' } },
        decisions: { orderBy: { occurredAt: 'asc' } },
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
      if (cycle.status === 'APPROVED') {
        throw new ConflictException('Ciclo aprovado não aceita novos achados');
      }
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
      if (dto.severity === 'BLOCKING') {
        await tx.payrollReviewEvent.create({
          data: {
            companyId: cycle.companyId,
            reviewCycleId: cycle.id,
            findingId,
            actorId: principal.actorId,
            traceId: principal.traceId,
            eventType: 'FINDING_BLOCKED',
            nextState: { blocking: true },
            occurredAt: now,
            metadata: { source: 'payroll-review-api' },
          },
        });
      }
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

  startReview(reviewCycleId: string, principal: AuthenticatedPrincipal) {
    return this.transitionCycle(reviewCycleId, principal, CAPABILITIES.submit, 'REVIEW_STARTED');
  }

  submitReview(reviewCycleId: string, principal: AuthenticatedPrincipal) {
    return this.transitionCycle(reviewCycleId, principal, CAPABILITIES.submit, 'REVIEW_SUBMITTED');
  }

  async approveReview(
    reviewCycleId: string,
    dto: PayrollReviewDecisionDto,
    principal: AuthenticatedPrincipal,
  ) {
    this.authorize(principal, CAPABILITIES.approve);
    return this.withWorkflowErrors(() =>
      this.audit.transaction(async (tx) => {
        const cycle = await tx.payrollReviewCycle.findFirst({
          where: { id: reviewCycleId, companyId: principal.activeCompanyId! },
          include: {
            approvalStages: { orderBy: { sequence: 'asc' } },
            decisions: { orderBy: { occurredAt: 'asc' } },
          },
        });
        if (!cycle) throw new NotFoundException('Ciclo de conferência não encontrado');
        if (cycle.createdBy === principal.actorId) {
          throw new ConflictException('O preparador não pode aprovar a própria conferência');
        }
        this.workflow.approve(cycle.status, false);
        const stage = cycle.approvalStages.find(
          (candidate) => candidate.sequence === cycle.currentApprovalStage + 1,
        );
        if (!stage) throw new ConflictException('Etapa de aprovação não configurada');
        this.authorize(principal, stage.requiredCapability);
        const approvals = cycle.decisions.filter(
          (decision) =>
            decision.submissionNumber === cycle.submissionNumber &&
            decision.decision === 'APPROVED',
        );
        if (approvals.some((decision) => decision.actorId === principal.actorId)) {
          throw new ConflictException('As etapas de aprovação exigem atores distintos');
        }
        const isFinalStage = stage.sequence === cycle.approvalStages.at(-1)?.sequence;
        const nextStatus = this.workflow.approve(cycle.status, isFinalStage);
        const now = new Date();
        await tx.payrollReviewDecision.create({
          data: {
            companyId: cycle.companyId,
            reviewCycleId: cycle.id,
            approvalStageId: stage.id,
            submissionNumber: cycle.submissionNumber,
            decision: 'APPROVED',
            actorId: principal.actorId,
            reason: dto.reason?.trim(),
            traceId: principal.traceId,
            occurredAt: now,
          },
        });
        const updated = await tx.payrollReviewCycle.update({
          where: { id: cycle.id },
          data: {
            status: nextStatus,
            currentApprovalStage: stage.sequence,
            traceId: principal.traceId,
          },
        });
        await this.appendWorkflowEventAndAudit(tx, principal, cycle, updated, {
          eventType: 'REVIEW_APPROVED',
          reason: dto.reason?.trim(),
          occurredAt: now,
          metadata: { stage: stage.sequence, submission: cycle.submissionNumber },
        });
        return updated;
      }),
    );
  }

  async rejectReview(
    reviewCycleId: string,
    dto: PayrollReviewDecisionDto,
    principal: AuthenticatedPrincipal,
  ) {
    this.authorize(principal, CAPABILITIES.reject);
    return this.withWorkflowErrors(() =>
      this.audit.transaction(async (tx) => {
        const cycle = await tx.payrollReviewCycle.findFirst({
          where: { id: reviewCycleId, companyId: principal.activeCompanyId! },
          include: { approvalStages: { orderBy: { sequence: 'asc' } } },
        });
        if (!cycle) throw new NotFoundException('Ciclo de conferência não encontrado');
        const reason = dto.reason ?? '';
        const nextStatus = this.workflow.reject(cycle.status, reason);
        const stage = cycle.approvalStages.find(
          (candidate) => candidate.sequence === cycle.currentApprovalStage + 1,
        );
        if (!stage) throw new ConflictException('Etapa de aprovação não configurada');
        const now = new Date();
        await tx.payrollReviewDecision.create({
          data: {
            companyId: cycle.companyId,
            reviewCycleId: cycle.id,
            approvalStageId: stage.id,
            submissionNumber: cycle.submissionNumber,
            decision: 'REJECTED',
            actorId: principal.actorId,
            reason: reason.trim(),
            traceId: principal.traceId,
            occurredAt: now,
          },
        });
        const updated = await tx.payrollReviewCycle.update({
          where: { id: cycle.id },
          data: { status: nextStatus, currentApprovalStage: 0, traceId: principal.traceId },
        });
        await this.appendWorkflowEventAndAudit(tx, principal, cycle, updated, {
          eventType: 'REVIEW_REJECTED',
          reason: reason.trim(),
          occurredAt: now,
          metadata: { stage: stage.sequence, submission: cycle.submissionNumber },
        });
        return updated;
      }),
    );
  }

  async history(reviewCycleId: string, principal: AuthenticatedPrincipal) {
    this.authorize(principal, CAPABILITIES.view);
    const cycle = await this.prisma.payrollReviewCycle.findFirst({
      where: { id: reviewCycleId, companyId: principal.activeCompanyId! },
      include: {
        events: {
          include: { actor: { select: { id: true, displayName: true } } },
          orderBy: [{ occurredAt: 'asc' }, { id: 'asc' }],
        },
        findings: { orderBy: { createdAt: 'asc' } },
        approvalStages: { orderBy: { sequence: 'asc' } },
        decisions: {
          include: { actor: { select: { id: true, displayName: true } } },
          orderBy: { occurredAt: 'asc' },
        },
      },
    });
    if (!cycle) throw new NotFoundException('Ciclo de conferência não encontrado');
    return { ...cycle, currentState: cycle.status, timeline: cycle.events };
  }

  private async transitionCycle(
    reviewCycleId: string,
    principal: AuthenticatedPrincipal,
    capability: string,
    eventType: 'REVIEW_STARTED' | 'REVIEW_SUBMITTED',
  ) {
    this.authorize(principal, capability);
    return this.withWorkflowErrors(() =>
      this.audit.transaction(async (tx) => {
        const cycle = await tx.payrollReviewCycle.findFirst({
          where: { id: reviewCycleId, companyId: principal.activeCompanyId! },
        });
        if (!cycle) throw new NotFoundException('Ciclo de conferência não encontrado');
        let nextStatus: 'IN_REVIEW' | 'SUBMITTED';
        let submissionNumber = cycle.submissionNumber;
        if (eventType === 'REVIEW_STARTED') {
          nextStatus = this.workflow.start(cycle.status);
        } else {
          const blocking = await tx.payrollReviewFinding.count({
            where: { reviewCycleId: cycle.id, severity: 'BLOCKING', status: 'OPEN' },
          });
          nextStatus = this.workflow.submit(cycle.status, blocking);
          submissionNumber += 1;
        }
        const now = new Date();
        const updated = await tx.payrollReviewCycle.update({
          where: { id: cycle.id },
          data: {
            status: nextStatus,
            submissionNumber,
            currentApprovalStage: 0,
            traceId: principal.traceId,
          },
        });
        await this.appendWorkflowEventAndAudit(tx, principal, cycle, updated, {
          eventType,
          occurredAt: now,
          metadata: { submission: submissionNumber },
        });
        return updated;
      }),
    );
  }

  private async appendWorkflowEventAndAudit(
    tx: Prisma.TransactionClient,
    principal: AuthenticatedPrincipal,
    previous: { id: string; companyId: string; status: string },
    next: { status: string },
    input: {
      eventType: 'REVIEW_STARTED' | 'REVIEW_SUBMITTED' | 'REVIEW_APPROVED' | 'REVIEW_REJECTED';
      reason?: string;
      occurredAt: Date;
      metadata: Prisma.InputJsonObject;
    },
  ): Promise<void> {
    await tx.payrollReviewEvent.create({
      data: {
        companyId: previous.companyId,
        reviewCycleId: previous.id,
        actorId: principal.actorId,
        traceId: principal.traceId,
        eventType: input.eventType,
        reason: input.reason,
        previousState: { status: previous.status },
        nextState: { status: next.status },
        occurredAt: input.occurredAt,
        metadata: input.metadata,
      },
    });
    await this.audit.append(
      {
        principal,
        action: `PAYROLL_${input.eventType}`,
        entityType: 'PayrollReviewCycle',
        entityId: previous.id,
        previousState: { status: previous.status },
        nextState: { status: next.status },
        reason: input.reason,
        metadata: { source: 'payroll-review-api' },
      },
      tx,
    );
  }

  private async withWorkflowErrors<T>(work: () => Promise<T>): Promise<T> {
    try {
      return await work();
    } catch (error: unknown) {
      if (error instanceof PayrollReviewWorkflowInvariantError) {
        throw new ConflictException(error.message);
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Decisão já registrada para esta etapa');
      }
      throw error;
    }
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
          include: {
            reviewCycle: { select: { status: true } },
            events: { orderBy: [{ occurredAt: 'asc' }, { id: 'asc' }] },
          },
        });
        if (!persisted) throw new NotFoundException('Achado de conferência não encontrado');
        if (persisted.reviewCycle.status === 'APPROVED') {
          throw new ConflictException('Ciclo aprovado não aceita alterações em achados');
        }
        const finding = this.toDomainFinding(persisted);
        const history = persisted.events
          .filter((event) =>
            ['FINDING_OPENED', 'FINDING_RESOLVED', 'FINDING_REOPENED'].includes(event.eventType),
          )
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
        if (persisted.severity === 'BLOCKING') {
          await tx.payrollReviewEvent.create({
            data: {
              companyId: persisted.companyId,
              reviewCycleId: persisted.reviewCycleId,
              findingId,
              actorId: principal.actorId,
              traceId: principal.traceId,
              eventType: nextStatus === 'RESOLVED' ? 'FINDING_UNBLOCKED' : 'FINDING_BLOCKED',
              reason: dto.reason.trim(),
              previousState: { blocking: nextStatus === 'RESOLVED' },
              nextState: { blocking: nextStatus !== 'RESOLVED' },
              occurredAt: now,
              metadata: { source: 'payroll-review-api' },
            },
          });
        }
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
    eventType: string;
    reason: string | null;
    traceId: string;
    occurredAt: Date;
  }): PayrollReviewFindingEvent {
    if (
      !event.findingId ||
      !['FINDING_OPENED', 'FINDING_RESOLVED', 'FINDING_REOPENED'].includes(event.eventType)
    ) {
      throw new PayrollReviewFindingInvariantError('Finding history has an invalid event');
    }
    const type = event.eventType.replace('FINDING_', '') as PayrollReviewFindingEvent['type'];
    return Object.freeze({ ...event, findingId: event.findingId, type });
  }
}

import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditWriterService } from '../auth/audit-writer.service';
import { AuthorizationService } from '../auth/authorization.service';
import {
  CreateCollectiveVacationDto,
  CreateLeaveCaseDto,
  CreateLeaveTypeDto,
  CreateVacationPeriodDto,
  CreateVacationRequestDto,
  DecisionDto,
  ReturnLeaveDto,
} from './vacations-leaves.dto';

const invalidPeriod = (start: string, end?: string) =>
  Boolean(end && new Date(end) < new Date(start));

const vacationDecisionAuditEvent = {
  APPROVED: 'VACATION_REQUEST_APPROVED',
  CANCELLED: 'VACATION_REQUEST_CANCELLED',
} as const;

const vacationPeriodProjection = {
  id: true,
  employmentContractId: true,
  accrualStart: true,
  accrualEnd: true,
  grantStart: true,
  grantEnd: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { requests: true, alerts: true } },
} satisfies Prisma.VacationPeriodSelect;

const vacationRequestProjection = {
  id: true,
  employmentContractId: true,
  vacationPeriodId: true,
  collectiveVacationId: true,
  startDate: true,
  endDate: true,
  status: true,
  approvedAt: true,
  cancelledAt: true,
  createdAt: true,
  updatedAt: true,
  vacationPeriod: {
    select: { id: true, accrualStart: true, accrualEnd: true, status: true },
  },
  collectiveVacation: {
    select: { id: true, name: true, startDate: true, endDate: true, status: true },
  },
  history: {
    select: { id: true, action: true, occurredAt: true },
    orderBy: { occurredAt: 'desc' as const },
  },
} satisfies Prisma.VacationRequestSelect;

const collectiveVacationProjection = {
  id: true,
  companyId: true,
  name: true,
  startDate: true,
  endDate: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CollectiveVacationSelect;

const leaveTypeProjection = {
  id: true,
  companyId: true,
  code: true,
  name: true,
  requiresExpectedReturn: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.LeaveTypeSelect;

const leaveCaseProjection = {
  id: true,
  employmentContractId: true,
  leaveTypeId: true,
  startDate: true,
  endDate: true,
  expectedReturnDate: true,
  actualReturnDate: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  leaveType: { select: leaveTypeProjection },
  employmentContract: {
    select: { id: true, companyId: true, registrationNumber: true, status: true },
  },
} satisfies Prisma.LeaveCaseSelect;

@Injectable()
export class VacationsLeavesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditWriterService,
    private readonly authorization: AuthorizationService,
  ) {}

  async listVacationPeriods(principal: AuthenticatedPrincipal, employmentContractId?: string) {
    this.authorization.requireCapability(principal, 'vacation.read');
    const companyId = this.companyId(principal);
    if (employmentContractId) await this.requireScopedContract(employmentContractId, companyId);
    return this.prisma.vacationPeriod.findMany({
      where: { employmentContractId, employmentContract: { companyId } },
      select: vacationPeriodProjection,
      orderBy: { accrualStart: 'desc' },
    });
  }

  async createVacationPeriod(dto: CreateVacationPeriodDto, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'vacation.manage');
    if (
      invalidPeriod(dto.accrualStart, dto.accrualEnd) ||
      invalidPeriod(dto.grantStart ?? '', dto.grantEnd)
    ) {
      throw new ConflictException('As datas do período de férias são incoerentes');
    }
    await this.requireScopedContract(dto.employmentContractId, this.companyId(principal));
    return this.audit.transaction(async (tx) => {
      const created = await tx.vacationPeriod.create({
        data: {
          employmentContractId: dto.employmentContractId,
          accrualStart: new Date(dto.accrualStart),
          accrualEnd: new Date(dto.accrualEnd),
          grantStart: dto.grantStart ? new Date(dto.grantStart) : null,
          grantEnd: dto.grantEnd ? new Date(dto.grantEnd) : null,
          notes: dto.notes,
        },
        select: vacationPeriodProjection,
      });
      await this.audit.append(
        {
          principal,
          action: 'VACATION_PERIOD_CREATED',
          entityType: 'VacationPeriod',
          entityId: created.id,
          nextState: { status: created.status },
        },
        tx,
      );
      return created;
    });
  }

  async listVacationRequests(principal: AuthenticatedPrincipal, employmentContractId?: string) {
    this.authorization.requireCapability(principal, 'vacation.read');
    const companyId = this.companyId(principal);
    if (employmentContractId) await this.requireScopedContract(employmentContractId, companyId);
    return this.prisma.vacationRequest.findMany({
      where: { employmentContractId, employmentContract: { companyId } },
      select: vacationRequestProjection,
      orderBy: { startDate: 'desc' },
    });
  }

  async createVacationRequest(dto: CreateVacationRequestDto, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'vacation.manage');
    if (invalidPeriod(dto.startDate, dto.endDate))
      throw new ConflictException('As datas da solicitação são incoerentes');
    const companyId = this.companyId(principal);
    await this.requireScopedContract(dto.employmentContractId, companyId);
    const period = await this.prisma.vacationPeriod.findFirst({
      where: {
        id: dto.vacationPeriodId,
        employmentContractId: dto.employmentContractId,
        employmentContract: { companyId },
      },
      select: { id: true, employmentContractId: true },
    });
    if (!period) throw new NotFoundException('Período aquisitivo não encontrado');
    if (dto.collectiveVacationId) {
      const collective = await this.prisma.collectiveVacation.findFirst({
        where: { id: dto.collectiveVacationId, companyId },
        select: { id: true },
      });
      if (!collective) throw new NotFoundException('Férias coletivas não encontradas');
    }
    const [vacationOverlap, leaveOverlap] = await Promise.all([
      this.prisma.vacationRequest.findFirst({
        where: {
          employmentContractId: dto.employmentContractId,
          status: { in: ['DRAFT', 'PENDING', 'APPROVED'] },
          startDate: { lte: new Date(dto.endDate) },
          endDate: { gte: new Date(dto.startDate) },
        },
      }),
      this.prisma.leaveCase.findFirst({
        where: {
          employmentContractId: dto.employmentContractId,
          status: 'OPEN',
          startDate: { lte: new Date(dto.endDate) },
          OR: [{ endDate: null }, { endDate: { gte: new Date(dto.startDate) } }],
        },
      }),
    ]);
    if (vacationOverlap || leaveOverlap)
      throw new ConflictException('Existe operação incompatível no período solicitado');
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.vacationRequest.create({
        data: { ...dto, startDate: new Date(dto.startDate), endDate: new Date(dto.endDate) },
        select: vacationRequestProjection,
      });
      await tx.vacationRequestHistory.create({
        data: { vacationRequestId: request.id, action: 'REQUESTED', reason: dto.requestReason },
      });
      await this.audit.append(
        {
          principal,
          action: 'VACATION_REQUEST_CREATED',
          entityType: 'VacationRequest',
          entityId: request.id,
          nextState: { status: request.status },
        },
        tx,
      );
      return request;
    });
  }

  async decideVacationRequest(
    id: string,
    action: 'APPROVED' | 'CANCELLED',
    dto: DecisionDto,
    principal: AuthenticatedPrincipal,
  ) {
    this.authorization.requireCapability(principal, 'vacation.manage');
    const request = await this.prisma.vacationRequest.findFirst({
      where: { id, employmentContract: { companyId: this.companyId(principal) } },
      select: { id: true, status: true },
    });
    if (!request) throw new NotFoundException('Solicitação de férias não encontrada');
    if (['APPROVED', 'CANCELLED'].includes(request.status))
      throw new ConflictException('Solicitação já foi decidida');
    if (action === 'CANCELLED' && !dto.reason)
      throw new ConflictException('Cancelamento exige justificativa');
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.vacationRequest.update({
        where: { id },
        data:
          action === 'APPROVED'
            ? { status: action, approvedAt: new Date(), approvalReason: dto.reason }
            : { status: action, cancelledAt: new Date(), approvalReason: dto.reason },
        select: vacationRequestProjection,
      });
      await tx.vacationRequestHistory.create({
        data: { vacationRequestId: id, action, reason: dto.reason },
      });
      await this.audit.append(
        {
          principal,
          action: vacationDecisionAuditEvent[action],
          entityType: 'VacationRequest',
          entityId: id,
          previousState: { status: request.status },
          nextState: { status: updated.status },
        },
        tx,
      );
      return updated;
    });
  }

  createCollectiveVacation(dto: CreateCollectiveVacationDto, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'vacation.manage');
    if (invalidPeriod(dto.startDate, dto.endDate))
      throw new ConflictException('As datas das férias coletivas são incoerentes');
    const companyId = this.companyId(principal, dto.companyId);
    return this.audit.transaction(async (tx) => {
      const created = await tx.collectiveVacation.create({
        data: {
          companyId,
          name: dto.name,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          notes: dto.notes,
        },
        select: collectiveVacationProjection,
      });
      await this.audit.append(
        {
          principal,
          action: 'COLLECTIVE_VACATION_CREATED',
          entityType: 'CollectiveVacation',
          entityId: created.id,
          nextState: { status: created.status },
        },
        tx,
      );
      return created;
    });
  }

  listLeaveTypes(principal: AuthenticatedPrincipal, requestedCompanyId?: string) {
    this.authorization.requireCapability(principal, 'leave.read');
    const companyId = this.companyId(principal, requestedCompanyId);
    return this.prisma.leaveType.findMany({
      where: { companyId },
      select: leaveTypeProjection,
      orderBy: { name: 'asc' },
    });
  }

  async createLeaveType(dto: CreateLeaveTypeDto, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'leave.manage');
    const companyId = this.companyId(principal, dto.companyId);
    return this.audit.transaction(async (tx) => {
      const created = await tx.leaveType.create({
        data: {
          companyId,
          code: dto.code,
          name: dto.name,
          requiresExpectedReturn: dto.requiresExpectedReturn,
        },
        select: leaveTypeProjection,
      });
      await this.audit.append(
        {
          principal,
          action: 'LEAVE_TYPE_CREATED',
          entityType: 'LeaveType',
          entityId: created.id,
          nextState: { status: created.status },
        },
        tx,
      );
      return created;
    });
  }

  async listLeaveCases(principal: AuthenticatedPrincipal, employmentContractId?: string) {
    this.authorization.requireCapability(principal, 'leave.read');
    const companyId = this.companyId(principal);
    if (employmentContractId) await this.requireScopedContract(employmentContractId, companyId);
    return this.prisma.leaveCase.findMany({
      where: { employmentContractId, employmentContract: { companyId } },
      select: leaveCaseProjection,
      orderBy: { startDate: 'desc' },
    });
  }

  async createLeaveCase(dto: CreateLeaveCaseDto, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'leave.manage');
    const companyId = this.companyId(principal);
    if (
      invalidPeriod(dto.startDate, dto.endDate) ||
      invalidPeriod(dto.startDate, dto.expectedReturnDate)
    )
      throw new ConflictException('As datas do afastamento são incoerentes');
    const [contract, type] = await Promise.all([
      this.requireScopedContract(dto.employmentContractId, companyId),
      this.prisma.leaveType.findFirst({
        where: { id: dto.leaveTypeId, companyId, status: 'ACTIVE' },
        select: leaveTypeProjection,
      }),
    ]);
    if (!type) throw new NotFoundException('Tipo de afastamento não encontrado');
    if (type.requiresExpectedReturn && !dto.expectedReturnDate)
      throw new ConflictException('Este tipo exige retorno previsto');
    const vacationOverlap = await this.prisma.vacationRequest.findFirst({
      where: {
        employmentContractId: contract.id,
        status: 'APPROVED',
        startDate: { lte: dto.endDate ? new Date(dto.endDate) : new Date('9999-12-31') },
        endDate: { gte: new Date(dto.startDate) },
      },
    });
    if (vacationOverlap)
      throw new ConflictException('Existe férias aprovada incompatível com o afastamento');
    return this.audit.transaction(async (tx) => {
      const item = await tx.leaveCase.create({
        data: {
          employmentContractId: dto.employmentContractId,
          leaveTypeId: dto.leaveTypeId,
          startDate: new Date(dto.startDate),
          endDate: dto.endDate ? new Date(dto.endDate) : null,
          expectedReturnDate: dto.expectedReturnDate ? new Date(dto.expectedReturnDate) : null,
          reason: dto.reason,
        },
        select: leaveCaseProjection,
      });
      await tx.leaveCaseHistory.create({
        data: { leaveCaseId: item.id, action: 'OPENED', reason: dto.reason },
      });
      await this.audit.append(
        {
          principal,
          action: 'LEAVE_CASE_CREATED',
          entityType: 'LeaveCase',
          entityId: item.id,
          nextState: { status: item.status },
        },
        tx,
      );
      return item;
    });
  }

  async returnFromLeave(id: string, dto: ReturnLeaveDto, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'leave.manage');
    const item = await this.prisma.leaveCase.findFirst({
      where: { id, employmentContract: { companyId: this.companyId(principal) } },
      select: leaveCaseProjection,
    });
    if (!item) throw new NotFoundException('Afastamento não encontrado');
    if (item.status !== 'OPEN') throw new ConflictException('Afastamento já foi encerrado');
    if (new Date(dto.actualReturnDate) < item.startDate)
      throw new ConflictException('Retorno não pode ser anterior ao início');
    return this.audit.transaction(async (tx) => {
      const updated = await tx.leaveCase.update({
        where: { id },
        data: { status: 'RETURNED', actualReturnDate: new Date(dto.actualReturnDate) },
        select: leaveCaseProjection,
      });
      await tx.leaveCaseHistory.create({
        data: { leaveCaseId: id, action: 'RETURNED', reason: dto.reason },
      });
      await this.audit.append(
        {
          principal,
          action: 'LEAVE_CASE_RETURNED',
          entityType: 'LeaveCase',
          entityId: id,
          previousState: { status: item.status },
          nextState: { status: updated.status },
        },
        tx,
      );
      return updated;
    });
  }

  private async requireScopedContract(id: string, companyId: string) {
    const contract = await this.prisma.employmentContract.findFirst({
      where: { id, companyId },
      select: { id: true, companyId: true, status: true },
    });
    if (!contract) throw new NotFoundException('Contrato não encontrado');
    return contract;
  }

  private companyId(principal: AuthenticatedPrincipal, requested?: string): string {
    const companyId = principal.activeCompanyId;
    if (!companyId || (requested && requested !== companyId))
      throw new NotFoundException('Recurso não encontrado');
    return companyId;
  }
}

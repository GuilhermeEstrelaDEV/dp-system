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

  listVacationPeriods(employmentContractId?: string) {
    return this.prisma.vacationPeriod.findMany({
      where: { employmentContractId },
      include: { requests: true, alerts: true },
      orderBy: { accrualStart: 'desc' },
    });
  }

  async createVacationPeriod(dto: CreateVacationPeriodDto) {
    if (
      invalidPeriod(dto.accrualStart, dto.accrualEnd) ||
      invalidPeriod(dto.grantStart ?? '', dto.grantEnd)
    ) {
      throw new ConflictException('As datas do período de férias são incoerentes');
    }
    const contract = await this.prisma.employmentContract.findUnique({
      where: { id: dto.employmentContractId },
    });
    if (!contract) throw new NotFoundException('Contrato não encontrado');
    return this.prisma.vacationPeriod.create({
      data: {
        ...dto,
        accrualStart: new Date(dto.accrualStart),
        accrualEnd: new Date(dto.accrualEnd),
        grantStart: dto.grantStart ? new Date(dto.grantStart) : null,
        grantEnd: dto.grantEnd ? new Date(dto.grantEnd) : null,
      },
    });
  }

  listVacationRequests(employmentContractId?: string) {
    return this.prisma.vacationRequest.findMany({
      where: { employmentContractId },
      include: {
        vacationPeriod: true,
        collectiveVacation: true,
        history: { orderBy: { occurredAt: 'desc' } },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async createVacationRequest(dto: CreateVacationRequestDto) {
    if (invalidPeriod(dto.startDate, dto.endDate))
      throw new ConflictException('As datas da solicitação são incoerentes');
    const period = await this.prisma.vacationPeriod.findUnique({
      where: { id: dto.vacationPeriodId },
    });
    if (!period || period.employmentContractId !== dto.employmentContractId) {
      throw new ConflictException('Período aquisitivo incompatível com o contrato');
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
      });
      await tx.vacationRequestHistory.create({
        data: { vacationRequestId: request.id, action: 'REQUESTED', reason: dto.requestReason },
      });
      return request;
    });
  }

  async decideVacationRequest(id: string, action: 'APPROVED' | 'CANCELLED', dto: DecisionDto) {
    const request = await this.prisma.vacationRequest.findUnique({ where: { id } });
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
      });
      await tx.vacationRequestHistory.create({
        data: { vacationRequestId: id, action, reason: dto.reason },
      });
      return updated;
    });
  }

  createCollectiveVacation(dto: CreateCollectiveVacationDto) {
    if (invalidPeriod(dto.startDate, dto.endDate))
      throw new ConflictException('As datas das férias coletivas são incoerentes');
    return this.prisma.collectiveVacation.create({
      data: { ...dto, startDate: new Date(dto.startDate), endDate: new Date(dto.endDate) },
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

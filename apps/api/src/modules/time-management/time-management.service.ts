import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditWriterService } from '../auth/audit-writer.service';
import { AuthorizationService } from '../auth/authorization.service';
import {
  AssignScheduleDto,
  CloseBalanceDto,
  CreateHolidayDto,
  CreateScheduleDto,
  CreateTimeEntryDto,
} from './time-management.dto';

const scheduleProjection = {
  id: true,
  companyId: true,
  code: true,
  name: true,
  weeklyMinutes: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  periods: {
    select: {
      id: true,
      weekday: true,
      startMinute: true,
      endMinute: true,
      breakMinutes: true,
    },
    orderBy: [{ weekday: 'asc' as const }, { startMinute: 'asc' as const }],
  },
} satisfies Prisma.WorkScheduleSelect;

const assignmentProjection = {
  id: true,
  employmentContractId: true,
  workScheduleId: true,
  validFrom: true,
  validTo: true,
  createdAt: true,
} satisfies Prisma.ContractWorkScheduleSelect;

const holidayProjection = {
  id: true,
  companyId: true,
  holidayDate: true,
  name: true,
  scope: true,
  createdAt: true,
} satisfies Prisma.HolidaySelect;

const entryProjection = {
  id: true,
  employmentContractId: true,
  companyId: true,
  occurredOn: true,
  type: true,
  minutes: true,
  source: true,
  status: true,
  createdAt: true,
} satisfies Prisma.TimeEntrySelect;

const balanceEntryProjection = {
  id: true,
  employmentContractId: true,
  timeEntryId: true,
  occurredOn: true,
  minutes: true,
  type: true,
  createdAt: true,
} satisfies Prisma.TimeBalanceEntrySelect;

const closingProjection = {
  id: true,
  companyId: true,
  referenceMonth: true,
  status: true,
  closedAt: true,
  createdAt: true,
} satisfies Prisma.TimeBalanceClosingSelect;

@Injectable()
export class TimeManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditWriterService,
    private readonly authorization: AuthorizationService,
  ) {}

  schedules(principal: AuthenticatedPrincipal, requestedCompanyId?: string) {
    this.authorization.requireCapability(principal, 'time.read');
    const companyId = this.companyId(principal, requestedCompanyId);
    return this.prisma.workSchedule.findMany({
      where: { companyId },
      select: scheduleProjection,
      orderBy: { name: 'asc' },
    });
  }

  async createSchedule(dto: CreateScheduleDto, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'time.manage');
    const companyId = this.companyId(principal, dto.companyId);
    for (const period of dto.periods) {
      if (period.weekday > 6 || period.endMinute > 1440 || period.endMinute <= period.startMinute) {
        throw new ConflictException('Período de jornada inválido');
      }
    }
    return this.audit.transaction(async (tx) => {
      const created = await tx.workSchedule.create({
        data: {
          companyId,
          code: dto.code,
          name: dto.name,
          weeklyMinutes: dto.weeklyMinutes,
          periods: { create: dto.periods },
        },
        select: scheduleProjection,
      });
      await this.audit.append(
        {
          principal,
          action: 'WORK_SCHEDULE_CREATED',
          entityType: 'WorkSchedule',
          entityId: created.id,
          nextState: { status: created.status },
        },
        tx,
      );
      return created;
    });
  }

  async assignSchedule(
    contractId: string,
    dto: AssignScheduleDto,
    principal: AuthenticatedPrincipal,
  ) {
    this.authorization.requireCapability(principal, 'time.manage');
    const companyId = this.companyId(principal);
    const [contract, schedule] = await Promise.all([
      this.requireContract(contractId, companyId),
      this.prisma.workSchedule.findFirst({
        where: { id: dto.workScheduleId, companyId },
        select: { id: true, companyId: true, status: true },
      }),
    ]);
    if (!schedule) throw new NotFoundException('Jornada não encontrada');
    if (dto.validTo && new Date(dto.validTo) < new Date(dto.validFrom)) {
      throw new ConflictException('Vigência inválida');
    }
    return this.audit.transaction(async (tx) => {
      const created = await tx.contractWorkSchedule.create({
        data: {
          employmentContractId: contract.id,
          workScheduleId: schedule.id,
          validFrom: new Date(dto.validFrom),
          validTo: dto.validTo ? new Date(dto.validTo) : null,
          reason: dto.reason,
        },
        select: assignmentProjection,
      });
      await this.audit.append(
        {
          principal,
          action: 'WORK_SCHEDULE_ASSIGNED',
          entityType: 'ContractWorkSchedule',
          entityId: created.id,
          nextState: { status: schedule.status },
        },
        tx,
      );
      return created;
    });
  }

  createHoliday(dto: CreateHolidayDto, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'time.manage');
    const companyId = this.companyId(principal, dto.companyId);
    return this.audit.transaction(async (tx) => {
      const created = await tx.holiday.create({
        data: {
          companyId,
          holidayDate: new Date(dto.holidayDate),
          name: dto.name,
          scope: dto.scope,
        },
        select: holidayProjection,
      });
      await this.audit.append(
        {
          principal,
          action: 'HOLIDAY_CREATED',
          entityType: 'Holiday',
          entityId: created.id,
          nextState: { status: created.scope },
        },
        tx,
      );
      return created;
    });
  }

  async entries(principal: AuthenticatedPrincipal, contractId?: string) {
    this.authorization.requireCapability(principal, 'time.read');
    const companyId = this.companyId(principal);
    if (contractId) await this.requireContract(contractId, companyId);
    return this.prisma.timeEntry.findMany({
      where: { companyId, employmentContractId: contractId },
      select: entryProjection,
      orderBy: { occurredOn: 'desc' },
    });
  }

  async createEntry(dto: CreateTimeEntryDto, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'time.manage');
    const companyId = this.companyId(principal);
    const contract = await this.requireContract(dto.employmentContractId, companyId);
    if (contract.status !== 'ACTIVE') throw new ConflictException('Contrato inativo');
    if (dto.type === 'ADJUSTMENT' && !dto.reason) {
      throw new ConflictException('Ajuste manual exige justificativa');
    }
    const occurredOn = new Date(dto.occurredOn);
    const closing = await this.prisma.timeBalanceClosing.findUnique({
      where: {
        companyId_referenceMonth: {
          companyId,
          referenceMonth: new Date(`${dto.occurredOn.slice(0, 7)}-01`),
        },
      },
    });
    if (closing?.status === 'CLOSED') {
      throw new ConflictException('Competência fechada não aceita alteração');
    }
    return this.audit.transaction(async (tx) => {
      const entry = await tx.timeEntry.create({
        data: {
          employmentContractId: contract.id,
          companyId,
          occurredOn,
          type: dto.type,
          minutes: dto.minutes,
          reason: dto.reason,
        },
        select: entryProjection,
      });
      const balanceMinutes = ['OVERTIME', 'WORKED', 'ADJUSTMENT'].includes(dto.type)
        ? dto.minutes
        : -Math.abs(dto.minutes);
      await tx.timeBalanceEntry.create({
        data: {
          employmentContractId: contract.id,
          timeEntryId: entry.id,
          occurredOn,
          minutes: balanceMinutes,
          type: dto.type,
          reason: dto.reason,
        },
      });
      await this.audit.append(
        {
          principal,
          action: 'TIME_ENTRY_CREATED',
          entityType: 'TimeEntry',
          entityId: entry.id,
          nextState: { status: entry.status },
        },
        tx,
      );
      return entry;
    });
  }

  async balance(contractId: string, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'time.read');
    await this.requireContract(contractId, this.companyId(principal));
    const entries = await this.prisma.timeBalanceEntry.findMany({
      where: { employmentContractId: contractId },
      select: balanceEntryProjection,
      orderBy: { occurredOn: 'desc' },
    });
    return { entries, minutes: entries.reduce((total, item) => total + item.minutes, 0) };
  }

  async close(dto: CloseBalanceDto, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'time.manage');
    const companyId = this.companyId(principal, dto.companyId);
    const referenceMonth = new Date(`${dto.referenceMonth.slice(0, 7)}-01`);
    const existing = await this.prisma.timeBalanceClosing.findUnique({
      where: { companyId_referenceMonth: { companyId, referenceMonth } },
      select: { id: true, status: true },
    });
    if (existing?.status === 'CLOSED') throw new ConflictException('Competência já fechada');
    return this.audit.transaction(async (tx) => {
      const closing = await tx.timeBalanceClosing.upsert({
        where: { companyId_referenceMonth: { companyId, referenceMonth } },
        create: {
          companyId,
          referenceMonth,
          status: 'CLOSED',
          closedAt: new Date(),
          reason: dto.reason,
        },
        update: { status: 'CLOSED', closedAt: new Date(), reason: dto.reason },
        select: closingProjection,
      });
      await this.audit.append(
        {
          principal,
          action: 'TIME_BALANCE_CLOSED',
          entityType: 'TimeBalanceClosing',
          entityId: closing.id,
          previousState: existing ? { status: existing.status } : undefined,
          nextState: { status: closing.status },
        },
        tx,
      );
      return closing;
    });
  }

  private async requireContract(id: string, companyId: string) {
    const contract = await this.prisma.employmentContract.findFirst({
      where: { id, companyId },
      select: { id: true, companyId: true, status: true },
    });
    if (!contract) throw new NotFoundException('Contrato não encontrado');
    return contract;
  }

  private companyId(principal: AuthenticatedPrincipal, requested?: string): string {
    const companyId = principal.activeCompanyId;
    if (!companyId || (requested && requested !== companyId)) {
      throw new NotFoundException('Recurso não encontrado');
    }
    return companyId;
  }
}

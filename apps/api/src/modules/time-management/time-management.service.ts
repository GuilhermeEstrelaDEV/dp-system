import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AssignScheduleDto,
  CloseBalanceDto,
  CreateHolidayDto,
  CreateScheduleDto,
  CreateTimeEntryDto,
} from './time-management.dto';

@Injectable()
export class TimeManagementService {
  constructor(private readonly prisma: PrismaService) {}
  async schedules(companyId?: string) {
    return this.prisma.workSchedule.findMany({
      where: { companyId },
      include: { periods: { orderBy: [{ weekday: 'asc' }, { startMinute: 'asc' }] } },
    });
  }
  async createSchedule(dto: CreateScheduleDto) {
    const company = await this.prisma.company.findUnique({ where: { id: dto.companyId } });
    if (!company || company.status !== 'ACTIVE')
      throw new ConflictException('Empresa inexistente ou inativa');
    for (const period of dto.periods)
      if (period.weekday > 6 || period.endMinute > 1440 || period.endMinute <= period.startMinute)
        throw new ConflictException('Período de jornada inválido');
    return this.prisma.workSchedule.create({
      data: {
        companyId: dto.companyId,
        code: dto.code,
        name: dto.name,
        weeklyMinutes: dto.weeklyMinutes,
        periods: { create: dto.periods },
      },
      include: { periods: true },
    });
  }
  async assignSchedule(contractId: string, dto: AssignScheduleDto) {
    const [contract, schedule] = await Promise.all([
      this.prisma.employmentContract.findUnique({ where: { id: contractId } }),
      this.prisma.workSchedule.findUnique({ where: { id: dto.workScheduleId } }),
    ]);
    if (!contract || !schedule || contract.companyId !== schedule.companyId)
      throw new ConflictException('Contrato ou jornada incompatível');
    if (dto.validTo && new Date(dto.validTo) < new Date(dto.validFrom))
      throw new ConflictException('Vigência inválida');
    return this.prisma.contractWorkSchedule.create({
      data: {
        employmentContractId: contractId,
        workScheduleId: dto.workScheduleId,
        validFrom: new Date(dto.validFrom),
        validTo: dto.validTo ? new Date(dto.validTo) : null,
        reason: dto.reason,
      },
    });
  }
  async createHoliday(dto: CreateHolidayDto) {
    return this.prisma.holiday.create({ data: { ...dto, holidayDate: new Date(dto.holidayDate) } });
  }
  async entries(contractId?: string) {
    return this.prisma.timeEntry.findMany({
      where: { employmentContractId: contractId },
      orderBy: { occurredOn: 'desc' },
    });
  }
  async createEntry(dto: CreateTimeEntryDto) {
    const contract = await this.prisma.employmentContract.findUnique({
      where: { id: dto.employmentContractId },
    });
    if (!contract || contract.status !== 'ACTIVE')
      throw new ConflictException('Contrato inexistente ou inativo');
    if (dto.type === 'ADJUSTMENT' && !dto.reason)
      throw new ConflictException('Ajuste manual exige justificativa');
    const closing = await this.prisma.timeBalanceClosing.findUnique({
      where: {
        companyId_referenceMonth: {
          companyId: contract.companyId,
          referenceMonth: new Date(dto.occurredOn.slice(0, 7) + '-01'),
        },
      },
    });
    if (closing?.status === 'CLOSED')
      throw new ConflictException('Competência fechada não aceita alteração');
    return this.prisma.$transaction(async (tx) => {
      const entry = await tx.timeEntry.create({
        data: {
          employmentContractId: contract.id,
          companyId: contract.companyId,
          occurredOn: new Date(dto.occurredOn),
          type: dto.type,
          minutes: dto.minutes,
          reason: dto.reason,
        },
      });
      const balanceMinutes = ['OVERTIME', 'WORKED', 'ADJUSTMENT'].includes(dto.type)
        ? dto.minutes
        : -Math.abs(dto.minutes);
      await tx.timeBalanceEntry.create({
        data: {
          employmentContractId: contract.id,
          timeEntryId: entry.id,
          occurredOn: entry.occurredOn,
          minutes: balanceMinutes,
          type: dto.type,
          reason: dto.reason,
        },
      });
      return entry;
    });
  }
  async balance(contractId: string) {
    const contract = await this.prisma.employmentContract.findUnique({ where: { id: contractId } });
    if (!contract) throw new NotFoundException('Contrato não encontrado');
    const entries = await this.prisma.timeBalanceEntry.findMany({
      where: { employmentContractId: contractId },
      orderBy: { occurredOn: 'desc' },
    });
    return { entries, minutes: entries.reduce((total, item) => total + item.minutes, 0) };
  }
  async close(dto: CloseBalanceDto) {
    const existing = await this.prisma.timeBalanceClosing.findUnique({
      where: {
        companyId_referenceMonth: {
          companyId: dto.companyId,
          referenceMonth: new Date(dto.referenceMonth.slice(0, 7) + '-01'),
        },
      },
    });
    if (existing?.status === 'CLOSED') throw new ConflictException('Competência já fechada');
    return this.prisma.timeBalanceClosing.upsert({
      where: {
        companyId_referenceMonth: {
          companyId: dto.companyId,
          referenceMonth: new Date(dto.referenceMonth.slice(0, 7) + '-01'),
        },
      },
      create: {
        companyId: dto.companyId,
        referenceMonth: new Date(dto.referenceMonth.slice(0, 7) + '-01'),
        status: 'CLOSED',
        closedAt: new Date(),
        reason: dto.reason,
      },
      update: { status: 'CLOSED', closedAt: new Date(), reason: dto.reason },
    });
  }
}

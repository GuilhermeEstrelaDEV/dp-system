import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreatePayrollPeriodDto,
  PayrollPeriodQueryDto,
  ReopenPayrollPeriodDto,
  UpdatePayrollPeriodDto,
} from './payroll-periods.dto';

@Injectable()
export class PayrollPeriodsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: PayrollPeriodQueryDto) {
    const where = { companyId: query.companyId, status: query.status };
    const [items, totalItems] = await this.prisma.$transaction([
      this.prisma.payrollPeriod.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { [query.sortBy]: query.sortDirection },
      }),
      this.prisma.payrollPeriod.count({ where }),
    ]);
    return {
      items,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / query.pageSize),
      },
    };
  }
  async find(id: string) {
    const item = await this.prisma.payrollPeriod.findUnique({
      where: { id },
      include: { closureHistory: { orderBy: { occurredAt: 'desc' } } },
    });
    if (!item) throw new NotFoundException('Competência não encontrada');
    return item;
  }
  async create(dto: CreatePayrollPeriodDto) {
    const calendar = await this.prisma.payrollCalendar.findUnique({
      where: { id: dto.payrollCalendarId },
    });
    if (!calendar || calendar.companyId !== dto.companyId)
      throw new ConflictException('Calendário inválido para a empresa');
    try {
      return await this.prisma.payrollPeriod.create({
        data: { ...dto, referenceDate: new Date(dto.referenceDate), type: dto.type ?? 'REGULAR' },
      });
    } catch (error) {
      this.duplicate(error);
    }
  }
  async update(id: string, dto: UpdatePayrollPeriodDto) {
    const period = await this.find(id);
    if (period.status === 'CLOSED') throw new ConflictException('Competência fechada é imutável');
    try {
      return await this.prisma.payrollPeriod.update({
        where: { id },
        data: {
          ...dto,
          referenceDate: dto.referenceDate ? new Date(dto.referenceDate) : undefined,
        },
      });
    } catch (error) {
      this.duplicate(error);
    }
  }
  async open(id: string) {
    const period = await this.find(id);
    if (period.status === 'CLOSED') throw new ConflictException('Use reabertura com justificativa');
    return this.prisma.payrollPeriod.update({
      where: { id },
      data: { status: 'OPEN', openedAt: new Date() },
    });
  }
  async validate(id: string) {
    const period = await this.find(id);
    const blockingErrors = await this.prisma.payrollRunMessage.count({
      where: { payrollRun: { payrollPeriodId: id }, severity: 'BLOCKING_ERROR', resolvedAt: null },
    });
    return { periodId: period.id, valid: blockingErrors === 0, blockingErrors };
  }
  async close(id: string) {
    const validation = await this.validate(id);
    if (!validation.valid) throw new ConflictException('Há erros bloqueantes para fechamento');
    return this.prisma.$transaction(async (tx) => {
      const period = await tx.payrollPeriod.update({
        where: { id },
        data: { status: 'CLOSED', closedAt: new Date() },
      });
      await tx.payrollPeriodClosure.create({
        data: {
          payrollPeriodId: id,
          action: 'CLOSED',
          engineVersion: period.engineVersion,
          parameterVersion: period.parameterVersion,
        },
      });
      return period;
    });
  }
  async reopen(id: string, dto: ReopenPayrollPeriodDto) {
    const period = await this.find(id);
    if (period.status !== 'CLOSED')
      throw new ConflictException('Somente competências fechadas podem ser reabertas');
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.payrollPeriod.update({
        where: { id },
        data: { status: 'OPEN', reopenedAt: new Date() },
      });
      await tx.payrollPeriodClosure.create({
        data: {
          payrollPeriodId: id,
          action: 'REOPENED',
          reason: dto.reason,
          engineVersion: period.engineVersion,
          parameterVersion: period.parameterVersion,
        },
      });
      return updated;
    });
  }
  private duplicate(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
      throw new ConflictException('Já existe competência para esta empresa, referência e tipo');
    throw error;
  }
}

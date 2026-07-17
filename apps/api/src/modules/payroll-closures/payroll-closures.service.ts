import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ClosePayrollPeriodDto,
  PayrollClosureQueryDto,
  ReopenPayrollPeriodDto,
} from './payroll-closures.dto';
@Injectable()
export class PayrollClosuresService {
  constructor(private readonly prisma: PrismaService) {}
  async list(q: PayrollClosureQueryDto) {
    const where = { payrollPeriodId: q.payrollPeriodId };
    const [items, totalItems] = await this.prisma.$transaction([
      this.prisma.payrollPeriodClosure.findMany({
        where,
        include: { payrollPeriod: true },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        orderBy: { occurredAt: 'desc' },
      }),
      this.prisma.payrollPeriodClosure.count({ where }),
    ]);
    return {
      items,
      pagination: {
        page: q.page,
        pageSize: q.pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / q.pageSize),
      },
    };
  }
  async find(id: string) {
    const item = await this.prisma.payrollPeriodClosure.findUnique({
      where: { id },
      include: { payrollPeriod: true },
    });
    if (!item) throw new NotFoundException('Histórico de fechamento não encontrado');
    return item;
  }
  async close(dto: ClosePayrollPeriodDto) {
    const period = await this.prisma.payrollPeriod.findUnique({
      where: { id: dto.payrollPeriodId },
    });
    if (!period) throw new NotFoundException('Competência não encontrada');
    if (period.status === 'CLOSED') throw new ConflictException('Competência já está fechada');
    const completed = await this.prisma.payrollRun.findFirst({
      where: { payrollPeriodId: period.id, status: 'COMPLETED' },
      orderBy: { sequence: 'desc' },
    });
    if (!completed) throw new ConflictException('Fechamento requer execução técnica concluída');
    const blocking = await this.prisma.payrollRunMessage.count({
      where: {
        payrollRun: { payrollPeriodId: period.id },
        severity: 'BLOCKING_ERROR',
        resolvedAt: null,
      },
    });
    if (blocking) throw new ConflictException('Há erros bloqueantes para fechamento');
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.payrollPeriod.update({
        where: { id: period.id },
        data: {
          status: 'CLOSED',
          closedAt: new Date(),
          engineVersion: completed.engineVersion,
          parameterVersion: completed.parameterVersion,
        },
      });
      return tx.payrollPeriodClosure.create({
        data: {
          payrollPeriodId: period.id,
          action: 'CLOSED',
          reason: dto.reason,
          engineVersion: updated.engineVersion,
          parameterVersion: updated.parameterVersion,
        },
      });
    });
  }
  async reopen(payrollPeriodId: string, dto: ReopenPayrollPeriodDto) {
    const period = await this.prisma.payrollPeriod.findUnique({ where: { id: payrollPeriodId } });
    if (!period) throw new NotFoundException('Competência não encontrada');
    if (period.status !== 'CLOSED')
      throw new ConflictException('Somente competência fechada pode ser reaberta');
    return this.prisma.$transaction(async (tx) => {
      await tx.payrollPeriod.update({
        where: { id: period.id },
        data: { status: 'OPEN', reopenedAt: new Date() },
      });
      return tx.payrollPeriodClosure.create({
        data: {
          payrollPeriodId: period.id,
          action: 'REOPENED',
          reason: dto.reason,
          engineVersion: period.engineVersion,
          parameterVersion: period.parameterVersion,
        },
      });
    });
  }
}

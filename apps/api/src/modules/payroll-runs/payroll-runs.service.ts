import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreatePayrollRunDto,
  CreatePayrollRunMessageDto,
  PayrollRunQueryDto,
} from './payroll-runs.dto';
@Injectable()
export class PayrollRunsService {
  constructor(private readonly prisma: PrismaService) {}
  async list(q: PayrollRunQueryDto) {
    const where = { payrollPeriodId: q.payrollPeriodId, status: q.status };
    const [items, totalItems] = await this.prisma.$transaction([
      this.prisma.payrollRun.findMany({
        where,
        include: { messages: true },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        orderBy: { [q.sortBy]: q.sortDirection },
      }),
      this.prisma.payrollRun.count({ where }),
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
    const item = await this.prisma.payrollRun.findUnique({
      where: { id },
      include: { messages: true, employees: { include: { calculationItems: true } } },
    });
    if (!item) throw new NotFoundException('Execução não encontrada');
    return item;
  }
  async start(dto: CreatePayrollRunDto) {
    const period = await this.prisma.payrollPeriod.findUnique({
      where: { id: dto.payrollPeriodId },
    });
    if (!period) throw new NotFoundException('Competência não encontrada');
    if (period.status === 'CLOSED')
      throw new ConflictException('Competência fechada não pode ser executada');
    const running = await this.prisma.payrollRun.count({
      where: { payrollPeriodId: period.id, status: 'RUNNING' },
    });
    if (running) throw new ConflictException('Já existe execução em andamento para a competência');
    return this.prisma.$transaction(async (tx) => {
      const sequence = (await tx.payrollRun.count({ where: { payrollPeriodId: period.id } })) + 1;
      const run = await tx.payrollRun.create({
        data: {
          payrollPeriodId: period.id,
          sequence,
          status: 'COMPLETED',
          engineVersion: dto.engineVersion,
          parameterVersion: dto.parameterSnapshotVersion,
          parameterSnapshot: {
            ...dto.parameterSnapshot,
            technicalNotes: dto.technicalNotes,
            disclaimer: 'Execução estrutural demonstrativa; não representa folha homologada.',
          },
          startedAt: new Date(),
          completedAt: new Date(),
        },
      });
      await tx.payrollRunMessage.create({
        data: {
          payrollRunId: run.id,
          severity: 'WARNING',
          code: 'DEMONSTRATIVE_RUN',
          message: 'Execução técnica demonstrativa sem cálculo legal homologado.',
        },
      });
      return run;
    });
  }
  async addMessage(id: string, dto: CreatePayrollRunMessageDto) {
    await this.find(id);
    return this.prisma.payrollRunMessage.create({ data: { payrollRunId: id, ...dto } });
  }
  async messages(id: string) {
    await this.find(id);
    return this.prisma.payrollRunMessage.findMany({
      where: { payrollRunId: id },
      orderBy: { createdAt: 'asc' },
    });
  }
}

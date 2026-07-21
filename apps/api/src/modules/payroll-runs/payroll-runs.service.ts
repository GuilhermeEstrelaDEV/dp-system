import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CalculationInput,
  PayrollCalculationService,
  PayrollNature,
} from './domain/payroll-calculation.service';
import {
  CreatePayrollRunDto,
  CreatePayrollRunMessageDto,
  PayrollRunQueryDto,
} from './payroll-runs.dto';

@Injectable()
export class PayrollRunsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calculator: PayrollCalculationService,
  ) {}

  async list(q: PayrollRunQueryDto) {
    const where = { payrollPeriodId: q.payrollPeriodId, status: q.status };
    const [items, totalItems] = await this.prisma.$transaction([
      this.prisma.payrollRun.findMany({
        where,
        include: { messages: true, employees: true },
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
          status: 'RUNNING',
          engineVersion: dto.engineVersion,
          parameterVersion: dto.parameterSnapshotVersion,
          parameterSnapshot: {
            ...dto.parameterSnapshot,
            technicalNotes: dto.technicalNotes,
            disclaimer: 'Cálculo configurável; não representa folha legal homologada.',
          },
          startedAt: new Date(),
        },
      });
      const inputs = await tx.payrollInput.findMany({
        where: { payrollPeriodId: period.id, status: 'PENDING' },
        include: {
          payrollRubric: { include: { payrollRubricCategory: true, versions: true } },
        },
        orderBy: { createdAt: 'asc' },
      });
      const invalidNatures = [
        ...new Set(
          inputs
            .map((input) => input.payrollRubric.payrollRubricCategory.nature)
            .filter((nature) => nature !== 'EARNING' && nature !== 'DEDUCTION'),
        ),
      ];
      if (invalidNatures.length) {
        await tx.payrollRunMessage.create({
          data: {
            payrollRunId: run.id,
            severity: 'BLOCKING_ERROR',
            code: 'UNSUPPORTED_RUBRIC_NATURE',
            message: `Natureza de rubrica não suportada: ${invalidNatures.join(', ')}`,
          },
        });
        return tx.payrollRun.update({
          where: { id: run.id },
          data: { status: 'FAILED', completedAt: new Date() },
        });
      }

      const byContract = new Map<string, CalculationInput[]>();
      for (const input of inputs) {
        const version = input.payrollRubric.versions.find(
          (candidate) =>
            candidate.status === 'ACTIVE' &&
            candidate.validFrom <= period.referenceDate &&
            (!candidate.validTo || candidate.validTo >= period.referenceDate),
        );
        if (!version) {
          await tx.payrollRunMessage.create({
            data: {
              payrollRunId: run.id,
              severity: 'BLOCKING_ERROR',
              code: 'RUBRIC_VERSION_NOT_FOUND',
              message: `Rubrica ${input.payrollRubric.code} sem versão vigente na competência.`,
              metadata: { payrollInputId: input.id, payrollRubricId: input.payrollRubricId },
            },
          });
          continue;
        }
        const calculationInput: CalculationInput = {
          inputId: input.id,
          rubricId: input.payrollRubricId,
          rubricVersionId: version.id,
          amount: input.amount.toString(),
          quantity: input.quantity?.toString() ?? null,
          nature: input.payrollRubric.payrollRubricCategory.nature as PayrollNature,
        };
        byContract.set(input.employmentContractId, [
          ...(byContract.get(input.employmentContractId) ?? []),
          calculationInput,
        ]);
      }
      for (const [employmentContractId, contractInputs] of byContract) {
        const calculation = this.calculator.calculate(contractInputs);
        const employee = await tx.payrollRunEmployee.create({
          data: {
            payrollRunId: run.id,
            employmentContractId,
            status: 'CALCULATED',
            grossAmount: new Prisma.Decimal(calculation.grossAmount),
            netAmount: new Prisma.Decimal(calculation.netAmount),
            calculationMemory: calculation.memory,
          },
        });
        await tx.payrollCalculationItem.createMany({
          data: calculation.items.map((item) => ({
            payrollRunEmployeeId: employee.id,
            payrollRubricId: item.rubricId,
            payrollRubricVersionId: item.rubricVersionId,
            baseAmount: new Prisma.Decimal(item.baseAmount),
            amount: new Prisma.Decimal(item.amount),
            calculationMemory: item.memory,
          })),
        });
      }
      const blockingErrors = await tx.payrollRunMessage.count({
        where: { payrollRunId: run.id, severity: 'BLOCKING_ERROR' },
      });
      await tx.payrollRunMessage.create({
        data: {
          payrollRunId: run.id,
          severity: 'WARNING',
          code: 'DEMONSTRATIVE_RUN',
          message:
            'Cálculo determinístico de lançamentos configurados, sem regras legais homologadas.',
        },
      });
      return tx.payrollRun.update({
        where: { id: run.id },
        data: { status: blockingErrors ? 'FAILED' : 'COMPLETED', completedAt: new Date() },
      });
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

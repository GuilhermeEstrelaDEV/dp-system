import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditWriterService } from '../auth/audit-writer.service';
import { AuthorizationService } from '../auth/authorization.service';
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

const payrollRunMessageProjection = {
  id: true,
  severity: true,
  code: true,
  message: true,
  resolvedAt: true,
  createdAt: true,
} satisfies Prisma.PayrollRunMessageSelect;

const payrollRunProjection = {
  id: true,
  payrollPeriodId: true,
  sequence: true,
  status: true,
  engineVersion: true,
  parameterVersion: true,
  startedAt: true,
  completedAt: true,
  createdAt: true,
  messages: { select: payrollRunMessageProjection, orderBy: { createdAt: 'asc' as const } },
  employees: {
    select: {
      id: true,
      employmentContractId: true,
      status: true,
      grossAmount: true,
      netAmount: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' as const },
  },
} satisfies Prisma.PayrollRunSelect;

@Injectable()
export class PayrollRunsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calculator: PayrollCalculationService,
    private readonly audit: AuditWriterService,
    private readonly authorization: AuthorizationService,
  ) {}

  async list(q: PayrollRunQueryDto, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'payroll.run.read');
    const where: Prisma.PayrollRunWhereInput = {
      payrollPeriodId: q.payrollPeriodId,
      status: q.status,
      payrollPeriod: { companyId: principal.activeCompanyId! },
    };
    const [items, totalItems] = await this.prisma.$transaction([
      this.prisma.payrollRun.findMany({
        where,
        select: payrollRunProjection,
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

  async find(id: string, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'payroll.run.read');
    return this.findInCompany(id, principal.activeCompanyId!);
  }

  async start(dto: CreatePayrollRunDto, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'payroll.run.manage');
    const companyId = principal.activeCompanyId!;
    const period = await this.prisma.payrollPeriod.findFirst({
      where: { id: dto.payrollPeriodId, companyId },
      select: { id: true, status: true, referenceDate: true },
    });
    if (!period) throw new NotFoundException('Competência não encontrada');
    if (period.status === 'CLOSED') {
      throw new ConflictException('Competência fechada não pode ser executada');
    }
    const running = await this.prisma.payrollRun.count({
      where: { payrollPeriodId: period.id, status: 'RUNNING', payrollPeriod: { companyId } },
    });
    if (running) throw new ConflictException('Já existe execução em andamento para a competência');

    return this.audit.transaction(async (tx) => {
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
        select: { id: true },
      });
      const inputs = await tx.payrollInput.findMany({
        where: {
          payrollPeriodId: period.id,
          status: 'PENDING',
          payrollPeriod: { companyId },
          employmentContract: { companyId },
        },
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
        return this.completeRun(tx, run.id, 'FAILED', principal);
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
      return this.completeRun(tx, run.id, blockingErrors ? 'FAILED' : 'COMPLETED', principal);
    });
  }

  async addMessage(id: string, dto: CreatePayrollRunMessageDto, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'payroll.run.manage');
    const run = await this.findInCompany(id, principal.activeCompanyId!);
    return this.audit.transaction(async (tx) => {
      const message = await tx.payrollRunMessage.create({
        data: { payrollRunId: id, ...dto },
        select: payrollRunMessageProjection,
      });
      await this.audit.append(
        {
          principal,
          action: 'PAYROLL_RUN_MESSAGE_CREATED',
          entityType: 'PayrollRunMessage',
          entityId: message.id,
          nextState: { severity: message.severity, code: message.code },
          metadata: { payrollRunId: run.id },
        },
        tx,
      );
      return message;
    });
  }

  async messages(id: string, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'payroll.run.read');
    await this.findInCompany(id, principal.activeCompanyId!);
    return this.prisma.payrollRunMessage.findMany({
      where: {
        payrollRunId: id,
        payrollRun: { payrollPeriod: { companyId: principal.activeCompanyId! } },
      },
      select: payrollRunMessageProjection,
      orderBy: { createdAt: 'asc' },
    });
  }

  private async findInCompany(id: string, companyId: string) {
    const item = await this.prisma.payrollRun.findFirst({
      where: { id, payrollPeriod: { companyId } },
      select: payrollRunProjection,
    });
    if (!item) throw new NotFoundException('Execução não encontrada');
    return item;
  }

  private async completeRun(
    tx: Prisma.TransactionClient,
    id: string,
    status: 'COMPLETED' | 'FAILED',
    principal: AuthenticatedPrincipal,
  ) {
    const updated = await tx.payrollRun.update({
      where: { id },
      data: { status, completedAt: new Date() },
      select: payrollRunProjection,
    });
    await this.audit.append(
      {
        principal,
        action: 'PAYROLL_RUN_STARTED',
        entityType: 'PayrollRun',
        entityId: id,
        previousState: { status: 'RUNNING' },
        nextState: { status: updated.status },
      },
      tx,
    );
    return updated;
  }
}

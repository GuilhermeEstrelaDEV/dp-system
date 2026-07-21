import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateOffCyclePaymentDto,
  CreatePayrollReconciliationDto,
  CreateSalaryAdvanceDto,
  CreateVariableCompensationEventDto,
  VariableCompensationQueryDto,
} from './variable-compensation.dto';

@Injectable()
export class VariableCompensationService {
  constructor(private readonly prisma: PrismaService) {}

  listEvents(query: VariableCompensationQueryDto) {
    return this.prisma.variableCompensationEvent.findMany({
      where: {
        employmentContractId: query.employmentContractId,
        referencePeriod: query.referencePeriod ? new Date(query.referencePeriod) : undefined,
        approvalStatus: query.status,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  listAdvances(query: VariableCompensationQueryDto) {
    return this.prisma.salaryAdvance.findMany({
      where: {
        employmentContractId: query.employmentContractId,
        referencePeriod: query.referencePeriod ? new Date(query.referencePeriod) : undefined,
        status: query.status,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  listOffCyclePayments(query: VariableCompensationQueryDto) {
    return this.prisma.offCyclePayment.findMany({
      where: {
        employmentContractId: query.employmentContractId,
        referencePeriod: query.referencePeriod ? new Date(query.referencePeriod) : undefined,
        approvalStatus: query.status,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  listReconciliations(payrollRunId?: string, status?: string) {
    return this.prisma.payrollReconciliation.findMany({
      where: { payrollRunId, status },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createEvent(dto: CreateVariableCompensationEventDto) {
    await this.requireContract(dto.employmentContractId);
    return this.prisma.variableCompensationEvent.create({
      data: {
        employmentContractId: dto.employmentContractId,
        referencePeriod: new Date(dto.referencePeriod),
        type: dto.type,
        amount: new Prisma.Decimal(dto.amount),
        policyReference: dto.policyReference,
      },
    });
  }

  async createAdvance(dto: CreateSalaryAdvanceDto) {
    await this.requireContract(dto.employmentContractId);
    return this.prisma.salaryAdvance.create({
      data: {
        employmentContractId: dto.employmentContractId,
        referencePeriod: new Date(dto.referencePeriod),
        amount: new Prisma.Decimal(dto.amount),
        paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : undefined,
      },
    });
  }

  async createOffCyclePayment(dto: CreateOffCyclePaymentDto) {
    await this.requireContract(dto.employmentContractId);
    return this.prisma.offCyclePayment.create({
      data: {
        employmentContractId: dto.employmentContractId,
        referencePeriod: new Date(dto.referencePeriod),
        amount: new Prisma.Decimal(dto.amount),
        reason: dto.reason,
      },
    });
  }

  async createReconciliation(dto: CreatePayrollReconciliationDto) {
    const run = await this.prisma.payrollRun.findUnique({ where: { id: dto.payrollRunId } });
    if (!run) throw new NotFoundException('Execução de folha não encontrada');
    return this.prisma.payrollReconciliation.create({
      data: {
        payrollRunId: dto.payrollRunId,
        type: dto.type,
        differenceAmount: new Prisma.Decimal(dto.differenceAmount),
        notes: dto.notes,
      },
    });
  }

  private async requireContract(id: string) {
    const contract = await this.prisma.employmentContract.findUnique({ where: { id } });
    if (!contract) throw new NotFoundException('Contrato não encontrado');
    return contract;
  }
}

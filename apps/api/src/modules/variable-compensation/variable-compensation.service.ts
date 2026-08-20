import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditWriterService } from '../auth/audit-writer.service';
import { AuthorizationService } from '../auth/authorization.service';
import {
  CreateOffCyclePaymentDto,
  CreatePayrollReconciliationDto,
  CreateSalaryAdvanceDto,
  CreateVariableCompensationEventDto,
  VariableCompensationQueryDto,
} from './variable-compensation.dto';

const eventProjection = {
  id: true,
  employmentContractId: true,
  referencePeriod: true,
  type: true,
  amount: true,
  approvalStatus: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.VariableCompensationEventSelect;

const advanceProjection = {
  id: true,
  employmentContractId: true,
  referencePeriod: true,
  amount: true,
  status: true,
  paymentDate: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.SalaryAdvanceSelect;

const offCycleProjection = {
  id: true,
  employmentContractId: true,
  referencePeriod: true,
  amount: true,
  approvalStatus: true,
  paidAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.OffCyclePaymentSelect;

const reconciliationProjection = {
  id: true,
  payrollRunId: true,
  type: true,
  status: true,
  differenceAmount: true,
  resolvedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PayrollReconciliationSelect;

@Injectable()
export class VariableCompensationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditWriterService,
    private readonly authorization: AuthorizationService,
  ) {}

  async listEvents(query: VariableCompensationQueryDto, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'variable_compensation.read');
    const companyId = this.companyId(principal);
    if (query.employmentContractId)
      await this.requireContract(query.employmentContractId, companyId);
    return this.prisma.variableCompensationEvent.findMany({
      where: {
        employmentContractId: query.employmentContractId,
        employmentContract: { companyId },
        referencePeriod: query.referencePeriod ? new Date(query.referencePeriod) : undefined,
        approvalStatus: query.status,
      },
      select: eventProjection,
      orderBy: { createdAt: 'desc' },
    });
  }

  async listAdvances(query: VariableCompensationQueryDto, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'variable_compensation.read');
    const companyId = this.companyId(principal);
    if (query.employmentContractId)
      await this.requireContract(query.employmentContractId, companyId);
    return this.prisma.salaryAdvance.findMany({
      where: {
        employmentContractId: query.employmentContractId,
        employmentContract: { companyId },
        referencePeriod: query.referencePeriod ? new Date(query.referencePeriod) : undefined,
        status: query.status,
      },
      select: advanceProjection,
      orderBy: { createdAt: 'desc' },
    });
  }

  async listOffCyclePayments(
    query: VariableCompensationQueryDto,
    principal: AuthenticatedPrincipal,
  ) {
    this.authorization.requireCapability(principal, 'variable_compensation.read');
    const companyId = this.companyId(principal);
    if (query.employmentContractId)
      await this.requireContract(query.employmentContractId, companyId);
    return this.prisma.offCyclePayment.findMany({
      where: {
        employmentContractId: query.employmentContractId,
        employmentContract: { companyId },
        referencePeriod: query.referencePeriod ? new Date(query.referencePeriod) : undefined,
        approvalStatus: query.status,
      },
      select: offCycleProjection,
      orderBy: { createdAt: 'desc' },
    });
  }

  async listReconciliations(
    principal: AuthenticatedPrincipal,
    payrollRunId?: string,
    status?: string,
  ) {
    this.authorization.requireCapability(principal, 'variable_compensation.read');
    const companyId = this.companyId(principal);
    if (payrollRunId) await this.requirePayrollRun(payrollRunId, companyId);
    return this.prisma.payrollReconciliation.findMany({
      where: {
        payrollRunId,
        status,
        payrollRun: { payrollPeriod: { companyId } },
      },
      select: reconciliationProjection,
      orderBy: { createdAt: 'desc' },
    });
  }

  async createEvent(dto: CreateVariableCompensationEventDto, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'variable_compensation.manage');
    await this.requireContract(dto.employmentContractId, this.companyId(principal));
    return this.audit.transaction(async (tx) => {
      const created = await tx.variableCompensationEvent.create({
        data: {
          employmentContractId: dto.employmentContractId,
          referencePeriod: new Date(dto.referencePeriod),
          type: dto.type,
          amount: new Prisma.Decimal(dto.amount),
          policyReference: dto.policyReference,
        },
        select: eventProjection,
      });
      await this.audit.append(
        {
          principal,
          action: 'VARIABLE_COMPENSATION_EVENT_CREATED',
          entityType: 'VariableCompensationEvent',
          entityId: created.id,
          nextState: { status: created.approvalStatus },
        },
        tx,
      );
      return created;
    });
  }

  async createAdvance(dto: CreateSalaryAdvanceDto, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'variable_compensation.manage');
    await this.requireContract(dto.employmentContractId, this.companyId(principal));
    return this.audit.transaction(async (tx) => {
      const created = await tx.salaryAdvance.create({
        data: {
          employmentContractId: dto.employmentContractId,
          referencePeriod: new Date(dto.referencePeriod),
          amount: new Prisma.Decimal(dto.amount),
          paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : undefined,
        },
        select: advanceProjection,
      });
      await this.audit.append(
        {
          principal,
          action: 'SALARY_ADVANCE_CREATED',
          entityType: 'SalaryAdvance',
          entityId: created.id,
          nextState: { status: created.status },
        },
        tx,
      );
      return created;
    });
  }

  async createOffCyclePayment(dto: CreateOffCyclePaymentDto, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'variable_compensation.manage');
    await this.requireContract(dto.employmentContractId, this.companyId(principal));
    return this.audit.transaction(async (tx) => {
      const created = await tx.offCyclePayment.create({
        data: {
          employmentContractId: dto.employmentContractId,
          referencePeriod: new Date(dto.referencePeriod),
          amount: new Prisma.Decimal(dto.amount),
          reason: dto.reason,
        },
        select: offCycleProjection,
      });
      await this.audit.append(
        {
          principal,
          action: 'OFF_CYCLE_PAYMENT_CREATED',
          entityType: 'OffCyclePayment',
          entityId: created.id,
          nextState: { status: created.approvalStatus },
        },
        tx,
      );
      return created;
    });
  }

  async createReconciliation(
    dto: CreatePayrollReconciliationDto,
    principal: AuthenticatedPrincipal,
  ) {
    this.authorization.requireCapability(principal, 'variable_compensation.manage');
    await this.requirePayrollRun(dto.payrollRunId, this.companyId(principal));
    return this.audit.transaction(async (tx) => {
      const created = await tx.payrollReconciliation.create({
        data: {
          payrollRunId: dto.payrollRunId,
          type: dto.type,
          differenceAmount: new Prisma.Decimal(dto.differenceAmount),
          notes: dto.notes,
        },
        select: reconciliationProjection,
      });
      await this.audit.append(
        {
          principal,
          action: 'PAYROLL_RECONCILIATION_CREATED',
          entityType: 'PayrollReconciliation',
          entityId: created.id,
          nextState: { status: created.status },
        },
        tx,
      );
      return created;
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

  private async requirePayrollRun(id: string, companyId: string) {
    const run = await this.prisma.payrollRun.findFirst({
      where: { id, payrollPeriod: { companyId } },
      select: { id: true, status: true },
    });
    if (!run) throw new NotFoundException('Execução de folha não encontrada');
    return run;
  }

  private companyId(principal: AuthenticatedPrincipal): string {
    if (!principal.activeCompanyId) throw new NotFoundException('Recurso não encontrado');
    return principal.activeCompanyId;
  }
}

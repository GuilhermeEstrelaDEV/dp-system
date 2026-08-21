import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditWriterService } from '../auth/audit-writer.service';
import { AuthorizationService } from '../auth/authorization.service';
import {
  CreatePayrollInputDto,
  PayrollInputQueryDto,
  UpdatePayrollInputDto,
} from './payroll-inputs.dto';

const payrollInputProjection = {
  id: true,
  payrollPeriodId: true,
  employmentContractId: true,
  payrollRubricId: true,
  amount: true,
  quantity: true,
  source: true,
  sourceKey: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  payrollPeriod: { select: { id: true, referenceDate: true, status: true } },
  employmentContract: { select: { id: true, employeeId: true, status: true } },
  payrollRubric: { select: { id: true, code: true, name: true, status: true } },
} satisfies Prisma.PayrollInputSelect;

@Injectable()
export class PayrollInputsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditWriterService,
    private readonly authorization: AuthorizationService,
  ) {}

  async list(q: PayrollInputQueryDto, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'payroll.input.read');
    const companyId = principal.activeCompanyId!;
    if (q.companyId && q.companyId !== companyId)
      throw new NotFoundException('Empresa não encontrada');
    const where: Prisma.PayrollInputWhereInput = {
      payrollPeriodId: q.payrollPeriodId,
      employmentContractId: q.employmentContractId,
      payrollRubricId: q.payrollRubricId,
      status: q.status,
      source: q.sourceType,
      payrollPeriod: { companyId },
      employmentContract: q.employeeId ? { companyId, employeeId: q.employeeId } : { companyId },
      sourceKey: q.search ? { contains: q.search, mode: 'insensitive' } : undefined,
    };
    const [items, totalItems] = await this.prisma.$transaction([
      this.prisma.payrollInput.findMany({
        where,
        select: payrollInputProjection,
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        orderBy: { [q.sortBy]: q.sortDirection },
      }),
      this.prisma.payrollInput.count({ where }),
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
    this.authorization.requireCapability(principal, 'payroll.input.read');
    return this.findInCompany(id, principal.activeCompanyId!);
  }

  async create(dto: CreatePayrollInputDto, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'payroll.input.manage');
    const companyId = principal.activeCompanyId!;
    const [period, contract, rubric] = await Promise.all([
      this.prisma.payrollPeriod.findFirst({
        where: { id: dto.payrollPeriodId, companyId },
        select: { id: true, status: true, referenceDate: true },
      }),
      this.prisma.employmentContract.findFirst({
        where: { id: dto.employmentContractId, companyId },
        select: { id: true, employeeId: true },
      }),
      this.prisma.payrollRubric.findFirst({
        where: { id: dto.payrollRubricId, companyId },
        select: {
          id: true,
          status: true,
          versions: { select: { status: true, validFrom: true, validTo: true } },
        },
      }),
    ]);
    if (!period || !contract || !rubric) {
      throw new NotFoundException('Competência, contrato ou rubrica não encontrada');
    }
    if (period.status === 'CLOSED') {
      throw new ConflictException('Competência fechada não aceita lançamentos');
    }
    if (contract.employeeId !== dto.employeeId) {
      throw new ConflictException('Contrato incompatível com colaborador');
    }
    const activeVersion = rubric.versions.find(
      (version) =>
        version.status === 'ACTIVE' &&
        version.validFrom <= period.referenceDate &&
        (!version.validTo || version.validTo >= period.referenceDate),
    );
    if (rubric.status !== 'ACTIVE' || !activeVersion) {
      throw new ConflictException('Rubrica inativa ou fora da vigência');
    }
    try {
      return await this.audit.transaction(async (tx) => {
        const input = await tx.payrollInput.create({
          data: {
            payrollPeriodId: dto.payrollPeriodId,
            employmentContractId: dto.employmentContractId,
            payrollRubricId: dto.payrollRubricId,
            amount: new Prisma.Decimal(dto.amount),
            quantity: dto.quantity ? new Prisma.Decimal(dto.quantity) : null,
            source: dto.sourceType ?? 'MANUAL',
            sourceKey: dto.sourceKey,
            metadata: dto.technicalNotes ? { technicalNotes: dto.technicalNotes } : undefined,
          },
          select: payrollInputProjection,
        });
        await this.audit.append(
          {
            principal,
            action: 'PAYROLL_INPUT_CREATED',
            entityType: 'PayrollInput',
            entityId: input.id,
            nextState: { status: input.status, source: input.source },
          },
          tx,
        );
        return input;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Chave de origem já utilizada nesta competência');
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdatePayrollInputDto, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'payroll.input.manage');
    const item = await this.findInCompany(id, principal.activeCompanyId!);
    if (item.payrollPeriod.status === 'CLOSED') {
      throw new ConflictException('Lançamento de competência fechada é imutável');
    }
    return this.audit.transaction(async (tx) => {
      const updated = await tx.payrollInput.update({
        where: { id },
        data: {
          amount: dto.amount ? new Prisma.Decimal(dto.amount) : undefined,
          quantity: dto.quantity ? new Prisma.Decimal(dto.quantity) : undefined,
          status: dto.status,
          metadata: dto.technicalNotes ? { technicalNotes: dto.technicalNotes } : undefined,
        },
        select: payrollInputProjection,
      });
      await this.audit.append(
        {
          principal,
          action: 'PAYROLL_INPUT_UPDATED',
          entityType: 'PayrollInput',
          entityId: id,
          previousState: { status: item.status },
          nextState: { status: updated.status },
        },
        tx,
      );
      return updated;
    });
  }

  private async findInCompany(id: string, companyId: string) {
    const item = await this.prisma.payrollInput.findFirst({
      where: { id, payrollPeriod: { companyId }, employmentContract: { companyId } },
      select: payrollInputProjection,
    });
    if (!item) throw new NotFoundException('Lançamento não encontrado');
    return item;
  }
}

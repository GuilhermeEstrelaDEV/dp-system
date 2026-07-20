import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreatePayrollInputDto,
  PayrollInputQueryDto,
  UpdatePayrollInputDto,
} from './payroll-inputs.dto';
@Injectable()
export class PayrollInputsService {
  constructor(private readonly prisma: PrismaService) {}
  async list(q: PayrollInputQueryDto) {
    const where: Prisma.PayrollInputWhereInput = {
      payrollPeriodId: q.payrollPeriodId,
      employmentContractId: q.employmentContractId,
      payrollRubricId: q.payrollRubricId,
      status: q.status,
      source: q.sourceType,
      payrollPeriod: q.companyId ? { companyId: q.companyId } : undefined,
      employmentContract: q.employeeId ? { employeeId: q.employeeId } : undefined,
      sourceKey: q.search ? { contains: q.search, mode: 'insensitive' } : undefined,
    };
    const [items, totalItems] = await this.prisma.$transaction([
      this.prisma.payrollInput.findMany({
        where,
        include: { payrollPeriod: true, employmentContract: true, payrollRubric: true },
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
  async find(id: string) {
    const item = await this.prisma.payrollInput.findUnique({
      where: { id },
      include: { payrollPeriod: true, employmentContract: true, payrollRubric: true },
    });
    if (!item) throw new NotFoundException('Lançamento não encontrado');
    return item;
  }
  async create(dto: CreatePayrollInputDto) {
    const [period, contract, rubric] = await Promise.all([
      this.prisma.payrollPeriod.findUnique({ where: { id: dto.payrollPeriodId } }),
      this.prisma.employmentContract.findUnique({ where: { id: dto.employmentContractId } }),
      this.prisma.payrollRubric.findUnique({
        where: { id: dto.payrollRubricId },
        include: { versions: true },
      }),
    ]);
    if (!period || !contract || !rubric)
      throw new NotFoundException('Competência, contrato ou rubrica não encontrada');
    if (period.status === 'CLOSED')
      throw new ConflictException('Competência fechada não aceita lançamentos');
    if (contract.employeeId !== dto.employeeId || contract.companyId !== period.companyId)
      throw new ConflictException('Contrato incompatível com colaborador ou competência');
    const activeVersion = rubric.versions.find(
      (v) =>
        v.status === 'ACTIVE' &&
        v.validFrom <= period.referenceDate &&
        (!v.validTo || v.validTo >= period.referenceDate),
    );
    if (rubric.status !== 'ACTIVE' || !activeVersion)
      throw new ConflictException('Rubrica inativa ou fora da vigência');
    try {
      return await this.prisma.payrollInput.create({
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
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
        throw new ConflictException('Chave de origem já utilizada nesta competência');
      throw error;
    }
  }
  async update(id: string, dto: UpdatePayrollInputDto) {
    const item = await this.find(id);
    if (item.payrollPeriod.status === 'CLOSED')
      throw new ConflictException('Lançamento de competência fechada é imutável');
    return this.prisma.payrollInput.update({
      where: { id },
      data: {
        amount: dto.amount ? new Prisma.Decimal(dto.amount) : undefined,
        quantity: dto.quantity ? new Prisma.Decimal(dto.quantity) : undefined,
        status: dto.status,
        metadata: dto.technicalNotes ? { technicalNotes: dto.technicalNotes } : undefined,
      },
    });
  }
}

import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { RecordStatus } from '../organizational/common.dto';
import {
  CreateEmploymentContractDto,
  EmploymentContractListQueryDto,
  UpdateEmploymentContractDto,
} from './employment-contracts.dto';

type ContractInput = Omit<CreateEmploymentContractDto, 'reason'>;

@Injectable()
export class EmploymentContractsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: EmploymentContractListQueryDto) {
    const where: Prisma.EmploymentContractWhereInput = {
      employeeId: query.employeeId,
      companyId: query.companyId,
      branchId: query.branchId,
      departmentId: query.departmentId,
      positionId: query.positionId,
      status: query.status,
      OR: query.search
        ? [
            { registrationNumber: { contains: query.search, mode: 'insensitive' } },
            { employee: { legalName: { contains: query.search, mode: 'insensitive' } } },
          ]
        : undefined,
    };
    const include = {
      employee: true,
      company: true,
      branch: true,
      department: true,
      position: true,
      costCenter: true,
    };
    const [items, totalItems] = await this.prisma.$transaction([
      this.prisma.employmentContract.findMany({
        where,
        include,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { [query.sortBy]: query.sortDirection },
      }),
      this.prisma.employmentContract.count({ where }),
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
    const entity = await this.prisma.employmentContract.findUnique({
      where: { id },
      include: {
        employee: true,
        company: true,
        branch: true,
        department: true,
        position: true,
        costCenter: true,
        history: { orderBy: { occurredAt: 'desc' } },
      },
    });
    if (!entity) throw new NotFoundException('Contrato não encontrado');
    return entity;
  }

  async create(dto: CreateEmploymentContractDto) {
    const { reason, ...data } = dto;
    await this.validateInput(data);
    await this.assertNoActiveContract(data.employeeId, data.companyId);
    try {
      return await this.prisma.$transaction(async (tx) => {
        const entity = await tx.employmentContract.create({ data: this.toPrismaData(data) });
        await tx.contractHistory.create({
          data: { employmentContractId: entity.id, action: 'CREATED', reason },
        });
        return entity;
      });
    } catch (error) {
      this.handleDuplicate(error);
    }
  }

  async update(id: string, dto: UpdateEmploymentContractDto) {
    const current = await this.find(id);
    const { reason, ...changes } = dto;
    const candidate: ContractInput = {
      employeeId: changes.employeeId ?? current.employeeId,
      companyId: changes.companyId ?? current.companyId,
      branchId:
        changes.branchId === undefined
          ? (current.branchId ?? undefined)
          : (changes.branchId ?? undefined),
      departmentId:
        changes.departmentId === undefined
          ? (current.departmentId ?? undefined)
          : (changes.departmentId ?? undefined),
      positionId: changes.positionId ?? current.positionId,
      costCenterId:
        changes.costCenterId === undefined
          ? (current.costCenterId ?? undefined)
          : (changes.costCenterId ?? undefined),
      registrationNumber: changes.registrationNumber ?? current.registrationNumber,
      contractType: changes.contractType ?? current.contractType,
      employmentRegime: changes.employmentRegime ?? current.employmentRegime,
      startDate: (changes.startDate ?? current.startDate).toString(),
      endDate:
        changes.endDate === undefined
          ? current.endDate?.toString()
          : (changes.endDate ?? undefined),
      weeklyHours: changes.weeklyHours ?? current.weeklyHours,
    };
    await this.validateInput(candidate);
    if (
      current.status === 'ACTIVE' &&
      (candidate.employeeId !== current.employeeId || candidate.companyId !== current.companyId)
    )
      await this.assertNoActiveContract(candidate.employeeId, candidate.companyId, id);
    try {
      return await this.prisma.$transaction(async (tx) => {
        const entity = await tx.employmentContract.update({
          where: { id },
          data: this.toPrismaData(candidate),
        });
        await tx.contractHistory.create({
          data: { employmentContractId: id, action: 'UPDATED', reason },
        });
        return entity;
      });
    } catch (error) {
      this.handleDuplicate(error);
    }
  }

  async setStatus(id: string, status: RecordStatus, reason?: string) {
    const current = await this.find(id);
    if (current.status === status) return current;
    if (status === 'ACTIVE')
      await this.assertNoActiveContract(current.employeeId, current.companyId, id);
    return this.prisma.$transaction(async (tx) => {
      const entity = await tx.employmentContract.update({ where: { id }, data: { status } });
      await tx.contractHistory.create({
        data: {
          employmentContractId: id,
          action: status === 'ACTIVE' ? 'ACTIVATED' : 'INACTIVATED',
          reason,
        },
      });
      return entity;
    });
  }

  async history(id: string) {
    await this.find(id);
    return this.prisma.contractHistory.findMany({
      where: { employmentContractId: id },
      orderBy: { occurredAt: 'desc' },
    });
  }

  private async validateInput(input: ContractInput) {
    if (input.endDate && new Date(input.endDate) < new Date(input.startDate))
      throw new ConflictException('A data final não pode ser anterior à data inicial');
    const [employee, company, position, branch, department, costCenter] =
      await this.prisma.$transaction([
        this.prisma.employee.findUnique({ where: { id: input.employeeId } }),
        this.prisma.company.findUnique({ where: { id: input.companyId } }),
        this.prisma.position.findUnique({ where: { id: input.positionId } }),
        input.branchId
          ? this.prisma.branch.findUnique({ where: { id: input.branchId } })
          : this.prisma.branch.findFirst({ where: { id: '__none__' } }),
        input.departmentId
          ? this.prisma.department.findUnique({ where: { id: input.departmentId } })
          : this.prisma.department.findFirst({ where: { id: '__none__' } }),
        input.costCenterId
          ? this.prisma.costCenter.findUnique({ where: { id: input.costCenterId } })
          : this.prisma.costCenter.findFirst({ where: { id: '__none__' } }),
      ]);
    if (!employee || employee.status !== 'ACTIVE')
      throw new ConflictException('Colaborador inexistente ou inativo');
    if (!company || company.status !== 'ACTIVE')
      throw new ConflictException('Empresa inexistente ou inativa');
    if (!position || position.status !== 'ACTIVE' || position.companyId !== input.companyId)
      throw new ConflictException('Cargo inexistente, inativo ou fora da empresa');
    if (
      input.branchId &&
      (!branch || branch.status !== 'ACTIVE' || branch.companyId !== input.companyId)
    )
      throw new ConflictException('Filial inexistente, inativa ou fora da empresa');
    if (
      input.departmentId &&
      (!department ||
        department.status !== 'ACTIVE' ||
        department.companyId !== input.companyId ||
        (department.branchId && department.branchId !== input.branchId))
    )
      throw new ConflictException('Departamento incompatível com a empresa ou filial');
    if (
      input.costCenterId &&
      (!costCenter || costCenter.status !== 'ACTIVE' || costCenter.companyId !== input.companyId)
    )
      throw new ConflictException('Centro de custo inexistente, inativo ou fora da empresa');
  }

  private async assertNoActiveContract(employeeId: string, companyId: string, excludedId?: string) {
    const duplicate = await this.prisma.employmentContract.findFirst({
      where: {
        employeeId,
        companyId,
        status: 'ACTIVE',
        id: excludedId ? { not: excludedId } : undefined,
      },
    });
    if (duplicate)
      throw new ConflictException(
        'Já existe um contrato ativo para este colaborador nesta empresa',
      );
  }

  private toPrismaData(input: ContractInput): Prisma.EmploymentContractUncheckedCreateInput {
    return {
      ...input,
      startDate: new Date(input.startDate),
      endDate: input.endDate ? new Date(input.endDate) : null,
    };
  }

  private handleDuplicate(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
      throw new ConflictException('Matrícula já utilizada nesta empresa');
    throw error;
  }
}

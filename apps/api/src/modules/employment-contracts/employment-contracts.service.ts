import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditWriterService } from '../auth/audit-writer.service';
import { AuthorizationService } from '../auth/authorization.service';
import type { RecordStatus } from '../organizational/common.dto';
import {
  CreateEmploymentContractDto,
  EmploymentContractListQueryDto,
  UpdateEmploymentContractDto,
} from './employment-contracts.dto';

type ContractInput = Omit<CreateEmploymentContractDto, 'reason'>;

const contractProjection = {
  id: true,
  employeeId: true,
  companyId: true,
  branchId: true,
  departmentId: true,
  positionId: true,
  costCenterId: true,
  registrationNumber: true,
  contractType: true,
  employmentRegime: true,
  startDate: true,
  endDate: true,
  weeklyHours: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.EmploymentContractSelect;

const relatedProjection = {
  ...contractProjection,
  employee: { select: { id: true, legalName: true, preferredName: true, status: true } },
  company: { select: { id: true, tradeName: true, status: true } },
  branch: { select: { id: true, name: true, status: true } },
  department: { select: { id: true, name: true, status: true } },
  position: { select: { id: true, name: true, status: true } },
  costCenter: { select: { id: true, name: true, status: true } },
} satisfies Prisma.EmploymentContractSelect;

const historyProjection = {
  id: true,
  employmentContractId: true,
  action: true,
  reason: true,
  occurredAt: true,
} satisfies Prisma.ContractHistorySelect;

@Injectable()
export class EmploymentContractsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditWriterService,
    private readonly authorization: AuthorizationService,
  ) {}

  async list(query: EmploymentContractListQueryDto, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'contract.read');
    const companyId = principal.activeCompanyId!;
    const where: Prisma.EmploymentContractWhereInput = {
      employeeId: query.employeeId,
      companyId,
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
    const [items, totalItems] = await this.prisma.$transaction([
      this.prisma.employmentContract.findMany({
        where,
        select: relatedProjection,
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

  async find(id: string, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'contract.read');
    return this.findInCompany(id, principal.activeCompanyId!);
  }

  async create(dto: CreateEmploymentContractDto, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'contract.manage');
    const companyId = principal.activeCompanyId!;
    if (dto.companyId !== companyId) throw new NotFoundException('Empresa não encontrada');
    const { reason, ...input } = dto;
    const data: ContractInput = { ...input, companyId };
    await this.validateInput(data);
    await this.assertEmployeeAvailable(data.employeeId, companyId);
    await this.assertNoActiveContract(data.employeeId, companyId);
    try {
      return await this.audit.transaction(async (tx) => {
        const entity = await tx.employmentContract.create({
          data: this.toPrismaData(data),
          select: contractProjection,
        });
        await tx.contractHistory.create({
          data: { employmentContractId: entity.id, action: 'CREATED', reason },
        });
        await this.audit.append(
          {
            principal,
            action: 'CONTRACT_CREATED',
            entityType: 'EmploymentContract',
            entityId: entity.id,
            nextState: { status: entity.status },
          },
          tx,
        );
        return entity;
      });
    } catch (error) {
      this.handleDuplicate(error);
    }
  }

  async update(id: string, dto: UpdateEmploymentContractDto, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'contract.manage');
    const current = await this.findInCompany(id, principal.activeCompanyId!);
    if (dto.companyId && dto.companyId !== current.companyId)
      throw new ConflictException('A empresa do contrato é imutável');
    if (dto.employeeId && dto.employeeId !== current.employeeId)
      throw new ConflictException('O colaborador do contrato é imutável');
    const { reason, ...changes } = dto;
    const candidate: ContractInput = {
      employeeId: current.employeeId,
      companyId: current.companyId,
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
    try {
      return await this.audit.transaction(async (tx) => {
        const entity = await tx.employmentContract.update({
          where: { id },
          data: this.toPrismaData(candidate),
          select: contractProjection,
        });
        await tx.contractHistory.create({
          data: { employmentContractId: id, action: 'UPDATED', reason },
        });
        await this.audit.append(
          {
            principal,
            action: 'CONTRACT_UPDATED',
            entityType: 'EmploymentContract',
            entityId: id,
            previousState: { status: current.status },
            nextState: { status: entity.status },
          },
          tx,
        );
        return entity;
      });
    } catch (error) {
      this.handleDuplicate(error);
    }
  }

  async setStatus(
    id: string,
    status: RecordStatus,
    reason: string | undefined,
    principal: AuthenticatedPrincipal,
  ) {
    this.authorization.requireCapability(principal, 'contract.manage');
    const current = await this.findInCompany(id, principal.activeCompanyId!);
    if (current.status === status) return current;
    if (status === 'ACTIVE')
      await this.assertNoActiveContract(current.employeeId, current.companyId, id);
    return this.audit.transaction(async (tx) => {
      const entity = await tx.employmentContract.update({
        where: { id },
        data: { status },
        select: contractProjection,
      });
      await tx.contractHistory.create({
        data: {
          employmentContractId: id,
          action: status === 'ACTIVE' ? 'ACTIVATED' : 'INACTIVATED',
          reason,
        },
      });
      await this.audit.append(
        {
          principal,
          action: 'CONTRACT_STATUS_CHANGED',
          entityType: 'EmploymentContract',
          entityId: id,
          previousState: { status: current.status },
          nextState: { status },
          reason,
        },
        tx,
      );
      return entity;
    });
  }

  async history(id: string, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'contract.read');
    await this.findInCompany(id, principal.activeCompanyId!);
    return this.prisma.contractHistory.findMany({
      where: { employmentContractId: id },
      select: historyProjection,
      orderBy: { occurredAt: 'desc' },
    });
  }

  private async findInCompany(id: string, companyId: string) {
    const entity = await this.prisma.employmentContract.findFirst({
      where: { id, companyId },
      select: {
        ...relatedProjection,
        history: { select: historyProjection, orderBy: { occurredAt: 'desc' } },
      },
    });
    if (!entity) throw new NotFoundException('Contrato não encontrado');
    return entity;
  }

  private async validateInput(input: ContractInput) {
    if (input.endDate && new Date(input.endDate) < new Date(input.startDate))
      throw new ConflictException('A data final não pode ser anterior à data inicial');
    const [employee, company, position, branch, department, costCenter] =
      await this.prisma.$transaction((transaction) =>
        Promise.all([
          transaction.employee.findUnique({ where: { id: input.employeeId } }),
          transaction.company.findUnique({ where: { id: input.companyId } }),
          transaction.position.findUnique({ where: { id: input.positionId } }),
          input.branchId
            ? transaction.branch.findUnique({ where: { id: input.branchId } })
            : Promise.resolve(null),
          input.departmentId
            ? transaction.department.findUnique({ where: { id: input.departmentId } })
            : Promise.resolve(null),
          input.costCenterId
            ? transaction.costCenter.findUnique({ where: { id: input.costCenterId } })
            : Promise.resolve(null),
        ] as const),
      );
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

  private async assertEmployeeAvailable(employeeId: string, companyId: string) {
    const contracts = await this.prisma.employmentContract.findMany({
      where: { employeeId },
      select: { companyId: true },
    });
    if (contracts.length > 0 && contracts.every((contract) => contract.companyId !== companyId))
      throw new ConflictException('Colaborador pertence a outro contexto empresarial');
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

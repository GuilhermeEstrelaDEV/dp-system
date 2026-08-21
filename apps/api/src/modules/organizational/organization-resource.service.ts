import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateBranchDto, UpdateBranchDto } from '../branches/branches.dto';
import { AuditWriterService } from '../auth/audit-writer.service';
import { AuthorizationService } from '../auth/authorization.service';
import type { CreateCostCenterDto, UpdateCostCenterDto } from '../cost-centers/cost-centers.dto';
import type { CreateDepartmentDto, UpdateDepartmentDto } from '../departments/departments.dto';
import type { CreatePositionDto, UpdatePositionDto } from '../positions/positions.dto';
import type { CompanyScopedListQueryDto, RecordStatus } from './common.dto';

export type OrganizationResourceKind = 'branch' | 'department' | 'position' | 'costCenter';

type CreateInputByKind = {
  branch: CreateBranchDto;
  department: CreateDepartmentDto;
  position: CreatePositionDto;
  costCenter: CreateCostCenterDto;
};

type UpdateInputByKind = {
  branch: UpdateBranchDto;
  department: UpdateDepartmentDto;
  position: UpdatePositionDto;
  costCenter: UpdateCostCenterDto;
};

const baseProjection = {
  id: true,
  companyId: true,
  code: true,
  name: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

const branchProjection = {
  ...baseProjection,
  taxId: true,
} satisfies Prisma.BranchSelect;

const departmentProjection = {
  ...baseProjection,
  branchId: true,
} satisfies Prisma.DepartmentSelect;

const positionProjection = {
  ...baseProjection,
  description: true,
} satisfies Prisma.PositionSelect;

@Injectable()
export class OrganizationResourceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditWriterService,
    private readonly authorization: AuthorizationService,
  ) {}

  async list(
    kind: OrganizationResourceKind,
    query: CompanyScopedListQueryDto,
    principal: AuthenticatedPrincipal,
  ) {
    this.authorization.requireCapability(principal, 'organization.read');
    const companyId = this.companyId(principal, query.companyId);
    const where = {
      companyId,
      status: query.status,
      OR: query.search
        ? [
            { name: { contains: query.search, mode: 'insensitive' as const } },
            { code: { contains: query.search, mode: 'insensitive' as const } },
          ]
        : undefined,
    };
    const pagination = { skip: (query.page - 1) * query.pageSize, take: query.pageSize };
    const orderBy = { [query.sortBy]: query.sortDirection };
    const [items, totalItems] = await this.listByKind(kind, where, pagination, orderBy);
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

  async find(kind: OrganizationResourceKind, id: string, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'organization.read');
    const companyId = this.companyId(principal);
    const entity = await this.findByKind(kind, id, companyId);
    if (!entity) throw new NotFoundException('Recurso organizacional nÃ£o encontrado');
    return entity;
  }

  async create<K extends OrganizationResourceKind>(
    kind: K,
    dto: CreateInputByKind[K],
    principal: AuthenticatedPrincipal,
  ) {
    this.authorization.requireCapability(principal, 'organization.manage');
    const companyId = this.companyId(principal, dto.companyId);
    await this.assertActiveCompany(companyId);
    if (kind === 'department') {
      const input = dto as CreateDepartmentDto;
      if (input.branchId) await this.assertBranch(input.branchId, companyId);
    }
    try {
      return await this.audit.transaction(async (tx) => {
        const entity = await this.createByKind(tx, kind, dto, companyId);
        await this.audit.append(
          {
            principal,
            action: 'ORGANIZATION_RESOURCE_CREATED',
            entityType: this.entityType(kind),
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

  async update<K extends OrganizationResourceKind>(
    kind: K,
    id: string,
    dto: UpdateInputByKind[K],
    principal: AuthenticatedPrincipal,
  ) {
    this.authorization.requireCapability(principal, 'organization.manage');
    const current = await this.findForWrite(kind, id, principal);
    if (kind === 'department') {
      const input = dto as UpdateDepartmentDto;
      if (input.branchId) await this.assertBranch(input.branchId, current.companyId);
    }
    try {
      return await this.audit.transaction(async (tx) => {
        const entity = await this.updateByKind(tx, kind, id, dto, current.companyId);
        await this.audit.append(
          {
            principal,
            action: 'ORGANIZATION_RESOURCE_UPDATED',
            entityType: this.entityType(kind),
            entityId: entity.id,
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
    kind: OrganizationResourceKind,
    id: string,
    status: RecordStatus,
    principal: AuthenticatedPrincipal,
  ) {
    this.authorization.requireCapability(principal, 'organization.manage');
    const current = await this.findForWrite(kind, id, principal);
    if (current.status === status) return current;
    return this.audit.transaction(async (tx) => {
      const entity = await this.statusByKind(tx, kind, id, status, current.companyId);
      await this.audit.append(
        {
          principal,
          action: 'ORGANIZATION_RESOURCE_STATUS_CHANGED',
          entityType: this.entityType(kind),
          entityId: entity.id,
          previousState: { status: current.status },
          nextState: { status },
        },
        tx,
      );
      return entity;
    });
  }

  private async findForWrite(
    kind: OrganizationResourceKind,
    id: string,
    principal: AuthenticatedPrincipal,
  ) {
    const companyId = this.companyId(principal);
    const entity = await this.findByKind(kind, id, companyId);
    if (!entity) throw new NotFoundException('Recurso organizacional nÃ£o encontrado');
    return entity;
  }

  private companyId(principal: AuthenticatedPrincipal, requested?: string): string {
    const companyId = principal.activeCompanyId;
    if (!companyId) throw new NotFoundException('Recurso organizacional nÃ£o encontrado');
    if (requested && requested !== companyId)
      throw new NotFoundException('Recurso organizacional nÃ£o encontrado');
    return companyId;
  }

  private async assertActiveCompany(id: string): Promise<void> {
    const company = await this.prisma.company.findFirst({ where: { id, status: 'ACTIVE' } });
    if (!company) throw new ConflictException('Empresa inexistente ou inativa');
  }

  private async assertBranch(id: string, companyId: string): Promise<void> {
    const branch = await this.prisma.branch.findFirst({
      where: { id, companyId, status: 'ACTIVE' },
      select: { id: true },
    });
    if (!branch) throw new ConflictException('Filial inexistente, inativa ou fora da empresa');
  }

  private listByKind(
    kind: OrganizationResourceKind,
    where: Prisma.BranchWhereInput,
    pagination: { readonly skip: number; readonly take: number },
    orderBy: Record<string, 'asc' | 'desc'>,
  ): Promise<[readonly object[], number]> {
    switch (kind) {
      case 'branch':
        return this.prisma.$transaction([
          this.prisma.branch.findMany({ where, select: branchProjection, ...pagination, orderBy }),
          this.prisma.branch.count({ where }),
        ]);
      case 'department': {
        const departmentWhere = where as Prisma.DepartmentWhereInput;
        return this.prisma.$transaction([
          this.prisma.department.findMany({
            where: departmentWhere,
            select: departmentProjection,
            ...pagination,
            orderBy,
          }),
          this.prisma.department.count({ where: departmentWhere }),
        ]);
      }
      case 'position': {
        const positionWhere = where as Prisma.PositionWhereInput;
        return this.prisma.$transaction([
          this.prisma.position.findMany({
            where: positionWhere,
            select: positionProjection,
            ...pagination,
            orderBy,
          }),
          this.prisma.position.count({ where: positionWhere }),
        ]);
      }
      case 'costCenter': {
        const costCenterWhere = where as Prisma.CostCenterWhereInput;
        return this.prisma.$transaction([
          this.prisma.costCenter.findMany({
            where: costCenterWhere,
            select: baseProjection,
            ...pagination,
            orderBy,
          }),
          this.prisma.costCenter.count({ where: costCenterWhere }),
        ]);
      }
    }
  }

  private findByKind(kind: OrganizationResourceKind, id: string, companyId: string) {
    const where = { id, companyId };
    switch (kind) {
      case 'branch':
        return this.prisma.branch.findFirst({ where, select: branchProjection });
      case 'department':
        return this.prisma.department.findFirst({ where, select: departmentProjection });
      case 'position':
        return this.prisma.position.findFirst({ where, select: positionProjection });
      case 'costCenter':
        return this.prisma.costCenter.findFirst({ where, select: baseProjection });
    }
  }

  private createByKind<K extends OrganizationResourceKind>(
    tx: Prisma.TransactionClient,
    kind: K,
    dto: CreateInputByKind[K],
    companyId: string,
  ) {
    switch (kind) {
      case 'branch': {
        const input = dto as CreateBranchDto;
        return tx.branch.create({
          data: {
            companyId,
            code: input.code,
            name: input.name,
            taxId: input.taxId,
            address: input.address,
          },
          select: branchProjection,
        });
      }
      case 'department': {
        const input = dto as CreateDepartmentDto;
        return tx.department.create({
          data: { companyId, branchId: input.branchId, code: input.code, name: input.name },
          select: departmentProjection,
        });
      }
      case 'position': {
        const input = dto as CreatePositionDto;
        return tx.position.create({
          data: { companyId, code: input.code, name: input.name, description: input.description },
          select: positionProjection,
        });
      }
      case 'costCenter': {
        const input = dto as CreateCostCenterDto;
        return tx.costCenter.create({
          data: { companyId, code: input.code, name: input.name },
          select: baseProjection,
        });
      }
    }
  }

  private updateByKind<K extends OrganizationResourceKind>(
    tx: Prisma.TransactionClient,
    kind: K,
    id: string,
    dto: UpdateInputByKind[K],
    companyId: string,
  ) {
    const where = { id, companyId };
    switch (kind) {
      case 'branch':
        return tx.branch.update({ where, data: dto as UpdateBranchDto, select: branchProjection });
      case 'department':
        return tx.department.update({
          where,
          data: dto as UpdateDepartmentDto,
          select: departmentProjection,
        });
      case 'position':
        return tx.position.update({
          where,
          data: dto as UpdatePositionDto,
          select: positionProjection,
        });
      case 'costCenter':
        return tx.costCenter.update({
          where,
          data: dto as UpdateCostCenterDto,
          select: baseProjection,
        });
    }
  }

  private statusByKind(
    tx: Prisma.TransactionClient,
    kind: OrganizationResourceKind,
    id: string,
    status: RecordStatus,
    companyId: string,
  ) {
    const where = { id, companyId };
    switch (kind) {
      case 'branch':
        return tx.branch.update({ where, data: { status }, select: branchProjection });
      case 'department':
        return tx.department.update({ where, data: { status }, select: departmentProjection });
      case 'position':
        return tx.position.update({ where, data: { status }, select: positionProjection });
      case 'costCenter':
        return tx.costCenter.update({ where, data: { status }, select: baseProjection });
    }
  }

  private entityType(kind: OrganizationResourceKind): string {
    return {
      branch: 'Branch',
      department: 'Department',
      position: 'Position',
      costCenter: 'CostCenter',
    }[kind];
  }

  private handleDuplicate(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('CÃ³digo ou identificador jÃ¡ utilizado nesta empresa');
    }
    throw error;
  }
}

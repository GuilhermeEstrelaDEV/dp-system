import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditWriterService } from '../auth/audit-writer.service';
import { AuthorizationService } from '../auth/authorization.service';
import { CompanyListQueryDto, type RecordStatus } from '../organizational/common.dto';
import { CreateCompanyDto, UpdateCompanyDto } from './companies.dto';

const companyProjection = {
  id: true,
  legalName: true,
  tradeName: true,
  taxId: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CompanySelect;

@Injectable()
export class CompaniesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditWriterService,
    private readonly authorization: AuthorizationService,
  ) {}

  async list(query: CompanyListQueryDto) {
    const where: Prisma.CompanyWhereInput = {
      status: query.status,
      OR: query.search
        ? [
            { legalName: { contains: query.search, mode: 'insensitive' } },
            { tradeName: { contains: query.search, mode: 'insensitive' } },
          ]
        : undefined,
    };
    const [items, totalItems] = await this.prisma.$transaction([
      this.prisma.company.findMany({
        where,
        select: companyProjection,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { [query.sortBy]: query.sortDirection },
      }),
      this.prisma.company.count({ where }),
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
    const entity = await this.prisma.company.findUnique({
      where: { id },
      select: companyProjection,
    });
    if (!entity) throw new NotFoundException('Empresa não encontrada');
    return entity;
  }

  async create(dto: CreateCompanyDto, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'company.manage');
    try {
      return await this.audit.transaction(async (tx) => {
        const entity = await tx.company.create({ data: dto, select: companyProjection });
        await this.audit.append(
          {
            principal,
            action: 'COMPANY_CREATED',
            entityType: 'Company',
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

  async update(id: string, dto: UpdateCompanyDto, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'company.manage');
    const current = await this.find(id);
    try {
      return await this.audit.transaction(async (tx) => {
        const entity = await tx.company.update({
          where: { id },
          data: dto,
          select: companyProjection,
        });
        await this.audit.append(
          {
            principal,
            action: 'COMPANY_UPDATED',
            entityType: 'Company',
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

  async setStatus(id: string, status: RecordStatus, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'company.manage');
    const entity = await this.find(id);
    if (status === 'INACTIVE') {
      const activeDependencies = await this.prisma.$transaction([
        this.prisma.branch.count({ where: { companyId: id, status: 'ACTIVE' } }),
        this.prisma.department.count({ where: { companyId: id, status: 'ACTIVE' } }),
        this.prisma.position.count({ where: { companyId: id, status: 'ACTIVE' } }),
        this.prisma.costCenter.count({ where: { companyId: id, status: 'ACTIVE' } }),
      ]);
      if (activeDependencies.some(Boolean))
        throw new ConflictException('Empresa possui dependências ativas');
    }
    if (entity.status === status) return entity;
    return this.audit.transaction(async (tx) => {
      const updated = await tx.company.update({
        where: { id },
        data: { status },
        select: companyProjection,
      });
      const auditContext = {
        principal,
        entityType: 'Company',
        entityId: id,
        previousState: { status: entity.status },
        nextState: { status },
      } as const;
      if (status === 'ACTIVE') {
        await this.audit.append({ ...auditContext, action: 'COMPANY_ACTIVATED' }, tx);
      } else {
        await this.audit.append({ ...auditContext, action: 'COMPANY_INACTIVATED' }, tx);
      }
      return updated;
    });
  }

  private handleDuplicate(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
      throw new ConflictException('Já existe uma empresa com estes dados');
    throw error;
  }
}

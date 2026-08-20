import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditWriterService } from '../auth/audit-writer.service';
import { AuthorizationService } from '../auth/authorization.service';
import {
  CreatePayrollRubricDto,
  PayrollRubricQueryDto,
  UpdatePayrollRubricDto,
} from './payroll-rubrics.dto';

const rubricProjection = {
  id: true,
  companyId: true,
  payrollRubricCategoryId: true,
  code: true,
  name: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  payrollRubricCategory: { select: { id: true, code: true, name: true, nature: true } },
  versions: {
    select: {
      id: true,
      version: true,
      validFrom: true,
      validTo: true,
      calculationBase: true,
      incidenceConfiguration: true,
      configuration: true,
      status: true,
    },
    orderBy: { validFrom: 'desc' as const },
  },
} satisfies Prisma.PayrollRubricSelect;

@Injectable()
export class PayrollRubricsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditWriterService,
    private readonly authorization: AuthorizationService,
  ) {}

  async list(q: PayrollRubricQueryDto, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'payroll.rubric.read');
    const where: Prisma.PayrollRubricWhereInput = {
      companyId: principal.activeCompanyId!,
      status: q.status,
      OR: q.search
        ? [
            { code: { contains: q.search, mode: 'insensitive' } },
            { name: { contains: q.search, mode: 'insensitive' } },
          ]
        : undefined,
    };
    const [items, totalItems] = await this.prisma.$transaction([
      this.prisma.payrollRubric.findMany({
        where,
        select: rubricProjection,
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        orderBy: { [q.sortBy]: q.sortDirection },
      }),
      this.prisma.payrollRubric.count({ where }),
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
    this.authorization.requireCapability(principal, 'payroll.rubric.read');
    return this.findInCompany(id, principal.activeCompanyId!);
  }

  async create(dto: CreatePayrollRubricDto, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'payroll.rubric.manage');
    const companyId = principal.activeCompanyId!;
    if (dto.companyId !== companyId) throw new NotFoundException('Empresa não encontrada');
    if (dto.validTo && new Date(dto.validTo) < new Date(dto.validFrom))
      throw new ConflictException('Vigência inválida');
    const category = await this.prisma.payrollRubricCategory.findFirst({
      where: { id: dto.payrollRubricCategoryId, companyId, status: 'ACTIVE' },
      select: { id: true },
    });
    if (!category) throw new ConflictException('Categoria inválida para a empresa');
    try {
      return await this.audit.transaction(async (tx) => {
        const rubric = await tx.payrollRubric.create({
          data: {
            companyId,
            payrollRubricCategoryId: dto.payrollRubricCategoryId,
            code: dto.code,
            name: dto.name,
            versions: {
              create: {
                version: dto.version,
                validFrom: new Date(dto.validFrom),
                validTo: dto.validTo ? new Date(dto.validTo) : null,
                calculationBase: dto.calculationBase,
                incidenceConfiguration: dto.incidenceConfiguration,
                configuration: dto.configuration,
              },
            },
          },
          select: rubricProjection,
        });
        await this.audit.append(
          {
            principal,
            action: 'PAYROLL_RUBRIC_CREATED',
            entityType: 'PayrollRubric',
            entityId: rubric.id,
            nextState: { status: rubric.status },
            metadata: { code: rubric.code },
          },
          tx,
        );
        return rubric;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
        throw new ConflictException('Rubrica ou vigência já existe');
      throw error;
    }
  }

  async update(id: string, dto: UpdatePayrollRubricDto, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'payroll.rubric.manage');
    const rubric = await this.findInCompany(id, principal.activeCompanyId!);
    const used = await this.prisma.payrollCalculationItem.count({ where: { payrollRubricId: id } });
    if (used && dto.name && dto.name !== rubric.name)
      throw new ConflictException('Rubrica usada historicamente não pode ser renomeada');
    return this.audit.transaction(async (tx) => {
      const updated = await tx.payrollRubric.update({
        where: { id },
        data: dto,
        select: rubricProjection,
      });
      await this.audit.append(
        {
          principal,
          action: 'PAYROLL_RUBRIC_UPDATED',
          entityType: 'PayrollRubric',
          entityId: id,
          previousState: { status: rubric.status },
          nextState: { status: updated.status },
          metadata: { code: updated.code },
        },
        tx,
      );
      return updated;
    });
  }

  private async findInCompany(id: string, companyId: string) {
    const item = await this.prisma.payrollRubric.findFirst({
      where: { id, companyId },
      select: rubricProjection,
    });
    if (!item) throw new NotFoundException('Rubrica não encontrada');
    return item;
  }
}

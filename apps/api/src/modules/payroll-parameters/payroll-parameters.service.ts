import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditWriterService } from '../auth/audit-writer.service';
import { AuthorizationService } from '../auth/authorization.service';
import {
  CreatePayrollParameterDto,
  PayrollParameterQueryDto,
  UpdatePayrollParameterDto,
} from './payroll-parameters.dto';

const parameterProjection = {
  id: true,
  companyId: true,
  code: true,
  name: true,
  category: true,
  version: true,
  validFrom: true,
  validTo: true,
  definition: true,
  sourceReference: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PayrollParameterSelect;

@Injectable()
export class PayrollParametersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditWriterService,
    private readonly authorization: AuthorizationService,
  ) {}

  async list(q: PayrollParameterQueryDto, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'payroll.parameter.read');
    const where: Prisma.PayrollParameterWhereInput = {
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
      this.prisma.payrollParameter.findMany({
        where,
        select: parameterProjection,
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        orderBy: { [q.sortBy]: q.sortDirection },
      }),
      this.prisma.payrollParameter.count({ where }),
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
    this.authorization.requireCapability(principal, 'payroll.parameter.read');
    return this.findInCompany(id, principal.activeCompanyId!);
  }

  async create(dto: CreatePayrollParameterDto, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'payroll.parameter.manage');
    const companyId = principal.activeCompanyId!;
    if (dto.companyId && dto.companyId !== companyId)
      throw new NotFoundException('Empresa não encontrada');
    const validFrom = new Date(dto.validFrom);
    const validTo = dto.validTo ? new Date(dto.validTo) : null;
    if (validTo && validTo < validFrom) throw new ConflictException('Vigência inválida');
    const overlap = await this.prisma.payrollParameter.findFirst({
      where: {
        companyId,
        code: dto.code,
        validFrom: { lte: validTo ?? new Date('9999-12-31') },
        OR: [{ validTo: null }, { validTo: { gte: validFrom } }],
      },
    });
    if (overlap) throw new ConflictException('Há vigência incompatível para este parâmetro');
    try {
      return await this.audit.transaction(async (tx) => {
        const parameter = await tx.payrollParameter.create({
          data: {
            companyId,
            code: dto.code,
            name: dto.name,
            category: dto.category,
            version: dto.version,
            validFrom,
            validTo,
            definition: dto.definition,
            sourceReference: dto.sourceReference,
          },
          select: parameterProjection,
        });
        await this.audit.append(
          {
            principal,
            action: 'PAYROLL_PARAMETER_CREATED',
            entityType: 'PayrollParameter',
            entityId: parameter.id,
            nextState: { status: parameter.status },
            metadata: { code: parameter.code },
          },
          tx,
        );
        return parameter;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
        throw new ConflictException('Parâmetro duplicado');
      throw error;
    }
  }

  async update(id: string, dto: UpdatePayrollParameterDto, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'payroll.parameter.manage');
    const parameter = await this.findInCompany(id, principal.activeCompanyId!);
    const used = await this.prisma.payrollRun.count({
      where: {
        parameterVersion: parameter.version,
        payrollPeriod: { companyId: principal.activeCompanyId!, status: 'CLOSED' },
      },
    });
    if (used)
      throw new ConflictException('Parâmetro histórico usado em competência fechada é imutável');
    return this.audit.transaction(async (tx) => {
      const updated = await tx.payrollParameter.update({
        where: { id },
        data: dto,
        select: parameterProjection,
      });
      await this.audit.append(
        {
          principal,
          action: 'PAYROLL_PARAMETER_UPDATED',
          entityType: 'PayrollParameter',
          entityId: id,
          previousState: { status: parameter.status },
          nextState: { status: updated.status },
          metadata: { code: updated.code },
        },
        tx,
      );
      return updated;
    });
  }

  private async findInCompany(id: string, companyId: string) {
    const item = await this.prisma.payrollParameter.findFirst({
      where: { id, companyId },
      select: parameterProjection,
    });
    if (!item) throw new NotFoundException('Parâmetro não encontrado');
    return item;
  }
}

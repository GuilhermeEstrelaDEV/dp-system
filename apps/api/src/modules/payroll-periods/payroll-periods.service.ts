import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditWriterService } from '../auth/audit-writer.service';
import { AuthorizationService } from '../auth/authorization.service';
import {
  CreatePayrollPeriodDto,
  PayrollPeriodQueryDto,
  UpdatePayrollPeriodDto,
} from './payroll-periods.dto';

const payrollPeriodProjection = {
  id: true,
  companyId: true,
  payrollCalendarId: true,
  referenceDate: true,
  type: true,
  status: true,
  engineVersion: true,
  parameterVersion: true,
  openedAt: true,
  closedAt: true,
  reopenedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PayrollPeriodSelect;

@Injectable()
export class PayrollPeriodsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditWriterService,
    private readonly authorization: AuthorizationService,
  ) {}

  async list(query: PayrollPeriodQueryDto, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'payroll.period.close.view');
    const companyId = principal.activeCompanyId!;
    if (query.companyId !== companyId) throw new NotFoundException('Empresa não encontrada');
    const where: Prisma.PayrollPeriodWhereInput = { companyId, status: query.status };
    const [items, totalItems] = await this.prisma.$transaction([
      this.prisma.payrollPeriod.findMany({
        where,
        select: payrollPeriodProjection,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { [query.sortBy]: query.sortDirection },
      }),
      this.prisma.payrollPeriod.count({ where }),
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
    this.authorization.requireCapability(principal, 'payroll.period.close.view');
    return this.findInCompany(id, principal.activeCompanyId!);
  }

  async create(dto: CreatePayrollPeriodDto, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'payroll.period.manage');
    const companyId = principal.activeCompanyId!;
    if (dto.companyId !== companyId) throw new NotFoundException('Empresa não encontrada');
    const calendar = await this.prisma.payrollCalendar.findFirst({
      where: { id: dto.payrollCalendarId, companyId },
      select: { id: true },
    });
    if (!calendar) throw new NotFoundException('Calendário não encontrado');
    try {
      return await this.audit.transaction(async (tx) => {
        const period = await tx.payrollPeriod.create({
          data: {
            companyId,
            payrollCalendarId: dto.payrollCalendarId,
            referenceDate: new Date(dto.referenceDate),
            type: dto.type ?? 'REGULAR',
          },
          select: payrollPeriodProjection,
        });
        await this.audit.append(
          {
            principal,
            action: 'PAYROLL_PERIOD_CREATED',
            entityType: 'PayrollPeriod',
            entityId: period.id,
            nextState: { status: period.status, type: period.type },
          },
          tx,
        );
        return period;
      });
    } catch (error) {
      this.duplicate(error);
    }
  }

  async update(id: string, dto: UpdatePayrollPeriodDto, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'payroll.period.manage');
    const companyId = principal.activeCompanyId!;
    const period = await this.findInCompany(id, companyId);
    if (period.status === 'CLOSED') throw new ConflictException('Competência fechada é imutável');
    if (dto.payrollCalendarId) {
      const calendar = await this.prisma.payrollCalendar.findFirst({
        where: { id: dto.payrollCalendarId, companyId },
        select: { id: true },
      });
      if (!calendar) throw new NotFoundException('Calendário não encontrado');
    }
    try {
      return await this.audit.transaction(async (tx) => {
        const updated = await tx.payrollPeriod.update({
          where: { id },
          data: {
            payrollCalendarId: dto.payrollCalendarId,
            referenceDate: dto.referenceDate ? new Date(dto.referenceDate) : undefined,
            type: dto.type,
          },
          select: payrollPeriodProjection,
        });
        await this.audit.append(
          {
            principal,
            action: 'PAYROLL_PERIOD_UPDATED',
            entityType: 'PayrollPeriod',
            entityId: id,
            previousState: { status: period.status, type: period.type },
            nextState: { status: updated.status, type: updated.type },
          },
          tx,
        );
        return updated;
      });
    } catch (error) {
      this.duplicate(error);
    }
  }

  async open(id: string, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'payroll.period.manage');
    const period = await this.findInCompany(id, principal.activeCompanyId!);
    if (period.status === 'CLOSED') throw new ConflictException('Use reabertura com justificativa');
    if (period.status === 'OPEN') return period;
    return this.audit.transaction(async (tx) => {
      const updated = await tx.payrollPeriod.update({
        where: { id },
        data: { status: 'OPEN', openedAt: new Date() },
        select: payrollPeriodProjection,
      });
      await this.audit.append(
        {
          principal,
          action: 'PAYROLL_PERIOD_OPENED',
          entityType: 'PayrollPeriod',
          entityId: id,
          previousState: { status: period.status },
          nextState: { status: updated.status },
        },
        tx,
      );
      return updated;
    });
  }

  async validate(id: string, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'payroll.period.close.view');
    const period = await this.findInCompany(id, principal.activeCompanyId!);
    const blockingErrors = await this.prisma.payrollRunMessage.count({
      where: {
        payrollRun: {
          payrollPeriodId: id,
          payrollPeriod: { companyId: principal.activeCompanyId! },
        },
        severity: 'BLOCKING_ERROR',
        resolvedAt: null,
      },
    });
    return { periodId: period.id, valid: blockingErrors === 0, blockingErrors };
  }

  private async findInCompany(id: string, companyId: string) {
    const item = await this.prisma.payrollPeriod.findFirst({
      where: { id, companyId },
      select: payrollPeriodProjection,
    });
    if (!item) throw new NotFoundException('Competência não encontrada');
    return item;
  }

  private duplicate(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('Já existe competência para esta empresa, referência e tipo');
    }
    throw error;
  }
}

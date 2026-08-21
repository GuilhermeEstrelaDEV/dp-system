import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditWriterService } from '../auth/audit-writer.service';
import { AuthorizationService } from '../auth/authorization.service';
import {
  BenefitsQueryDto,
  ChangeEnrollmentStatusDto,
  CreateBenefitDto,
  CreateEnrollmentDto,
  CreatePlanDto,
} from './benefits.dto';

const isInvalidPeriod = (validFrom: string, validTo?: string) =>
  Boolean(validTo && new Date(validTo) < new Date(validFrom));

const benefitPlanProjection = {
  id: true,
  benefitId: true,
  name: true,
  employeeAmount: true,
  companyAmount: true,
  copayAmount: true,
  validFrom: true,
  validTo: true,
  status: true,
  createdAt: true,
} satisfies Prisma.BenefitPlanSelect;

const benefitProjection = {
  id: true,
  companyId: true,
  code: true,
  name: true,
  type: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  plans: {
    where: { status: 'ACTIVE' },
    select: benefitPlanProjection,
    orderBy: { validFrom: 'desc' as const },
  },
} satisfies Prisma.BenefitSelect;

const enrollmentProjection = {
  id: true,
  employmentContractId: true,
  benefitPlanId: true,
  validFrom: true,
  validTo: true,
  status: true,
  createdAt: true,
  benefitPlan: {
    select: {
      id: true,
      name: true,
      status: true,
      benefit: { select: { id: true, code: true, name: true, type: true } },
    },
  },
  history: {
    select: { id: true, action: true, occurredAt: true },
    orderBy: { occurredAt: 'desc' as const },
  },
} satisfies Prisma.BenefitEnrollmentSelect;

@Injectable()
export class BenefitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditWriterService,
    private readonly authorization: AuthorizationService,
  ) {}

  list(query: BenefitsQueryDto, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'benefit.read');
    const companyId = this.companyId(principal, query.companyId);
    const search = query.search?.trim();
    return this.prisma.benefit.findMany({
      where: {
        companyId,
        type: query.type,
        ...(search
          ? {
              OR: [
                { code: { contains: search, mode: 'insensitive' as const } },
                { name: { contains: search, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      select: benefitProjection,
      orderBy: { name: 'asc' },
    });
  }

  async listEnrollments(employmentContractId: string, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'benefit.read');
    await this.requireContract(employmentContractId, this.companyId(principal));
    return this.prisma.benefitEnrollment.findMany({
      where: { employmentContractId },
      select: enrollmentProjection,
      orderBy: { validFrom: 'desc' },
    });
  }

  create(dto: CreateBenefitDto, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'benefit.manage');
    const companyId = this.companyId(principal, dto.companyId);
    return this.audit.transaction(async (tx) => {
      const created = await tx.benefit.create({
        data: { companyId, code: dto.code, name: dto.name, type: dto.type },
        select: benefitProjection,
      });
      await this.audit.append(
        {
          principal,
          action: 'BENEFIT_CREATED',
          entityType: 'Benefit',
          entityId: created.id,
          nextState: { status: created.status },
        },
        tx,
      );
      return created;
    });
  }

  async plan(dto: CreatePlanDto, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'benefit.manage');
    if (isInvalidPeriod(dto.validFrom, dto.validTo)) {
      throw new ConflictException('A data final não pode ser anterior ao início da vigência');
    }
    const benefit = await this.prisma.benefit.findFirst({
      where: { id: dto.benefitId, companyId: this.companyId(principal) },
      select: { id: true, status: true },
    });
    if (!benefit) throw new NotFoundException('Benefício não encontrado');
    return this.audit.transaction(async (tx) => {
      const created = await tx.benefitPlan.create({
        data: {
          benefitId: benefit.id,
          name: dto.name,
          employeeAmount: new Prisma.Decimal(dto.employeeAmount),
          companyAmount: new Prisma.Decimal(dto.companyAmount),
          copayAmount: dto.copayAmount ? new Prisma.Decimal(dto.copayAmount) : null,
          validFrom: new Date(dto.validFrom),
          validTo: dto.validTo ? new Date(dto.validTo) : null,
        },
        select: benefitPlanProjection,
      });
      await this.audit.append(
        {
          principal,
          action: 'BENEFIT_PLAN_CREATED',
          entityType: 'BenefitPlan',
          entityId: created.id,
          nextState: { status: created.status },
        },
        tx,
      );
      return created;
    });
  }

  async enroll(dto: CreateEnrollmentDto, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'benefit.manage');
    if (isInvalidPeriod(dto.validFrom, dto.validTo)) {
      throw new ConflictException('A data final não pode ser anterior ao início da vigência');
    }
    const companyId = this.companyId(principal);
    const [contract, plan] = await Promise.all([
      this.requireContract(dto.employmentContractId, companyId),
      this.prisma.benefitPlan.findFirst({
        where: { id: dto.benefitPlanId, benefit: { companyId } },
        select: { id: true, benefitId: true, status: true },
      }),
    ]);
    if (!plan) throw new NotFoundException('Plano de benefício não encontrado');
    const duplicate = await this.prisma.benefitEnrollment.findFirst({
      where: {
        employmentContractId: contract.id,
        status: 'ACTIVE',
        benefitPlan: { benefitId: plan.benefitId },
        validFrom: { lte: dto.validTo ? new Date(dto.validTo) : new Date('9999-12-31') },
        OR: [{ validTo: null }, { validTo: { gte: new Date(dto.validFrom) } }],
      },
    });
    if (duplicate) throw new ConflictException('Já existe adesão ativa sobreposta');
    return this.audit.transaction(async (tx) => {
      const item = await tx.benefitEnrollment.create({
        data: {
          employmentContractId: contract.id,
          benefitPlanId: plan.id,
          validFrom: new Date(dto.validFrom),
          validTo: dto.validTo ? new Date(dto.validTo) : null,
          reason: dto.reason,
        },
        select: enrollmentProjection,
      });
      await tx.benefitEnrollmentHistory.create({
        data: { benefitEnrollmentId: item.id, action: 'ENROLLED', reason: dto.reason },
      });
      await this.audit.append(
        {
          principal,
          action: 'BENEFIT_ENROLLMENT_CREATED',
          entityType: 'BenefitEnrollment',
          entityId: item.id,
          nextState: { status: item.status },
        },
        tx,
      );
      return item;
    });
  }

  async changeEnrollmentStatus(
    id: string,
    dto: ChangeEnrollmentStatusDto,
    principal: AuthenticatedPrincipal,
  ) {
    this.authorization.requireCapability(principal, 'benefit.manage');
    const enrollment = await this.prisma.benefitEnrollment.findFirst({
      where: {
        id,
        employmentContract: { companyId: this.companyId(principal) },
        benefitPlan: { benefit: { companyId: this.companyId(principal) } },
      },
      select: { id: true, status: true },
    });
    if (!enrollment) throw new NotFoundException('Adesão não encontrada');
    if (enrollment.status === 'CANCELLED') {
      throw new ConflictException('Uma adesão cancelada não pode ser alterada');
    }
    return this.audit.transaction(async (tx) => {
      const updated = await tx.benefitEnrollment.update({
        where: { id },
        data: { status: dto.status, reason: dto.reason, validTo: new Date() },
        select: enrollmentProjection,
      });
      await tx.benefitEnrollmentHistory.create({
        data: { benefitEnrollmentId: id, action: dto.status, reason: dto.reason },
      });
      await this.audit.append(
        {
          principal,
          action: 'BENEFIT_ENROLLMENT_STATUS_CHANGED',
          entityType: 'BenefitEnrollment',
          entityId: id,
          previousState: { status: enrollment.status },
          nextState: { status: updated.status },
        },
        tx,
      );
      return updated;
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

  private companyId(principal: AuthenticatedPrincipal, requested?: string): string {
    const companyId = principal.activeCompanyId;
    if (!companyId || (requested && requested !== companyId)) {
      throw new NotFoundException('Recurso não encontrado');
    }
    return companyId;
  }
}

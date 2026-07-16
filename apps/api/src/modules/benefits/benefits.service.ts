import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  BenefitsQueryDto,
  ChangeEnrollmentStatusDto,
  CreateBenefitDto,
  CreateEnrollmentDto,
  CreatePlanDto,
} from './benefits.dto';

const isInvalidPeriod = (validFrom: string, validTo?: string) =>
  Boolean(validTo && new Date(validTo) < new Date(validFrom));

@Injectable()
export class BenefitsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: BenefitsQueryDto) {
    const search = query.search?.trim();
    return this.prisma.benefit.findMany({
      where: {
        companyId: query.companyId,
        type: query.type,
        ...(search
          ? {
              OR: [
                { code: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: { plans: { where: { status: 'ACTIVE' }, orderBy: { validFrom: 'desc' } } },
      orderBy: [{ name: 'asc' }],
    });
  }

  async listEnrollments(employmentContractId: string) {
    return this.prisma.benefitEnrollment.findMany({
      where: { employmentContractId },
      include: {
        benefitPlan: { include: { benefit: true } },
        history: { orderBy: { occurredAt: 'desc' } },
      },
      orderBy: { validFrom: 'desc' },
    });
  }

  create(dto: CreateBenefitDto) {
    return this.prisma.benefit.create({ data: dto });
  }

  async plan(dto: CreatePlanDto) {
    if (isInvalidPeriod(dto.validFrom, dto.validTo)) {
      throw new ConflictException('A data final não pode ser anterior ao início da vigência');
    }
    return this.prisma.benefitPlan.create({
      data: {
        ...dto,
        validFrom: new Date(dto.validFrom),
        validTo: dto.validTo ? new Date(dto.validTo) : null,
      },
    });
  }

  async enroll(dto: CreateEnrollmentDto) {
    if (isInvalidPeriod(dto.validFrom, dto.validTo)) {
      throw new ConflictException('A data final não pode ser anterior ao início da vigência');
    }
    const [contract, plan] = await Promise.all([
      this.prisma.employmentContract.findUnique({ where: { id: dto.employmentContractId } }),
      this.prisma.benefitPlan.findUnique({
        where: { id: dto.benefitPlanId },
        include: { benefit: true },
      }),
    ]);
    if (!contract || !plan)
      throw new NotFoundException('Contrato ou plano de benefício não encontrado');
    if (contract.companyId !== plan.benefit.companyId) {
      throw new ConflictException('O plano deve pertencer à empresa do contrato');
    }

    const duplicate = await this.prisma.benefitEnrollment.findFirst({
      where: {
        employmentContractId: dto.employmentContractId,
        status: 'ACTIVE',
        benefitPlan: { benefitId: plan.benefitId },
        validFrom: { lte: dto.validTo ? new Date(dto.validTo) : new Date('9999-12-31') },
        OR: [{ validTo: null }, { validTo: { gte: new Date(dto.validFrom) } }],
      },
    });
    if (duplicate)
      throw new ConflictException('Já existe adesão ativa sobreposta para este benefício');

    return this.prisma.$transaction(async (tx) => {
      const item = await tx.benefitEnrollment.create({
        data: {
          ...dto,
          validFrom: new Date(dto.validFrom),
          validTo: dto.validTo ? new Date(dto.validTo) : null,
        },
      });
      await tx.benefitEnrollmentHistory.create({
        data: { benefitEnrollmentId: item.id, action: 'ENROLLED', reason: dto.reason },
      });
      return item;
    });
  }

  async changeEnrollmentStatus(id: string, dto: ChangeEnrollmentStatusDto) {
    const enrollment = await this.prisma.benefitEnrollment.findUnique({ where: { id } });
    if (!enrollment) throw new NotFoundException('Adesão não encontrada');
    if (enrollment.status === 'CANCELLED')
      throw new ConflictException('Uma adesão cancelada não pode ser alterada');
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.benefitEnrollment.update({
        where: { id },
        data: { status: dto.status, reason: dto.reason, validTo: new Date() },
      });
      await tx.benefitEnrollmentHistory.create({
        data: { benefitEnrollmentId: id, action: dto.status, reason: dto.reason },
      });
      return updated;
    });
  }
}

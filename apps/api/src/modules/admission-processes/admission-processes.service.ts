import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditWriterService } from '../auth/audit-writer.service';
import { AuthorizationService } from '../auth/authorization.service';
import {
  type AdmissionProcessListQueryDto,
  type CreateAdmissionProcessDto,
  type UpdateAdmissionProcessDto,
} from './admission-processes.dto';

const checklistItemProjection = {
  id: true,
  title: true,
  description: true,
  sortOrder: true,
  isRequired: true,
  dueDate: true,
  status: true,
  completedAt: true,
} satisfies Prisma.AdmissionChecklistItemSelect;

const admissionListProjection = {
  id: true,
  employeeId: true,
  employmentContractId: true,
  companyId: true,
  checklistTemplateId: true,
  plannedAdmissionDate: true,
  effectiveAdmissionDate: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  employee: { select: { id: true, legalName: true, preferredName: true, status: true } },
  employmentContract: {
    select: { id: true, registrationNumber: true, status: true, companyId: true },
  },
  checklistInstances: {
    select: { id: true, items: { select: checklistItemProjection, orderBy: { sortOrder: 'asc' } } },
  },
} satisfies Prisma.AdmissionProcessSelect;

const admissionDetailProjection = {
  ...admissionListProjection,
  documents: {
    select: {
      id: true,
      documentType: true,
      isRequired: true,
      receiptStatus: true,
      reviewStatus: true,
      receivedAt: true,
      reviewedAt: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'asc' },
  },
} satisfies Prisma.AdmissionProcessSelect;

@Injectable()
export class AdmissionProcessesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditWriterService,
    private readonly authorization: AuthorizationService,
  ) {}

  list(query: AdmissionProcessListQueryDto, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'admission.read');
    const companyId = this.companyId(principal, query.companyId);
    return this.prisma.admissionProcess.findMany({
      where: {
        companyId,
        employeeId: query.employeeId,
        employmentContractId: query.contractId,
        status: query.status,
      },
      select: admissionListProjection,
      orderBy: { plannedAdmissionDate: 'asc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    });
  }

  async find(id: string, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'admission.read');
    return this.requireProcess(id, principal);
  }

  async create(dto: CreateAdmissionProcessDto, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'admission.manage');
    const companyId = this.companyId(principal);
    const contract = await this.prisma.employmentContract.findFirst({
      where: { id: dto.employmentContractId, companyId },
      select: { id: true, employeeId: true, companyId: true, status: true },
    });
    if (!contract || contract.employeeId !== dto.employeeId)
      throw new NotFoundException('Contrato ou colaborador não encontrado');
    const duplicate = await this.prisma.admissionProcess.findFirst({
      where: {
        employmentContractId: contract.id,
        companyId,
        status: { in: ['DRAFT', 'IN_PROGRESS', 'PENDING'] },
      },
      select: { id: true },
    });
    if (duplicate)
      throw new ConflictException('Já existe processo admissional ativo para este contrato');
    if (dto.checklistTemplateId) {
      const template = await this.prisma.checklistTemplate.findFirst({
        where: { id: dto.checklistTemplateId, companyId, status: 'ACTIVE' },
        select: { id: true },
      });
      if (!template) throw new NotFoundException('Template não encontrado');
    }
    return this.audit.transaction(async (tx) => {
      const item = await tx.admissionProcess.create({
        data: {
          employeeId: dto.employeeId,
          employmentContractId: dto.employmentContractId,
          checklistTemplateId: dto.checklistTemplateId,
          plannedAdmissionDate: new Date(dto.plannedAdmissionDate),
          operationalOwner: dto.operationalOwner,
          notes: dto.notes,
          companyId,
        },
        select: admissionListProjection,
      });
      await tx.admissionStatusHistory.create({
        data: { admissionProcessId: item.id, status: 'DRAFT' },
      });
      await this.audit.append(
        {
          principal,
          action: 'ADMISSION_PROCESS_CREATED',
          entityType: 'AdmissionProcess',
          entityId: item.id,
          nextState: { status: item.status },
        },
        tx,
      );
      return item;
    });
  }

  async update(id: string, dto: UpdateAdmissionProcessDto, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'admission.manage');
    const current = await this.requireProcess(id, principal);
    return this.audit.transaction(async (tx) => {
      const updated = await tx.admissionProcess.update({
        where: { id, companyId: current.companyId },
        data: {
          plannedAdmissionDate: dto.plannedAdmissionDate
            ? new Date(dto.plannedAdmissionDate)
            : undefined,
          effectiveAdmissionDate: dto.effectiveAdmissionDate
            ? new Date(dto.effectiveAdmissionDate)
            : undefined,
          operationalOwner: dto.operationalOwner,
          notes: dto.notes,
        },
        select: admissionDetailProjection,
      });
      await this.audit.append(
        {
          principal,
          action: 'ADMISSION_PROCESS_UPDATED',
          entityType: 'AdmissionProcess',
          entityId: id,
          previousState: { status: current.status },
          nextState: { status: updated.status },
        },
        tx,
      );
      return updated;
    });
  }

  async cancel(id: string, reason: string, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'admission.manage');
    const item = await this.requireProcess(id, principal);
    if (['COMPLETED', 'CANCELLED'].includes(item.status))
      throw new ConflictException('Processo não pode ser cancelado');
    return this.audit.transaction(async (tx) => {
      const updated = await tx.admissionProcess.update({
        where: { id, companyId: item.companyId },
        data: { status: 'CANCELLED', cancellationReason: reason, cancelledAt: new Date() },
        select: admissionDetailProjection,
      });
      await tx.admissionStatusHistory.create({
        data: { admissionProcessId: id, status: 'CANCELLED', reason },
      });
      await this.audit.append(
        {
          principal,
          action: 'ADMISSION_PROCESS_STATUS_CHANGED',
          entityType: 'AdmissionProcess',
          entityId: id,
          previousState: { status: item.status },
          nextState: { status: updated.status },
        },
        tx,
      );
      return updated;
    });
  }

  async complete(id: string, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'admission.manage');
    const item = await this.requireProcess(id, principal);
    const checklist = item.checklistInstances[0];
    if (!checklist) throw new ConflictException('Checklist obrigatório não gerado');
    if (
      checklist.items.some(
        (entry) => entry.isRequired && !['COMPLETED', 'NOT_APPLICABLE'].includes(entry.status),
      )
    )
      throw new ConflictException('Existem itens obrigatórios pendentes');
    return this.audit.transaction(async (tx) => {
      const updated = await tx.admissionProcess.update({
        where: { id, companyId: item.companyId },
        data: { status: 'COMPLETED', completedAt: new Date() },
        select: admissionDetailProjection,
      });
      await tx.admissionStatusHistory.create({
        data: { admissionProcessId: id, status: 'COMPLETED' },
      });
      await this.audit.append(
        {
          principal,
          action: 'ADMISSION_PROCESS_STATUS_CHANGED',
          entityType: 'AdmissionProcess',
          entityId: id,
          previousState: { status: item.status },
          nextState: { status: updated.status },
        },
        tx,
      );
      return updated;
    });
  }

  private async requireProcess(id: string, principal: AuthenticatedPrincipal) {
    const item = await this.prisma.admissionProcess.findFirst({
      where: { id, companyId: this.companyId(principal) },
      select: admissionDetailProjection,
    });
    if (!item) throw new NotFoundException('Processo admissional não encontrado');
    return item;
  }

  private companyId(principal: AuthenticatedPrincipal, requested?: string): string {
    const companyId = principal.activeCompanyId;
    if (!companyId || (requested && requested !== companyId))
      throw new NotFoundException('Processo admissional não encontrado');
    return companyId;
  }
}

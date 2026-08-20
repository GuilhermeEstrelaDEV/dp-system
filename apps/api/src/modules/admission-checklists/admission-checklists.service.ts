import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditWriterService } from '../auth/audit-writer.service';
import { AuthorizationService } from '../auth/authorization.service';

const checklistProjection = {
  id: true,
  admissionProcessId: true,
  checklistTemplateId: true,
  templateName: true,
  createdAt: true,
  items: {
    select: {
      id: true,
      title: true,
      description: true,
      sortOrder: true,
      isRequired: true,
      dueDate: true,
      status: true,
      completedAt: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { sortOrder: 'asc' },
  },
} satisfies Prisma.ChecklistInstanceSelect;

const checklistItemProjection = {
  id: true,
  checklistInstanceId: true,
  title: true,
  description: true,
  sortOrder: true,
  isRequired: true,
  dueDate: true,
  status: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AdmissionChecklistItemSelect;

@Injectable()
export class AdmissionChecklistsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditWriterService,
    private readonly authorization: AuthorizationService,
  ) {}

  async get(processId: string, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'admission.read');
    const instance = await this.prisma.checklistInstance.findFirst({
      where: {
        admissionProcessId: processId,
        admissionProcess: { companyId: this.companyId(principal) },
      },
      select: checklistProjection,
    });
    if (!instance) throw new NotFoundException('Checklist não encontrado');
    return instance;
  }

  async fromTemplate(processId: string, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'admission.manage');
    const companyId = this.companyId(principal);
    const process = await this.prisma.admissionProcess.findFirst({
      where: { id: processId, companyId },
      select: { id: true, checklistTemplateId: true, plannedAdmissionDate: true },
    });
    if (!process) throw new NotFoundException('Processo admissional não encontrado');
    if (!process.checklistTemplateId) throw new ConflictException('Processo não possui template');
    const template = await this.prisma.checklistTemplate.findFirst({
      where: { id: process.checklistTemplateId, companyId, status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        items: {
          select: {
            title: true,
            description: true,
            sortOrder: true,
            isRequired: true,
            relativeDueDays: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    if (!template) throw new ConflictException('Template inativo ou fora da empresa');
    return this.audit.transaction(async (tx) => {
      const exists = await tx.checklistInstance.findUnique({
        where: { admissionProcessId: processId },
        select: { id: true },
      });
      if (exists) throw new ConflictException('Checklist já criado');
      const instance = await tx.checklistInstance.create({
        data: {
          admissionProcessId: processId,
          checklistTemplateId: template.id,
          templateName: template.name,
        },
      });
      await tx.admissionChecklistItem.createMany({
        data: template.items.map((item) => ({
          checklistInstanceId: instance.id,
          title: item.title,
          description: item.description,
          sortOrder: item.sortOrder,
          isRequired: item.isRequired,
          dueDate:
            item.relativeDueDays === null
              ? null
              : new Date(
                  process.plannedAdmissionDate.getTime() + item.relativeDueDays * 86_400_000,
                ),
        })),
      });
      const created = await tx.checklistInstance.findUniqueOrThrow({
        where: { id: instance.id },
        select: checklistProjection,
      });
      await this.audit.append(
        {
          principal,
          action: 'ADMISSION_CHECKLIST_CREATED',
          entityType: 'ChecklistInstance',
          entityId: instance.id,
          nextState: { status: 'CREATED' },
        },
        tx,
      );
      return created;
    });
  }

  async setItem(
    id: string,
    status: string,
    reason: string | undefined,
    principal: AuthenticatedPrincipal,
  ) {
    this.authorization.requireCapability(principal, 'admission.manage');
    const item = await this.prisma.admissionChecklistItem.findFirst({
      where: {
        id,
        checklistInstance: { admissionProcess: { companyId: this.companyId(principal) } },
      },
      select: checklistItemProjection,
    });
    if (!item) throw new NotFoundException('Item não encontrado');
    if ((status === 'NOT_APPLICABLE' || status === 'BLOCKED') && !reason)
      throw new ConflictException('Justificativa obrigatória');
    if (status === 'PENDING' && item.status === 'COMPLETED' && !reason)
      throw new ConflictException('Reabertura exige justificativa');
    return this.audit.transaction(async (tx) => {
      const updated = await tx.admissionChecklistItem.update({
        where: { id },
        data: {
          status,
          observation: reason,
          completedAt: status === 'COMPLETED' ? new Date() : null,
        },
        select: checklistItemProjection,
      });
      await tx.admissionChecklistItemHistory.create({
        data: { admissionChecklistItemId: id, action: status, reason },
      });
      await this.audit.append(
        {
          principal,
          action: 'ADMISSION_CHECKLIST_ITEM_UPDATED',
          entityType: 'AdmissionChecklistItem',
          entityId: id,
          previousState: { status: item.status },
          nextState: { status: updated.status },
        },
        tx,
      );
      return updated;
    });
  }

  private companyId(principal: AuthenticatedPrincipal): string {
    if (!principal.activeCompanyId) throw new NotFoundException('Recurso não encontrado');
    return principal.activeCompanyId;
  }
}

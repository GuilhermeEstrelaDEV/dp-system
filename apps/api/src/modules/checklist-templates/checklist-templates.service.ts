import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditWriterService } from '../auth/audit-writer.service';
import { AuthorizationService } from '../auth/authorization.service';
import type { CreateChecklistTemplateDto } from './checklist-templates.dto';

const templateProjection = {
  id: true,
  companyId: true,
  name: true,
  description: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  items: {
    select: {
      id: true,
      title: true,
      description: true,
      sortOrder: true,
      isRequired: true,
      relativeDueDays: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { sortOrder: 'asc' },
  },
} satisfies Prisma.ChecklistTemplateSelect;

@Injectable()
export class ChecklistTemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditWriterService,
    private readonly authorization: AuthorizationService,
  ) {}

  list(principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'admission.read');
    return this.prisma.checklistTemplate.findMany({
      where: { companyId: this.companyId(principal) },
      select: templateProjection,
      orderBy: { createdAt: 'desc' },
    });
  }

  async find(id: string, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'admission.read');
    return this.requireTemplate(id, principal);
  }

  async create(dto: CreateChecklistTemplateDto, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'admission.manage');
    const companyId = this.companyId(principal, dto.companyId);
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, status: 'ACTIVE' },
      select: { id: true },
    });
    if (!company) throw new ConflictException('Empresa inexistente ou inativa');
    const orders = new Set(dto.items.map((item) => item.sortOrder));
    if (orders.size !== dto.items.length)
      throw new ConflictException('A ordem dos itens deve ser única');
    return this.audit.transaction(async (tx) => {
      const created = await tx.checklistTemplate.create({
        data: {
          companyId,
          name: dto.name,
          description: dto.description,
          items: { create: dto.items },
        },
        select: templateProjection,
      });
      await this.audit.append(
        {
          principal,
          action: 'ADMISSION_CHECKLIST_TEMPLATE_CREATED',
          entityType: 'ChecklistTemplate',
          entityId: created.id,
          nextState: { status: created.status },
        },
        tx,
      );
      return created;
    });
  }

  async setStatus(id: string, status: string, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'admission.manage');
    const current = await this.requireTemplate(id, principal);
    if (current.status === status) return current;
    return this.audit.transaction(async (tx) => {
      const updated = await tx.checklistTemplate.update({
        where: { id, companyId: current.companyId },
        data: { status },
        select: templateProjection,
      });
      await this.audit.append(
        {
          principal,
          action: 'ADMISSION_CHECKLIST_TEMPLATE_STATUS_CHANGED',
          entityType: 'ChecklistTemplate',
          entityId: id,
          previousState: { status: current.status },
          nextState: { status: updated.status },
        },
        tx,
      );
      return updated;
    });
  }

  private async requireTemplate(id: string, principal: AuthenticatedPrincipal) {
    const item = await this.prisma.checklistTemplate.findFirst({
      where: { id, companyId: this.companyId(principal) },
      select: templateProjection,
    });
    if (!item) throw new NotFoundException('Template não encontrado');
    return item;
  }

  private companyId(principal: AuthenticatedPrincipal, requested?: string): string {
    const companyId = principal.activeCompanyId;
    if (!companyId || (requested && requested !== companyId))
      throw new NotFoundException('Template não encontrado');
    return companyId;
  }
}

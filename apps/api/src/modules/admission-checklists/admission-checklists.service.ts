import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
@Injectable()
export class AdmissionChecklistsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(processId: string) {
    const instance = await this.prisma.checklistInstance.findUnique({
      where: { admissionProcessId: processId },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
          include: { history: { orderBy: { occurredAt: 'desc' } } },
        },
      },
    });
    if (!instance) throw new NotFoundException('Checklist não encontrado');
    return instance;
  }
  async fromTemplate(processId: string) {
    const process = await this.prisma.admissionProcess.findUnique({ where: { id: processId } });
    if (!process) throw new NotFoundException('Processo admissional não encontrado');
    if (!process.checklistTemplateId) throw new ConflictException('Processo não possui template');
    const template = await this.prisma.checklistTemplate.findUnique({
      where: { id: process.checklistTemplateId },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!template || template.status !== 'ACTIVE') throw new ConflictException('Template inativo');
    return this.prisma.$transaction(async (tx) => {
      const exists = await tx.checklistInstance.findUnique({
        where: { admissionProcessId: processId },
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
        data: template.items.map((i) => ({
          checklistInstanceId: instance.id,
          title: i.title,
          description: i.description,
          sortOrder: i.sortOrder,
          isRequired: i.isRequired,
          dueDate:
            i.relativeDueDays === null
              ? null
              : new Date(process.plannedAdmissionDate.getTime() + i.relativeDueDays * 86400000),
        })),
      });
      return instance;
    });
  }
  async setItem(id: string, status: string, reason?: string) {
    const item = await this.prisma.admissionChecklistItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Item não encontrado');
    if ((status === 'NOT_APPLICABLE' || status === 'BLOCKED') && !reason)
      throw new ConflictException('Justificativa obrigatória');
    if (status === 'PENDING' && item.status === 'COMPLETED' && !reason)
      throw new ConflictException('Reabertura exige justificativa');
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.admissionChecklistItem.update({
        where: { id },
        data: {
          status,
          observation: reason,
          completedAt: status === 'COMPLETED' ? new Date() : null,
        },
      });
      await tx.admissionChecklistItemHistory.create({
        data: { admissionChecklistItemId: id, action: status, reason },
      });
      return updated;
    });
  }
}

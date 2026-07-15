import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateChecklistTemplateDto } from './checklist-templates.dto';
@Injectable()
export class ChecklistTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.checklistTemplate.findMany({
      include: { items: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }
  async find(id: string) {
    const item = await this.prisma.checklistTemplate.findUnique({
      where: { id },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!item) throw new NotFoundException('Template não encontrado');
    return item;
  }
  async create(dto: CreateChecklistTemplateDto) {
    const company = await this.prisma.company.findUnique({ where: { id: dto.companyId } });
    if (!company || company.status !== 'ACTIVE')
      throw new ConflictException('Empresa inexistente ou inativa');
    const orders = new Set(dto.items.map((i) => i.sortOrder));
    if (orders.size !== dto.items.length)
      throw new ConflictException('A ordem dos itens deve ser única');
    return this.prisma.checklistTemplate.create({
      data: {
        companyId: dto.companyId,
        name: dto.name,
        description: dto.description,
        items: { create: dto.items },
      },
      include: { items: true },
    });
  }
  async setStatus(id: string, status: string) {
    await this.find(id);
    return this.prisma.checklistTemplate.update({ where: { id }, data: { status } });
  }
}

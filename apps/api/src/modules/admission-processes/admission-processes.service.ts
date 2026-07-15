import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAdmissionProcessDto, UpdateAdmissionProcessDto } from './admission-processes.dto';
@Injectable()
export class AdmissionProcessesService {
  constructor(private readonly prisma: PrismaService) {}
  async list() {
    return this.prisma.admissionProcess.findMany({
      include: {
        employee: true,
        employmentContract: true,
        checklistInstances: { include: { items: true } },
      },
      orderBy: { plannedAdmissionDate: 'asc' },
    });
  }
  async find(id: string) {
    const item = await this.prisma.admissionProcess.findUnique({
      where: { id },
      include: {
        employee: true,
        employmentContract: true,
        checklistInstances: { include: { items: true } },
        documents: true,
        statusHistory: { orderBy: { occurredAt: 'desc' } },
      },
    });
    if (!item) throw new NotFoundException('Processo admissional não encontrado');
    return item;
  }
  async create(dto: CreateAdmissionProcessDto) {
    const contract = await this.prisma.employmentContract.findUnique({
      where: { id: dto.employmentContractId },
    });
    if (!contract || contract.employeeId !== dto.employeeId)
      throw new ConflictException('Contrato incompatível com o colaborador');
    const duplicate = await this.prisma.admissionProcess.findFirst({
      where: {
        employmentContractId: contract.id,
        status: { in: ['DRAFT', 'IN_PROGRESS', 'PENDING'] },
      },
    });
    if (duplicate)
      throw new ConflictException('Já existe processo admissional ativo para este contrato');
    if (dto.checklistTemplateId) {
      const template = await this.prisma.checklistTemplate.findUnique({
        where: { id: dto.checklistTemplateId },
      });
      if (!template || template.status !== 'ACTIVE' || template.companyId !== contract.companyId)
        throw new ConflictException('Template inexistente, inativo ou fora da empresa');
    }
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.admissionProcess.create({
        data: {
          ...dto,
          companyId: contract.companyId,
          plannedAdmissionDate: new Date(dto.plannedAdmissionDate),
        },
      });
      await tx.admissionStatusHistory.create({
        data: { admissionProcessId: item.id, status: 'DRAFT' },
      });
      return item;
    });
  }
  async update(id: string, dto: UpdateAdmissionProcessDto) {
    await this.find(id);
    return this.prisma.admissionProcess.update({
      where: { id },
      data: {
        ...dto,
        plannedAdmissionDate: dto.plannedAdmissionDate
          ? new Date(dto.plannedAdmissionDate)
          : undefined,
        effectiveAdmissionDate: dto.effectiveAdmissionDate
          ? new Date(dto.effectiveAdmissionDate)
          : undefined,
      },
    });
  }
  async cancel(id: string, reason: string) {
    const item = await this.find(id);
    if (['COMPLETED', 'CANCELLED'].includes(item.status))
      throw new ConflictException('Processo não pode ser cancelado');
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.admissionProcess.update({
        where: { id },
        data: { status: 'CANCELLED', cancellationReason: reason, cancelledAt: new Date() },
      });
      await tx.admissionStatusHistory.create({
        data: { admissionProcessId: id, status: 'CANCELLED', reason },
      });
      return updated;
    });
  }
  async complete(id: string) {
    const item = await this.find(id);
    const checklist = item.checklistInstances[0];
    if (!checklist) throw new ConflictException('Checklist obrigatório não gerado');
    if (
      checklist.items.some(
        (i) => i.isRequired && !['COMPLETED', 'NOT_APPLICABLE'].includes(i.status),
      )
    )
      throw new ConflictException('Existem itens obrigatórios pendentes');
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.admissionProcess.update({
        where: { id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
      await tx.admissionStatusHistory.create({
        data: { admissionProcessId: id, status: 'COMPLETED' },
      });
      return updated;
    });
  }
}

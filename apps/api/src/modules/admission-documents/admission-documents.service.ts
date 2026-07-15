import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAdmissionDocumentDto } from './admission-documents.dto';
@Injectable()
export class AdmissionDocumentsService {
  constructor(private readonly prisma: PrismaService) {}
  async list(processId: string) {
    await this.assertProcess(processId);
    return this.prisma.admissionDocumentRequirement.findMany({
      where: { admissionProcessId: processId },
      orderBy: { createdAt: 'asc' },
    });
  }
  async create(processId: string, dto: CreateAdmissionDocumentDto) {
    await this.assertProcess(processId);
    return this.prisma.admissionDocumentRequirement.create({
      data: { ...dto, admissionProcessId: processId },
    });
  }
  async markReceived(id: string, observation?: string) {
    return this.update(id, { receiptStatus: 'RECEIVED', receivedAt: new Date(), observation });
  }

  async updateObservation(id: string, observation?: string) {
    return this.update(id, { observation });
  }
  async markReviewed(id: string, observation?: string) {
    const item = await this.prisma.admissionDocumentRequirement.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Requisito documental não encontrado');
    if (item.receiptStatus !== 'RECEIVED')
      throw new ConflictException('Documento lógico ainda não foi recebido');
    return this.update(id, { reviewStatus: 'REVIEWED', reviewedAt: new Date(), observation });
  }
  private async update(id: string, data: object) {
    try {
      return await this.prisma.admissionDocumentRequirement.update({ where: { id }, data });
    } catch {
      throw new NotFoundException('Requisito documental não encontrado');
    }
  }
  private async assertProcess(id: string) {
    if (!(await this.prisma.admissionProcess.findUnique({ where: { id } })))
      throw new NotFoundException('Processo admissional não encontrado');
  }
}

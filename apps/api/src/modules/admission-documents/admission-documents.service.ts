import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditWriterService } from '../auth/audit-writer.service';
import { AuthorizationService } from '../auth/authorization.service';
import type { CreateAdmissionDocumentDto } from './admission-documents.dto';

const documentProjection = {
  id: true,
  admissionProcessId: true,
  documentType: true,
  isRequired: true,
  receiptStatus: true,
  reviewStatus: true,
  receivedAt: true,
  reviewedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AdmissionDocumentRequirementSelect;

@Injectable()
export class AdmissionDocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditWriterService,
    private readonly authorization: AuthorizationService,
  ) {}

  async list(processId: string, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'admission.read');
    await this.assertProcess(processId, principal);
    return this.prisma.admissionDocumentRequirement.findMany({
      where: { admissionProcessId: processId },
      select: documentProjection,
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(
    processId: string,
    dto: CreateAdmissionDocumentDto,
    principal: AuthenticatedPrincipal,
  ) {
    this.authorization.requireCapability(principal, 'admission.manage');
    await this.assertProcess(processId, principal);
    return this.audit.transaction(async (tx) => {
      const created = await tx.admissionDocumentRequirement.create({
        data: {
          admissionProcessId: processId,
          documentType: dto.documentType,
          isRequired: dto.isRequired,
          observation: dto.observation,
        },
        select: documentProjection,
      });
      await this.audit.append(
        {
          principal,
          action: 'ADMISSION_DOCUMENT_CREATED',
          entityType: 'AdmissionDocumentRequirement',
          entityId: created.id,
          nextState: {
            receiptStatus: created.receiptStatus,
            reviewStatus: created.reviewStatus,
          },
        },
        tx,
      );
      return created;
    });
  }

  markReceived(id: string, observation: string | undefined, principal: AuthenticatedPrincipal) {
    return this.update(
      id,
      { receiptStatus: 'RECEIVED', receivedAt: new Date(), observation },
      principal,
    );
  }

  updateObservation(
    id: string,
    observation: string | undefined,
    principal: AuthenticatedPrincipal,
  ) {
    return this.update(id, { observation }, principal);
  }

  async markReviewed(
    id: string,
    observation: string | undefined,
    principal: AuthenticatedPrincipal,
  ) {
    this.authorization.requireCapability(principal, 'admission.manage');
    const item = await this.requireDocument(id, principal);
    if (item.receiptStatus !== 'RECEIVED')
      throw new ConflictException('Documento lógico ainda não foi recebido');
    return this.update(
      id,
      { reviewStatus: 'REVIEWED', reviewedAt: new Date(), observation },
      principal,
      item,
    );
  }

  private async update(
    id: string,
    data: Prisma.AdmissionDocumentRequirementUpdateInput,
    principal: AuthenticatedPrincipal,
    known?: Awaited<ReturnType<AdmissionDocumentsService['requireDocument']>>,
  ) {
    this.authorization.requireCapability(principal, 'admission.manage');
    const current = known ?? (await this.requireDocument(id, principal));
    return this.audit.transaction(async (tx) => {
      const updated = await tx.admissionDocumentRequirement.update({
        where: { id },
        data,
        select: documentProjection,
      });
      await this.audit.append(
        {
          principal,
          action: 'ADMISSION_DOCUMENT_UPDATED',
          entityType: 'AdmissionDocumentRequirement',
          entityId: id,
          previousState: {
            receiptStatus: current.receiptStatus,
            reviewStatus: current.reviewStatus,
          },
          nextState: {
            receiptStatus: updated.receiptStatus,
            reviewStatus: updated.reviewStatus,
          },
        },
        tx,
      );
      return updated;
    });
  }

  private async requireDocument(id: string, principal: AuthenticatedPrincipal) {
    const item = await this.prisma.admissionDocumentRequirement.findFirst({
      where: {
        id,
        admissionProcess: { companyId: this.companyId(principal) },
      },
      select: documentProjection,
    });
    if (!item) throw new NotFoundException('Requisito documental não encontrado');
    return item;
  }

  private async assertProcess(id: string, principal: AuthenticatedPrincipal): Promise<void> {
    const process = await this.prisma.admissionProcess.findFirst({
      where: { id, companyId: this.companyId(principal) },
      select: { id: true },
    });
    if (!process) throw new NotFoundException('Processo admissional não encontrado');
  }

  private companyId(principal: AuthenticatedPrincipal): string {
    if (!principal.activeCompanyId) throw new NotFoundException('Recurso não encontrado');
    return principal.activeCompanyId;
  }
}

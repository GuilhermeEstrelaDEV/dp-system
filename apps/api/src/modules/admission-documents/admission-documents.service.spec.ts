import { ConflictException } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { AdmissionDocumentsService } from './admission-documents.service';

describe('AdmissionDocumentsService', () => {
  const prisma = {
    admissionProcess: { findFirst: jest.fn() },
    admissionDocumentRequirement: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
  const audit = {
    transaction: jest.fn((work: (tx: typeof prisma) => Promise<unknown>) => work(prisma)),
    append: jest.fn(),
  };
  const authorization = { requireCapability: jest.fn() };
  const principal = {
    actorId: 'actor',
    activeCompanyId: 'company',
    sessionId: 'session',
    traceId: 'trace',
    ipAddress: '127.0.0.1',
    userAgent: null,
    permissions: ['admission.read', 'admission.manage'],
    accessGrants: [],
  } satisfies AuthenticatedPrincipal;
  const service = new AdmissionDocumentsService(
    prisma as never,
    audit as never,
    authorization as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('does not review a logical document before its receipt is registered', async () => {
    prisma.admissionDocumentRequirement.findFirst.mockResolvedValue({
      id: 'document',
      receiptStatus: 'PENDING',
      reviewStatus: 'PENDING',
    });
    await expect(service.markReviewed('document', undefined, principal)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('records receipt and audit without exposing or uploading a file', async () => {
    prisma.admissionDocumentRequirement.findFirst.mockResolvedValue({
      id: 'document',
      receiptStatus: 'PENDING',
      reviewStatus: 'PENDING',
    });
    prisma.admissionDocumentRequirement.update.mockResolvedValue({
      id: 'document',
      receiptStatus: 'RECEIVED',
      reviewStatus: 'PENDING',
    });
    await expect(service.markReceived('document', undefined, principal)).resolves.toMatchObject({
      id: 'document',
      receiptStatus: 'RECEIVED',
    });
    expect(audit.append).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'ADMISSION_DOCUMENT_UPDATED' }),
      prisma,
    );
  });
});

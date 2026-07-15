import { ConflictException } from '@nestjs/common';
import { AdmissionDocumentsService } from './admission-documents.service';

describe('AdmissionDocumentsService', () => {
  const prisma = {
    admissionProcess: { findUnique: jest.fn() },
    admissionDocumentRequirement: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
  const service = new AdmissionDocumentsService(prisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('does not review a logical document before its receipt is registered', async () => {
    prisma.admissionDocumentRequirement.findUnique.mockResolvedValue({
      id: 'document',
      receiptStatus: 'PENDING',
    });
    await expect(service.markReviewed('document')).rejects.toBeInstanceOf(ConflictException);
  });

  it('records receipt without uploading an external file', async () => {
    prisma.admissionDocumentRequirement.update.mockResolvedValue({
      id: 'document',
      receiptStatus: 'RECEIVED',
    });
    await expect(service.markReceived('document')).resolves.toEqual({
      id: 'document',
      receiptStatus: 'RECEIVED',
    });
  });
});

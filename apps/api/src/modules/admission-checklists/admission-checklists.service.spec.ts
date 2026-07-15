import { ConflictException } from '@nestjs/common';
import { AdmissionChecklistsService } from './admission-checklists.service';

describe('AdmissionChecklistsService', () => {
  const prisma = {
    admissionProcess: { findUnique: jest.fn() },
    checklistTemplate: { findUnique: jest.fn() },
    checklistInstance: { findUnique: jest.fn(), create: jest.fn() },
    admissionChecklistItem: { findUnique: jest.fn(), createMany: jest.fn(), update: jest.fn() },
    admissionChecklistItemHistory: { create: jest.fn() },
    $transaction: jest.fn(),
  };
  const service = new AdmissionChecklistsService(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation((callback) => callback(prisma));
  });

  it('creates immutable checklist items from the selected template', async () => {
    prisma.admissionProcess.findUnique.mockResolvedValue({
      id: 'process',
      checklistTemplateId: 'template',
      plannedAdmissionDate: new Date('2026-01-15T00:00:00Z'),
    });
    prisma.checklistTemplate.findUnique.mockResolvedValue({
      id: 'template',
      name: 'Template fictício',
      status: 'ACTIVE',
      items: [
        { title: 'Item', description: null, sortOrder: 1, isRequired: true, relativeDueDays: 2 },
      ],
    });
    prisma.checklistInstance.findUnique.mockResolvedValue(null);
    prisma.checklistInstance.create.mockResolvedValue({ id: 'instance' });

    await service.fromTemplate('process');

    expect(prisma.admissionChecklistItem.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [expect.objectContaining({ checklistInstanceId: 'instance', title: 'Item' })],
      }),
    );
  });

  it('requires a reason to mark an item as not applicable', async () => {
    prisma.admissionChecklistItem.findUnique.mockResolvedValue({ id: 'item', status: 'PENDING' });
    await expect(service.setItem('item', 'NOT_APPLICABLE')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('requires an observation to reopen a completed item', async () => {
    prisma.admissionChecklistItem.findUnique.mockResolvedValue({ id: 'item', status: 'COMPLETED' });
    await expect(service.setItem('item', 'PENDING')).rejects.toBeInstanceOf(ConflictException);
  });
});

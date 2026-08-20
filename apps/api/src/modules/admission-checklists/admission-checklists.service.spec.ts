import { ConflictException } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { AdmissionChecklistsService } from './admission-checklists.service';

describe('AdmissionChecklistsService', () => {
  const prisma = {
    admissionProcess: { findFirst: jest.fn() },
    checklistTemplate: { findFirst: jest.fn() },
    checklistInstance: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(),
    },
    admissionChecklistItem: { findFirst: jest.fn(), createMany: jest.fn(), update: jest.fn() },
    admissionChecklistItemHistory: { create: jest.fn() },
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
  const service = new AdmissionChecklistsService(
    prisma as never,
    audit as never,
    authorization as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('creates immutable checklist items from the selected company template', async () => {
    prisma.admissionProcess.findFirst.mockResolvedValue({
      id: 'process',
      checklistTemplateId: 'template',
      plannedAdmissionDate: new Date('2026-01-15T00:00:00Z'),
    });
    prisma.checklistTemplate.findFirst.mockResolvedValue({
      id: 'template',
      name: 'Template fictício',
      items: [
        { title: 'Item', description: null, sortOrder: 1, isRequired: true, relativeDueDays: 2 },
      ],
    });
    prisma.checklistInstance.findUnique.mockResolvedValue(null);
    prisma.checklistInstance.create.mockResolvedValue({ id: 'instance' });
    prisma.checklistInstance.findUniqueOrThrow.mockResolvedValue({ id: 'instance', items: [] });

    await service.fromTemplate('process', principal);

    expect(prisma.admissionChecklistItem.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [expect.objectContaining({ checklistInstanceId: 'instance', title: 'Item' })],
      }),
    );
    expect(audit.append).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'ADMISSION_CHECKLIST_CREATED' }),
      prisma,
    );
  });

  it('requires a reason to mark an item as not applicable', async () => {
    prisma.admissionChecklistItem.findFirst.mockResolvedValue({ id: 'item', status: 'PENDING' });
    await expect(
      service.setItem('item', 'NOT_APPLICABLE', undefined, principal),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('requires an observation to reopen a completed item', async () => {
    prisma.admissionChecklistItem.findFirst.mockResolvedValue({ id: 'item', status: 'COMPLETED' });
    await expect(service.setItem('item', 'PENDING', undefined, principal)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});

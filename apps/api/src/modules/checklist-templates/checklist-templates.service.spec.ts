import { ConflictException } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { ChecklistTemplatesService } from './checklist-templates.service';

describe('ChecklistTemplatesService', () => {
  const prisma = {
    company: { findFirst: jest.fn() },
    checklistTemplate: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
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
  const service = new ChecklistTemplatesService(
    prisma as never,
    audit as never,
    authorization as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('rejects duplicate item order in a template', async () => {
    prisma.company.findFirst.mockResolvedValue({ id: 'company', status: 'ACTIVE' });
    await expect(
      service.create(
        {
          companyId: 'company',
          name: 'Template',
          items: [
            { title: 'A', sortOrder: 1 },
            { title: 'B', sortOrder: 1 },
          ],
        },
        principal,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

import { ConflictException } from '@nestjs/common';
import { ChecklistTemplatesService } from './checklist-templates.service';

describe('ChecklistTemplatesService', () => {
  const prisma = {
    company: { findUnique: jest.fn() },
    checklistTemplate: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };
  const service = new ChecklistTemplatesService(prisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('rejects duplicate item order in a template', async () => {
    prisma.company.findUnique.mockResolvedValue({ id: 'company', status: 'ACTIVE' });
    await expect(
      service.create({
        companyId: 'company',
        name: 'Template',
        items: [
          { title: 'A', sortOrder: 1 },
          { title: 'B', sortOrder: 1 },
        ],
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

import { NotFoundException } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { OrganizationResourceService } from './organization-resource.service';

describe('OrganizationResourceService', () => {
  const item = {
    id: 'branch-a',
    companyId: 'company-a',
    code: 'HQ',
    name: 'Matriz demonstrativa',
    taxId: '00.000.000/0001-00',
    status: 'ACTIVE',
  };
  const prisma = {
    company: { findFirst: jest.fn() },
    branch: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    department: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    position: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    costCenter: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const audit = {
    transaction: jest.fn((work: (tx: typeof prisma) => Promise<unknown>) => work(prisma)),
    append: jest.fn(),
  };
  const authorization = { requireCapability: jest.fn() };
  const principal = {
    actorId: 'actor',
    activeCompanyId: 'company-a',
    sessionId: 'session',
    traceId: 'trace',
    ipAddress: '127.0.0.1',
    userAgent: null,
    permissions: ['organization.read', 'organization.manage'],
    accessGrants: [],
  } satisfies AuthenticatedPrincipal;
  const service = new OrganizationResourceService(
    prisma as never,
    audit as never,
    authorization as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('scopes list projection to the active company', async () => {
    prisma.$transaction.mockResolvedValue([[item], 1]);
    await expect(
      service.list(
        'branch',
        { page: 1, pageSize: 20, sortBy: 'name', sortDirection: 'asc' },
        principal,
      ),
    ).resolves.toEqual(expect.objectContaining({ items: [item] }));
    expect(prisma.branch.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ companyId: 'company-a' }),
        select: expect.not.objectContaining({ address: true }),
      }),
    );
  });

  it('returns 404 instead of disclosing a requested foreign company', async () => {
    await expect(
      service.list(
        'branch',
        {
          page: 1,
          pageSize: 20,
          sortBy: 'name',
          sortDirection: 'asc',
          companyId: 'company-b',
        },
        principal,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.branch.findMany).not.toHaveBeenCalled();
  });

  it('creates from the active context and appends audit atomically', async () => {
    prisma.company.findFirst.mockResolvedValue({ id: 'company-a' });
    prisma.branch.create.mockResolvedValue(item);
    await expect(
      service.create('branch', { code: 'HQ', name: 'Matriz demonstrativa' }, principal),
    ).resolves.toEqual(item);
    expect(prisma.branch.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ companyId: 'company-a' }) }),
    );
    expect(audit.append).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'ORGANIZATION_RESOURCE_CREATED' }),
      prisma,
    );
  });

  it('propagates audit failure so the shared transaction can roll back', async () => {
    prisma.company.findFirst.mockResolvedValue({ id: 'company-a' });
    prisma.branch.create.mockResolvedValue(item);
    audit.append.mockRejectedValueOnce(new Error('audit unavailable'));
    await expect(
      service.create('branch', { code: 'HQ', name: 'Matriz demonstrativa' }, principal),
    ).rejects.toThrow('audit unavailable');
  });
});

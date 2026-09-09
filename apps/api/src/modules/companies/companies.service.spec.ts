import { ConflictException, NotFoundException } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';

describe('CompaniesService', () => {
  const company = {
    id: 'company-a',
    legalName: 'Empresa Fictícia',
    tradeName: 'Demo',
    taxId: '00',
    status: 'ACTIVE',
  };
  const prisma = {
    company: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    branch: { count: jest.fn() },
    department: { count: jest.fn() },
    position: { count: jest.fn() },
    costCenter: { count: jest.fn() },
    $transaction: jest.fn(),
  };
  const principal = {
    actorId: 'actor',
    activeCompanyId: 'company-a',
    sessionId: 'session',
    traceId: 'trace',
    ipAddress: '127.0.0.1',
    userAgent: null,
    permissions: ['company.manage'],
    accessGrants: [],
  } as AuthenticatedPrincipal;
  const audit = {
    append: jest.fn(),
    transaction: jest.fn((work: (tx: typeof prisma) => unknown) => work(prisma)),
  };
  const authorization = { requireCapability: jest.fn() };
  const service = new CompaniesService(prisma as never, audit as never, authorization as never);
  beforeEach(() => jest.clearAllMocks());
  it('creates a valid company', async () => {
    prisma.company.create.mockResolvedValue(company);
    await expect(
      service.create({ legalName: 'Empresa Fictícia', tradeName: 'Demo', taxId: '00' }, principal),
    ).resolves.toEqual(company);
  });
  it('fails the business transaction when the required audit event cannot be appended', async () => {
    prisma.company.create.mockResolvedValue(company);
    audit.append.mockRejectedValueOnce(new Error('audit unavailable'));
    await expect(
      service.create({ legalName: 'Empresa Fictícia', tradeName: 'Demo', taxId: '00' }, principal),
    ).rejects.toThrow('audit unavailable');
  });
  it('returns 404 for an absent company', async () => {
    prisma.company.findUnique.mockResolvedValue(null);
    await expect(service.find('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
  it('blocks inactivation with active dependencies', async () => {
    prisma.company.findUnique.mockResolvedValue(company);
    prisma.$transaction.mockResolvedValue([1, 0, 0, 0]);
    await expect(service.setStatus(company.id, 'INACTIVE', principal)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});

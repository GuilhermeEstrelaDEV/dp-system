import { ConflictException, NotFoundException } from '@nestjs/common';
import { PayrollParametersService } from './payroll-parameters.service';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
describe('PayrollParametersService', () => {
  const prisma = {
    payrollParameter: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    payrollRun: { count: jest.fn() },
    $transaction: jest.fn(),
  };
  const principal = {
    actorId: 'actor',
    activeCompanyId: 'company',
    sessionId: 'session',
    traceId: 'trace',
    ipAddress: '127.0.0.1',
    userAgent: null,
    permissions: ['payroll.parameter.manage'],
    accessGrants: [],
  } as AuthenticatedPrincipal;
  const audit = {
    append: jest.fn(),
    transaction: jest.fn((work: (tx: typeof prisma) => unknown) => work(prisma)),
  };
  const authorization = { requireCapability: jest.fn() };
  const service = new PayrollParametersService(
    prisma as never,
    audit as never,
    authorization as never,
  );
  const dto = {
    code: 'TEST',
    name: 'Parâmetro demonstrativo',
    category: 'TECHNICAL',
    version: 'v1',
    validFrom: '2026-07-01',
  };
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation((callback) => callback(prisma));
  });
  it('creates a parameter version with a valid period', async () => {
    prisma.payrollParameter.findFirst.mockResolvedValue(null);
    prisma.payrollParameter.create.mockResolvedValue({ id: 'parameter' });
    await service.create(dto, principal);
    expect(prisma.payrollParameter.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ code: 'TEST', validFrom: expect.any(Date) }),
      }),
    );
  });
  it('rejects incompatible overlapping validity', async () => {
    prisma.payrollParameter.findFirst.mockResolvedValue({ id: 'existing' });
    await expect(service.create(dto, principal)).rejects.toBeInstanceOf(ConflictException);
  });
  it('rejects invalid validity bounds', async () => {
    await expect(
      service.create({ ...dto, validTo: '2026-06-30' }, principal),
    ).rejects.toBeInstanceOf(ConflictException);
  });
  it('returns 404 for a missing parameter', async () => {
    prisma.payrollParameter.findFirst.mockResolvedValue(null);
    await expect(service.find('missing', principal)).rejects.toBeInstanceOf(NotFoundException);
  });
  it('protects a version used by a closed period', async () => {
    prisma.payrollParameter.findFirst.mockResolvedValue({ id: 'parameter', version: 'v1' });
    prisma.payrollRun.count.mockResolvedValue(1);
    await expect(
      service.update('parameter', { name: 'Alterado' }, principal),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

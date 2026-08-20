import { ConflictException, NotFoundException } from '@nestjs/common';
import { PayrollRubricsService } from './payroll-rubrics.service';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
describe('PayrollRubricsService', () => {
  const prisma = {
    payrollRubricCategory: { findFirst: jest.fn() },
    payrollRubric: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    payrollCalculationItem: { count: jest.fn() },
    $transaction: jest.fn(),
  };
  const principal = {
    actorId: 'actor',
    activeCompanyId: 'company',
    sessionId: 'session',
    traceId: 'trace',
    ipAddress: '127.0.0.1',
    userAgent: null,
    permissions: ['payroll.rubric.manage'],
    accessGrants: [],
  } as AuthenticatedPrincipal;
  const audit = {
    append: jest.fn(),
    transaction: jest.fn((work: (tx: typeof prisma) => unknown) => work(prisma)),
  };
  const authorization = { requireCapability: jest.fn() };
  const service = new PayrollRubricsService(
    prisma as never,
    audit as never,
    authorization as never,
  );
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation((callback) => callback(prisma));
  });
  const dto = {
    companyId: 'company',
    payrollRubricCategoryId: 'category',
    code: 'R1',
    name: 'Rubrica',
    version: 'v1',
    validFrom: '2026-07-01',
  };
  it('creates a rubric with first validity', async () => {
    prisma.payrollRubricCategory.findFirst.mockResolvedValue({ id: 'category' });
    prisma.payrollRubric.create.mockResolvedValue({ id: 'rubric' });
    await service.create(dto, principal);
    expect(prisma.payrollRubric.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ versions: expect.any(Object) }) }),
    );
  });
  it('rejects invalid validity', async () => {
    await expect(
      service.create({ ...dto, validTo: '2026-06-30' }, principal),
    ).rejects.toBeInstanceOf(ConflictException);
  });
  it('returns 404 for missing rubric', async () => {
    prisma.payrollRubric.findFirst.mockResolvedValue(null);
    await expect(service.find('missing', principal)).rejects.toBeInstanceOf(NotFoundException);
  });
  it('protects historic rubric name', async () => {
    prisma.payrollRubric.findFirst.mockResolvedValue({
      id: 'rubric',
      name: 'Antes',
      versions: [],
      payrollRubricCategory: {},
    });
    prisma.payrollCalculationItem.count.mockResolvedValue(1);
    await expect(service.update('rubric', { name: 'Depois' }, principal)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});

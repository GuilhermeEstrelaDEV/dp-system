import { ConflictException, NotFoundException } from '@nestjs/common';
import { PayrollRubricsService } from './payroll-rubrics.service';
describe('PayrollRubricsService', () => {
  const prisma = {
    payrollRubricCategory: { findUnique: jest.fn() },
    payrollRubric: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    payrollCalculationItem: { count: jest.fn() },
    $transaction: jest.fn(),
  };
  const service = new PayrollRubricsService(prisma as never);
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
    prisma.payrollRubricCategory.findUnique.mockResolvedValue({ companyId: 'company' });
    prisma.payrollRubric.create.mockResolvedValue({ id: 'rubric' });
    await service.create(dto);
    expect(prisma.payrollRubric.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ versions: expect.any(Object) }) }),
    );
  });
  it('rejects invalid validity', async () => {
    await expect(service.create({ ...dto, validTo: '2026-06-30' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
  it('returns 404 for missing rubric', async () => {
    prisma.payrollRubric.findUnique.mockResolvedValue(null);
    await expect(service.find('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
  it('protects historic rubric name', async () => {
    prisma.payrollRubric.findUnique.mockResolvedValue({
      id: 'rubric',
      name: 'Antes',
      versions: [],
      payrollRubricCategory: {},
    });
    prisma.payrollCalculationItem.count.mockResolvedValue(1);
    await expect(service.update('rubric', { name: 'Depois' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});

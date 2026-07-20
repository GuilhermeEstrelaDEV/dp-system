import { ConflictException, NotFoundException } from '@nestjs/common';
import { PayrollInputsService } from './payroll-inputs.service';
describe('PayrollInputsService', () => {
  const prisma = {
    payrollPeriod: { findUnique: jest.fn() },
    employmentContract: { findUnique: jest.fn() },
    payrollRubric: { findUnique: jest.fn() },
    payrollInput: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const service = new PayrollInputsService(prisma as never);
  const dto = {
    payrollPeriodId: 'period',
    employeeId: 'employee',
    employmentContractId: 'contract',
    payrollRubricId: 'rubric',
    amount: '10.50',
    sourceKey: 'source',
  };
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation((callback) => callback(prisma));
  });
  const prepare = () => {
    prisma.payrollPeriod.findUnique.mockResolvedValue({
      id: 'period',
      status: 'OPEN',
      companyId: 'company',
      referenceDate: new Date('2026-07-01'),
    });
    prisma.employmentContract.findUnique.mockResolvedValue({
      id: 'contract',
      employeeId: 'employee',
      companyId: 'company',
    });
    prisma.payrollRubric.findUnique.mockResolvedValue({
      id: 'rubric',
      status: 'ACTIVE',
      versions: [{ status: 'ACTIVE', validFrom: new Date('2026-01-01'), validTo: null }],
    });
  };
  it('creates an input using Prisma Decimal-compatible text', async () => {
    prepare();
    prisma.payrollInput.create.mockResolvedValue({ id: 'input' });
    await service.create(dto);
    expect(prisma.payrollInput.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ amount: expect.anything(), sourceKey: 'source' }),
    });
  });
  it('rejects missing linked records', async () => {
    prisma.payrollPeriod.findUnique.mockResolvedValue(null);
    prisma.employmentContract.findUnique.mockResolvedValue(null);
    prisma.payrollRubric.findUnique.mockResolvedValue(null);
    await expect(service.create(dto)).rejects.toBeInstanceOf(NotFoundException);
  });
  it('rejects incompatible contract', async () => {
    prepare();
    prisma.employmentContract.findUnique.mockResolvedValue({
      employeeId: 'other',
      companyId: 'company',
    });
    await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
  });
  it('rejects inactive or out-of-validity rubric', async () => {
    prepare();
    prisma.payrollRubric.findUnique.mockResolvedValue({ status: 'INACTIVE', versions: [] });
    await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
  });
  it('rejects a closed period update', async () => {
    prisma.payrollInput.findUnique.mockResolvedValue({
      id: 'input',
      payrollPeriod: { status: 'CLOSED' },
    });
    await expect(service.update('input', { amount: '12.00' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});

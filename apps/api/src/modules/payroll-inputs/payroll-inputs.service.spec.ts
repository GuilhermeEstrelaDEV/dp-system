import { ConflictException, NotFoundException } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { PayrollInputsService } from './payroll-inputs.service';

describe('PayrollInputsService', () => {
  const principal: AuthenticatedPrincipal = {
    actorId: 'actor',
    activeCompanyId: 'company',
    sessionId: 'session',
    traceId: 'trace',
    ipAddress: '127.0.0.1',
    userAgent: 'test',
    permissions: ['payroll.input.read', 'payroll.input.manage'],
    accessGrants: [],
  };
  const prisma = {
    payrollPeriod: { findFirst: jest.fn() },
    employmentContract: { findFirst: jest.fn() },
    payrollRubric: { findFirst: jest.fn() },
    payrollInput: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const audit = { transaction: jest.fn(), append: jest.fn() };
  const authorization = { requireCapability: jest.fn() };
  const service = new PayrollInputsService(prisma as never, audit as never, authorization as never);
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
    audit.transaction.mockImplementation((callback) => callback(prisma));
  });

  const prepare = () => {
    prisma.payrollPeriod.findFirst.mockResolvedValue({
      id: 'period',
      status: 'OPEN',
      referenceDate: new Date('2026-07-01'),
    });
    prisma.employmentContract.findFirst.mockResolvedValue({
      id: 'contract',
      employeeId: 'employee',
    });
    prisma.payrollRubric.findFirst.mockResolvedValue({
      id: 'rubric',
      status: 'ACTIVE',
      versions: [{ status: 'ACTIVE', validFrom: new Date('2026-01-01'), validTo: null }],
    });
  };

  it('creates an input and audit atomically using decimal text', async () => {
    prepare();
    prisma.payrollInput.create.mockResolvedValue({
      id: 'input',
      status: 'PENDING',
      source: 'MANUAL',
    });
    await service.create(dto, principal);
    expect(prisma.payrollInput.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ amount: expect.anything() }) }),
    );
    expect(audit.append).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PAYROLL_INPUT_CREATED' }),
      prisma,
    );
  });

  it('uses active-company constraints on every linked record', async () => {
    prepare();
    prisma.payrollInput.create.mockResolvedValue({
      id: 'input',
      status: 'PENDING',
      source: 'MANUAL',
    });
    await service.create(dto, principal);
    expect(prisma.payrollPeriod.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'period', companyId: 'company' } }),
    );
    expect(prisma.employmentContract.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'contract', companyId: 'company' } }),
    );
    expect(prisma.payrollRubric.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'rubric', companyId: 'company' } }),
    );
  });

  it('rejects missing or cross-company linked records', async () => {
    prisma.payrollPeriod.findFirst.mockResolvedValue(null);
    prisma.employmentContract.findFirst.mockResolvedValue(null);
    prisma.payrollRubric.findFirst.mockResolvedValue(null);
    await expect(service.create(dto, principal)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects incompatible contract and inactive rubric', async () => {
    prepare();
    prisma.employmentContract.findFirst.mockResolvedValue({ employeeId: 'other' });
    await expect(service.create(dto, principal)).rejects.toBeInstanceOf(ConflictException);
    prepare();
    prisma.payrollRubric.findFirst.mockResolvedValue({ status: 'INACTIVE', versions: [] });
    await expect(service.create(dto, principal)).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects mutation in a closed period', async () => {
    prisma.payrollInput.findFirst.mockResolvedValue({
      id: 'input',
      status: 'PENDING',
      payrollPeriod: { status: 'CLOSED' },
    });
    await expect(service.update('input', { amount: '12.00' }, principal)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('fails the write when audit fails', async () => {
    prepare();
    prisma.payrollInput.create.mockResolvedValue({
      id: 'input',
      status: 'PENDING',
      source: 'MANUAL',
    });
    audit.append.mockRejectedValueOnce(new Error('audit failed'));
    await expect(service.create(dto, principal)).rejects.toThrow('audit failed');
  });
});

import { ConflictException, NotFoundException } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { PayrollCalculationService } from './domain/payroll-calculation.service';
import { PayrollRunsService } from './payroll-runs.service';

describe('PayrollRunsService', () => {
  const principal: AuthenticatedPrincipal = {
    actorId: 'actor',
    activeCompanyId: 'company',
    sessionId: 'session',
    traceId: 'trace',
    ipAddress: '127.0.0.1',
    userAgent: 'test',
    permissions: ['payroll.run.read', 'payroll.run.manage'],
    accessGrants: [],
  };
  const prisma = {
    payrollPeriod: { findFirst: jest.fn() },
    payrollInput: { findMany: jest.fn() },
    payrollRun: {
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    payrollRunEmployee: { create: jest.fn() },
    payrollCalculationItem: { createMany: jest.fn() },
    payrollRunMessage: { create: jest.fn(), count: jest.fn(), findMany: jest.fn() },
    $transaction: jest.fn(),
  };
  const audit = { transaction: jest.fn(), append: jest.fn() };
  const authorization = { requireCapability: jest.fn() };
  const service = new PayrollRunsService(
    prisma as never,
    new PayrollCalculationService(),
    audit as never,
    authorization as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    audit.transaction.mockImplementation((callback) => callback(prisma));
    prisma.payrollInput.findMany.mockResolvedValue([]);
    prisma.payrollRunMessage.count.mockResolvedValue(0);
    prisma.payrollRun.update.mockResolvedValue({
      id: 'run',
      status: 'COMPLETED',
      messages: [],
      employees: [],
    });
  });

  it('returns 404 for a missing or cross-company period', async () => {
    prisma.payrollPeriod.findFirst.mockResolvedValue(null);
    await expect(
      service.start({ payrollPeriodId: 'period', engineVersion: 'calculation-v1' }, principal),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.payrollPeriod.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'period', companyId: 'company' } }),
    );
  });

  it('rejects a closed period and a concurrent run', async () => {
    prisma.payrollPeriod.findFirst.mockResolvedValue({ id: 'period', status: 'CLOSED' });
    await expect(
      service.start({ payrollPeriodId: 'period', engineVersion: 'calculation-v1' }, principal),
    ).rejects.toBeInstanceOf(ConflictException);
    prisma.payrollPeriod.findFirst.mockResolvedValue({
      id: 'period',
      status: 'OPEN',
      referenceDate: new Date('2026-07-01'),
    });
    prisma.payrollRun.count.mockResolvedValue(1);
    await expect(
      service.start({ payrollPeriodId: 'period', engineVersion: 'calculation-v1' }, principal),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('calculates existing inputs and writes one transactional audit event', async () => {
    const referenceDate = new Date('2026-07-01');
    prisma.payrollPeriod.findFirst.mockResolvedValue({
      id: 'period',
      status: 'OPEN',
      referenceDate,
    });
    prisma.payrollRun.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
    prisma.payrollRun.create.mockResolvedValue({ id: 'run' });
    prisma.payrollRunEmployee.create.mockResolvedValue({ id: 'run-employee' });
    prisma.payrollInput.findMany.mockResolvedValue([
      {
        id: 'input',
        employmentContractId: 'contract',
        payrollRubricId: 'rubric',
        amount: { toString: () => '1500.00' },
        quantity: null,
        payrollRubric: {
          code: 'BASE',
          payrollRubricCategory: { nature: 'EARNING' },
          versions: [{ id: 'version', status: 'ACTIVE', validFrom: referenceDate, validTo: null }],
        },
      },
    ]);

    await service.start(
      {
        payrollPeriodId: 'period',
        engineVersion: 'calculation-v1',
        parameterSnapshotVersion: 'parameters-v1',
      },
      principal,
    );

    expect(prisma.payrollCalculationItem.createMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({ payrollRubricVersionId: 'version' })],
    });
    expect(audit.append).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PAYROLL_RUN_STARTED', entityId: 'run' }),
      prisma,
    );
  });

  it('fails safely when a rubric nature is unsupported and audits the failed result', async () => {
    prisma.payrollPeriod.findFirst.mockResolvedValue({
      id: 'period',
      status: 'OPEN',
      referenceDate: new Date('2026-07-01'),
    });
    prisma.payrollRun.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
    prisma.payrollRun.create.mockResolvedValue({ id: 'run' });
    prisma.payrollInput.findMany.mockResolvedValue([
      { payrollRubric: { payrollRubricCategory: { nature: 'UNKNOWN' } } },
    ]);
    prisma.payrollRun.update.mockResolvedValue({
      id: 'run',
      status: 'FAILED',
      messages: [],
      employees: [],
    });

    await service.start({ payrollPeriodId: 'period', engineVersion: 'calculation-v1' }, principal);
    expect(prisma.payrollRunMessage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ code: 'UNSUPPORTED_RUBRIC_NATURE' }),
    });
    expect(audit.append).toHaveBeenCalledWith(
      expect.objectContaining({ nextState: { status: 'FAILED' } }),
      prisma,
    );
  });

  it('scopes run detail and appends manual messages atomically', async () => {
    prisma.payrollRun.findFirst.mockResolvedValue({ id: 'run', messages: [], employees: [] });
    prisma.payrollRunMessage.create.mockResolvedValue({
      id: 'message',
      severity: 'WARNING',
      code: 'NOTE',
    });
    await service.addMessage(
      'run',
      { severity: 'WARNING', code: 'NOTE', message: 'Operational note' },
      principal,
    );
    expect(prisma.payrollRun.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'run', payrollPeriod: { companyId: 'company' } } }),
    );
    expect(audit.append).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PAYROLL_RUN_MESSAGE_CREATED' }),
      prisma,
    );
  });

  it('fails the run write when audit fails', async () => {
    prisma.payrollPeriod.findFirst.mockResolvedValue({
      id: 'period',
      status: 'OPEN',
      referenceDate: new Date('2026-07-01'),
    });
    prisma.payrollRun.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
    prisma.payrollRun.create.mockResolvedValue({ id: 'run' });
    audit.append.mockRejectedValueOnce(new Error('audit failed'));
    await expect(
      service.start({ payrollPeriodId: 'period', engineVersion: 'calculation-v1' }, principal),
    ).rejects.toThrow('audit failed');
  });
});

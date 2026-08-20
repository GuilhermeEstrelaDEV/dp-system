import { NotFoundException } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { VariableCompensationService } from './variable-compensation.service';

describe('VariableCompensationService', () => {
  const prisma = {
    employmentContract: { findFirst: jest.fn() },
    payrollRun: { findFirst: jest.fn() },
    variableCompensationEvent: { findMany: jest.fn(), create: jest.fn() },
    salaryAdvance: { findMany: jest.fn(), create: jest.fn() },
    offCyclePayment: { findMany: jest.fn(), create: jest.fn() },
    payrollReconciliation: { findMany: jest.fn(), create: jest.fn() },
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
    permissions: ['variable_compensation.read', 'variable_compensation.manage'],
    accessGrants: [],
  } satisfies AuthenticatedPrincipal;
  const service = new VariableCompensationService(
    prisma as never,
    audit as never,
    authorization as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('creates and audits a decimal event for an active-company contract', async () => {
    prisma.employmentContract.findFirst.mockResolvedValue({ id: 'contract', companyId: 'company' });
    prisma.variableCompensationEvent.create.mockResolvedValue({
      id: 'event',
      approvalStatus: 'PENDING',
    });
    await service.createEvent(
      {
        employmentContractId: 'contract',
        referencePeriod: '2026-07-01',
        type: 'COMMISSION',
        amount: '125.50',
        policyReference: 'Referência fictícia',
      },
      principal,
    );
    expect(prisma.variableCompensationEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ amount: expect.objectContaining({}) }),
      }),
    );
    expect(audit.append).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'VARIABLE_COMPENSATION_EVENT_CREATED' }),
      prisma,
    );
  });

  it('returns 404 for an advance contract outside the active company', async () => {
    prisma.employmentContract.findFirst.mockResolvedValue(null);
    await expect(
      service.createAdvance(
        { employmentContractId: 'missing', referencePeriod: '2026-07-01', amount: '100.00' },
        principal,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates an off-cycle payment without triggering payroll calculation', async () => {
    prisma.employmentContract.findFirst.mockResolvedValue({ id: 'contract', companyId: 'company' });
    prisma.offCyclePayment.create.mockResolvedValue({ id: 'payment', approvalStatus: 'PENDING' });
    await service.createOffCyclePayment(
      {
        employmentContractId: 'contract',
        referencePeriod: '2026-07-01',
        amount: '80.00',
        reason: 'Registro administrativo demonstrativo',
      },
      principal,
    );
    expect(prisma.offCyclePayment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ reason: 'Registro administrativo demonstrativo' }),
      }),
    );
  });

  it('requires a payroll run from the active company for reconciliation', async () => {
    prisma.payrollRun.findFirst.mockResolvedValue(null);
    await expect(
      service.createReconciliation(
        { payrollRunId: 'missing', type: 'MANUAL_COMPARISON', differenceAmount: '-10.00' },
        principal,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

import { ConflictException, NotFoundException } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { BenefitsService } from './benefits.service';

describe('BenefitsService', () => {
  const prisma = {
    benefit: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn() },
    benefitPlan: { create: jest.fn(), findFirst: jest.fn() },
    benefitEnrollment: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    benefitEnrollmentHistory: { create: jest.fn() },
    employmentContract: { findFirst: jest.fn() },
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
    permissions: ['benefit.read', 'benefit.manage'],
    accessGrants: [],
  } satisfies AuthenticatedPrincipal;
  const service = new BenefitsService(prisma as never, audit as never, authorization as never);

  beforeEach(() => jest.clearAllMocks());

  it('rejects an inverted plan validity period', async () => {
    await expect(
      service.plan(
        {
          benefitId: 'benefit',
          name: 'Plano',
          employeeAmount: '10.00',
          companyAmount: '20.00',
          validFrom: '2026-08-10',
          validTo: '2026-08-01',
        },
        principal,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns 404 when a plan is outside the active company', async () => {
    prisma.benefit.findFirst.mockResolvedValue(null);
    await expect(
      service.plan(
        {
          benefitId: 'other-benefit',
          name: 'Plano',
          employeeAmount: '10.00',
          companyAmount: '20.00',
          validFrom: '2026-08-01',
        },
        principal,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates enrollment history and audit in the same transaction', async () => {
    prisma.employmentContract.findFirst.mockResolvedValue({ id: 'contract', companyId: 'company' });
    prisma.benefitPlan.findFirst.mockResolvedValue({
      id: 'plan',
      benefitId: 'benefit',
      status: 'ACTIVE',
    });
    prisma.benefitEnrollment.findFirst.mockResolvedValue(null);
    prisma.benefitEnrollment.create.mockResolvedValue({ id: 'enrollment', status: 'ACTIVE' });
    await service.enroll(
      {
        employmentContractId: 'contract',
        benefitPlanId: 'plan',
        validFrom: '2026-08-01',
      },
      principal,
    );
    expect(prisma.benefitEnrollmentHistory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ benefitEnrollmentId: 'enrollment', action: 'ENROLLED' }),
    });
    expect(audit.append).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'BENEFIT_ENROLLMENT_CREATED' }),
      prisma,
    );
  });

  it('filters the catalog strictly by active company with an explicit projection', async () => {
    prisma.benefit.findMany.mockResolvedValue([]);
    await service.list({ search: 'demo' }, principal);
    expect(prisma.benefit.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ companyId: 'company' }),
        select: expect.any(Object),
      }),
    );
  });

  it('propagates audit failure to roll back a critical write', async () => {
    prisma.benefit.create.mockResolvedValue({ id: 'benefit', status: 'ACTIVE', plans: [] });
    audit.append.mockRejectedValueOnce(new Error('audit unavailable'));
    await expect(
      service.create({ code: 'DEMO', name: 'Benefício', type: 'GENERIC' }, principal),
    ).rejects.toThrow('audit unavailable');
  });
});

import { ConflictException } from '@nestjs/common';
import { BenefitsService } from './benefits.service';

describe('BenefitsService', () => {
  const prisma = {
    benefit: { findMany: jest.fn(), create: jest.fn() },
    benefitPlan: { create: jest.fn(), findUnique: jest.fn() },
    benefitEnrollment: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    benefitEnrollmentHistory: { create: jest.fn() },
    employmentContract: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  };
  const service = new BenefitsService(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation((callback) => callback(prisma));
  });

  it('rejects a plan whose end date precedes its validity start', async () => {
    await expect(
      service.plan({
        benefitId: 'f9201b38-8740-4a27-89ce-e28903d47da6',
        name: 'Demonstrativo',
        employeeAmount: '10.00',
        companyAmount: '20.00',
        validFrom: '2026-08-01',
        validTo: '2026-07-31',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('blocks an overlapping active enrollment for the same benefit', async () => {
    prisma.employmentContract.findUnique.mockResolvedValue({
      id: 'contract',
      companyId: 'company',
    });
    prisma.benefitPlan.findUnique.mockResolvedValue({
      id: 'plan',
      benefitId: 'benefit',
      benefit: { companyId: 'company' },
    });
    prisma.benefitEnrollment.findFirst.mockResolvedValue({ id: 'existing' });

    await expect(
      service.enroll({
        employmentContractId: 'contract',
        benefitPlanId: 'plan',
        validFrom: '2026-08-01',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('records the lifecycle history when an enrollment is suspended', async () => {
    prisma.benefitEnrollment.findUnique.mockResolvedValue({ id: 'enrollment', status: 'ACTIVE' });
    prisma.benefitEnrollment.update.mockResolvedValue({ id: 'enrollment', status: 'SUSPENDED' });

    await service.changeEnrollmentStatus('enrollment', {
      status: 'SUSPENDED',
      reason: 'Suspensão demonstrativa',
    });

    expect(prisma.benefitEnrollmentHistory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'SUSPENDED', benefitEnrollmentId: 'enrollment' }),
    });
  });
});

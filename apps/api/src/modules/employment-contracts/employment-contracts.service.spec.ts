import { ConflictException } from '@nestjs/common';
import { EmploymentContractsService } from './employment-contracts.service';

const baseInput = {
  employeeId: 'employee-1',
  companyId: 'company-1',
  positionId: 'position-1',
  registrationNumber: 'MAT-01',
  contractType: 'CLT',
  employmentRegime: 'Mensalista',
  startDate: '2026-01-01',
  weeklyHours: 44,
};
function createService(overrides: Record<string, unknown> = {}) {
  const prisma = {
    employee: { findUnique: jest.fn().mockResolvedValue({ id: 'employee-1', status: 'ACTIVE' }) },
    company: { findUnique: jest.fn().mockResolvedValue({ id: 'company-1', status: 'ACTIVE' }) },
    position: {
      findUnique: jest
        .fn()
        .mockResolvedValue({ id: 'position-1', companyId: 'company-1', status: 'ACTIVE' }),
    },
    branch: { findFirst: jest.fn().mockResolvedValue(null), findUnique: jest.fn() },
    department: { findFirst: jest.fn().mockResolvedValue(null), findUnique: jest.fn() },
    costCenter: { findFirst: jest.fn().mockResolvedValue(null), findUnique: jest.fn() },
    employmentContract: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'contract-1', ...baseInput }),
    },
    contractHistory: { create: jest.fn().mockResolvedValue({}) },
    $transaction: jest.fn(),
    ...overrides,
  };
  prisma.$transaction.mockImplementation(async (input: unknown) =>
    Array.isArray(input)
      ? Promise.all(input)
      : (input as (client: never) => Promise<unknown>)(prisma as never),
  );
  return { service: new EmploymentContractsService(prisma as never), prisma };
}

describe('EmploymentContractsService', () => {
  it('creates a contract and its immutable history entry', async () => {
    const { service, prisma } = createService();
    await service.create(baseInput);
    expect(prisma.employmentContract.create).toHaveBeenCalled();
    expect(prisma.contractHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'CREATED' }) }),
    );
  });

  it('rejects a second active contract for the employee and company', async () => {
    const { service } = createService({
      employmentContract: { findFirst: jest.fn().mockResolvedValue({ id: 'existing' }) },
    });
    await expect(service.create(baseInput)).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects a position from another company', async () => {
    const { service } = createService({
      position: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: 'position-1', companyId: 'other-company', status: 'ACTIVE' }),
      },
    });
    await expect(service.create(baseInput)).rejects.toBeInstanceOf(ConflictException);
  });
});

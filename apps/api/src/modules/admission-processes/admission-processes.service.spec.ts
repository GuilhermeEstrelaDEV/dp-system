import { ConflictException } from '@nestjs/common';
import { AdmissionProcessesService } from './admission-processes.service';

describe('AdmissionProcessesService', () => {
  const prisma = {
    employmentContract: { findUnique: jest.fn() },
    admissionProcess: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    checklistTemplate: { findUnique: jest.fn() },
    admissionStatusHistory: { create: jest.fn() },
    $transaction: jest.fn(),
  };
  const service = new AdmissionProcessesService(prisma as never);
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation((callback) => callback(prisma));
  });
  it('rejects a contract that does not belong to the employee', async () => {
    prisma.employmentContract.findUnique.mockResolvedValue({
      employeeId: 'other',
      companyId: 'company',
    });
    await expect(
      service.create({
        employeeId: 'employee',
        employmentContractId: 'contract',
        plannedAdmissionDate: '2026-01-01',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
  it('creates a process and records its initial status', async () => {
    prisma.employmentContract.findUnique.mockResolvedValue({
      id: 'contract',
      employeeId: 'employee',
      companyId: 'company',
    });
    prisma.admissionProcess.findFirst.mockResolvedValue(null);
    prisma.admissionProcess.create.mockResolvedValue({ id: 'process' });
    await service.create({
      employeeId: 'employee',
      employmentContractId: 'contract',
      plannedAdmissionDate: '2026-01-01',
    });
    expect(prisma.admissionStatusHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'DRAFT' }) }),
    );
  });
});

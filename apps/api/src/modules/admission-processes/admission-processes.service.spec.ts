import { NotFoundException } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { AdmissionProcessesService } from './admission-processes.service';

describe('AdmissionProcessesService', () => {
  const prisma = {
    employmentContract: { findFirst: jest.fn() },
    admissionProcess: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    checklistTemplate: { findFirst: jest.fn() },
    admissionStatusHistory: { create: jest.fn() },
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
    permissions: ['admission.read', 'admission.manage'],
    accessGrants: [],
  } satisfies AuthenticatedPrincipal;
  const service = new AdmissionProcessesService(
    prisma as never,
    audit as never,
    authorization as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('applies scoped search, status and planned-date filters to the bounded list', async () => {
    prisma.admissionProcess.findMany.mockResolvedValue([]);
    await service.list(
      {
        page: 1,
        pageSize: 20,
        search: 'Pessoa Demo',
        status: 'PENDING',
        plannedFrom: '2026-09-01',
        plannedTo: '2026-09-30',
      },
      principal,
    );
    expect(prisma.admissionProcess.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          companyId: 'company',
          status: 'PENDING',
          plannedAdmissionDate: {
            gte: new Date('2026-09-01'),
            lte: new Date('2026-09-30'),
          },
          OR: expect.arrayContaining([expect.objectContaining({ employee: expect.any(Object) })]),
        }),
      }),
    );
  });

  it('returns 404 for a contract outside the active company or employee relation', async () => {
    prisma.employmentContract.findFirst.mockResolvedValue(null);
    await expect(
      service.create(
        {
          employeeId: 'employee',
          employmentContractId: 'contract',
          plannedAdmissionDate: '2026-01-01',
        },
        principal,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates a process, initial history and atomic audit evidence', async () => {
    prisma.employmentContract.findFirst.mockResolvedValue({
      id: 'contract',
      employeeId: 'employee',
      companyId: 'company',
    });
    prisma.admissionProcess.findFirst.mockResolvedValue(null);
    prisma.admissionProcess.create.mockResolvedValue({ id: 'process', status: 'DRAFT' });
    await service.create(
      {
        employeeId: 'employee',
        employmentContractId: 'contract',
        plannedAdmissionDate: '2026-01-01',
      },
      principal,
    );
    expect(prisma.admissionStatusHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'DRAFT' }) }),
    );
    expect(audit.append).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'ADMISSION_PROCESS_CREATED' }),
      prisma,
    );
  });
});

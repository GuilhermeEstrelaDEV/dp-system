import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { EmployeesService } from './employees.service';

describe('EmployeesService profile expansion', () => {
  const employee = {
    id: 'employee-id',
    legalName: 'Pessoa Fictícia',
    preferredName: null,
    cpf: '52998224725',
    birthDate: new Date('1990-02-28T00:00:00.000Z'),
    maritalStatus: 'SINGLE',
    nationality: 'Brasil',
    placeOfBirth: 'Cidade Demonstrativa',
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const prisma = {
    employee: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    employeeContact: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    employeeAddress: { upsert: jest.fn() },
    employeeEmergencyContact: { upsert: jest.fn() },
    employmentContract: { findFirst: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    $transaction: jest.fn(),
  };
  const audit = {
    append: jest.fn(),
    transaction: jest.fn((work: (tx: typeof prisma) => unknown) => work(prisma)),
  };
  const authorization = { requireCapability: jest.fn() };
  const principal = {
    actorId: 'actor-id',
    activeCompanyId: 'company-id',
    sessionId: 'session-id',
    traceId: 'trace-id',
    ipAddress: '127.0.0.1',
    userAgent: null,
    permissions: ['employee.read', 'employee.manage'],
    accessGrants: [],
  } as AuthenticatedPrincipal;
  const service = new EmployeesService(prisma as never, audit as never, authorization as never);

  beforeEach(() => {
    jest.clearAllMocks();
    authorization.requireCapability.mockImplementation(() => undefined);
    prisma.employee.create.mockResolvedValue(employee);
    prisma.employee.findUniqueOrThrow.mockResolvedValue({
      ...employee,
      contacts: [],
      address: null,
      emergencyContact: null,
    });
    prisma.employeeContact.findFirst.mockResolvedValue(null);
    prisma.employeeContact.updateMany.mockResolvedValue({ count: 0 });
    prisma.employeeContact.create.mockResolvedValue({ id: 'contact-id' });
    prisma.employeeAddress.upsert.mockResolvedValue({ id: 'address-id' });
    prisma.employeeEmergencyContact.upsert.mockResolvedValue({ id: 'emergency-id' });
  });

  it('creates the complete profile while normalizing personal data', async () => {
    await service.create(
      {
        legalName: 'Pessoa Fictícia',
        cpf: '529.982.247-25',
        birthDate: '1990-02-28',
        maritalStatus: 'SINGLE',
        personalEmail: 'PESSOA@DP-SYSTEM.LOCAL',
        phone: '(11) 99999-0000',
        secondaryPhone: '(11) 98888-0000',
        address: { postalCode: '70000-001', state: 'df', country: 'Brasil' },
        emergencyContact: {
          name: 'Contato Fictício',
          relationship: 'Pessoa indicada',
          phone: '(11) 97777-0000',
        },
      },
      principal,
    );

    expect(prisma.employee.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          cpf: '52998224725',
          birthDate: new Date('1990-02-28T00:00:00.000Z'),
          maritalStatus: 'SINGLE',
        }),
      }),
    );
    expect(prisma.employeeContact.create).toHaveBeenCalledTimes(3);
    expect(prisma.employeeAddress.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: expect.objectContaining({ postalCode: '70000001' }) }),
    );
    expect(prisma.employeeEmergencyContact.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: expect.objectContaining({ phone: '11977770000' }) }),
    );
    const auditEnvelope = audit.append.mock.calls[0]?.[0];
    expect(JSON.stringify(auditEnvelope)).not.toContain('52998224725');
    expect(JSON.stringify(auditEnvelope)).not.toContain('70000001');
    expect(JSON.stringify(auditEnvelope)).not.toContain('11977770000');
  });

  it('updates profile relations inside the audited transaction', async () => {
    prisma.employee.findFirst.mockResolvedValue({
      ...employee,
      contacts: [],
      address: null,
      emergencyContact: null,
      employmentContracts: [],
    });
    prisma.employmentContract.findFirst.mockResolvedValue(null);
    prisma.employee.update.mockResolvedValue({ ...employee, maritalStatus: 'MARRIED' });

    await service.update(
      'employee-id',
      {
        legalName: 'Pessoa Atualizada',
        cpf: '52998224725',
        birthDate: '1990-02-28',
        maritalStatus: 'MARRIED',
        address: { city: 'Nova Cidade', state: 'SP' },
      },
      principal,
    );

    expect(prisma.employee.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'employee-id' },
        data: expect.objectContaining({ legalName: 'Pessoa Atualizada', maritalStatus: 'MARRIED' }),
      }),
    );
    expect(prisma.employeeAddress.upsert).toHaveBeenCalled();
    expect(audit.append).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'EMPLOYEE_UPDATED', entityId: 'employee-id' }),
      prisma,
    );
  });

  it.each([
    [{ legalName: 'Pessoa', cpf: '111.111.111-11' }, 'CPF inválido'],
    [{ legalName: 'Pessoa', birthDate: '2999-01-01' }, 'Data de nascimento'],
  ] as const)('rejects invalid profile input before persistence', async (dto, message) => {
    await expect(service.create(dto, principal)).rejects.toThrow(message);
    expect(prisma.employee.create).not.toHaveBeenCalled();
  });

  it('keeps personal data out of the employee list projection', async () => {
    prisma.employee.findMany.mockResolvedValue([]);
    prisma.employee.count.mockResolvedValue(0);
    prisma.$transaction.mockImplementation(async (operations: Array<Promise<unknown>>) =>
      Promise.all(operations),
    );

    await service.list(
      {
        page: 1,
        pageSize: 20,
        sortBy: 'legalName',
        sortDirection: 'asc',
      },
      principal,
    );

    const projection = prisma.employee.findMany.mock.calls[0]?.[0]?.select;
    expect(projection).not.toHaveProperty('cpf');
    expect(projection).not.toHaveProperty('birthDate');
    expect(projection).not.toHaveProperty('address');
  });

  it('returns 404 when the employee does not belong to the active company', async () => {
    prisma.employee.findFirst.mockResolvedValue(null);
    await expect(service.find('foreign-id', principal)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('preserves deny-by-default before any database access', async () => {
    authorization.requireCapability.mockImplementation(() => {
      throw new ForbiddenException();
    });
    await expect(
      service.create({ legalName: 'Pessoa Fictícia' }, principal),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.employee.create).not.toHaveBeenCalled();
  });

  it('rejects malformed direct service input even without the HTTP validation pipe', async () => {
    await expect(
      service.create(
        {
          legalName: 'Pessoa Fictícia',
          emergencyContact: {
            name: 'Contato',
            relationship: 'Indicado',
            phone: '123',
          },
        },
        principal,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

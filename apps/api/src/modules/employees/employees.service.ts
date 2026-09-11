import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditWriterService } from '../auth/audit-writer.service';
import { AuthorizationService } from '../auth/authorization.service';
import type { RecordStatus } from '../organizational/common.dto';
import {
  CreateEmployeeContactDto,
  CreateEmployeeDto,
  EmployeeListQueryDto,
  UpdateEmployeeContactDto,
  UpdateEmployeeDto,
  validateContactValue,
} from './employees.dto';
import {
  isValidCpf,
  isValidPhone,
  normalizeCpf,
  normalizePhone,
  normalizePostalCode,
  parseEmployeeBirthDate,
} from './employee-profile.validation';

const employeeListProjection = {
  id: true,
  legalName: true,
  preferredName: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.EmployeeSelect;

const employeeProfileProjection = {
  ...employeeListProjection,
  cpf: true,
  birthDate: true,
  maritalStatus: true,
  nationality: true,
  placeOfBirth: true,
} satisfies Prisma.EmployeeSelect;

const contactProjection = {
  id: true,
  employeeId: true,
  type: true,
  value: true,
  isPrimary: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.EmployeeContactSelect;

const contractProjection = {
  id: true,
  employeeId: true,
  companyId: true,
  branchId: true,
  departmentId: true,
  positionId: true,
  costCenterId: true,
  registrationNumber: true,
  contractType: true,
  employmentRegime: true,
  startDate: true,
  endDate: true,
  weeklyHours: true,
  status: true,
} satisfies Prisma.EmploymentContractSelect;

@Injectable()
export class EmployeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditWriterService,
    private readonly authorization: AuthorizationService,
  ) {}

  async list(query: EmployeeListQueryDto, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'employee.read');
    const companyId = principal.activeCompanyId!;
    const where: Prisma.EmployeeWhereInput = {
      status: query.status,
      employmentContracts: {
        some: {
          companyId,
          branchId: query.branchId,
          departmentId: query.departmentId,
          positionId: query.positionId,
          costCenterId: query.costCenterId,
        },
      },
      OR: query.search
        ? [
            { legalName: { contains: query.search, mode: 'insensitive' } },
            { preferredName: { contains: query.search, mode: 'insensitive' } },
          ]
        : undefined,
    };
    const [items, totalItems] = await this.prisma.$transaction([
      this.prisma.employee.findMany({
        where,
        select: employeeListProjection,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { [query.sortBy]: query.sortDirection },
      }),
      this.prisma.employee.count({ where }),
    ]);
    return {
      items,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / query.pageSize),
      },
    };
  }

  async find(id: string, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'employee.read');
    return this.findInCompany(id, principal.activeCompanyId!);
  }

  private async findInCompany(id: string, companyId: string) {
    const entity = await this.prisma.employee.findFirst({
      where: { id, employmentContracts: { some: { companyId } } },
      select: {
        ...employeeProfileProjection,
        contacts: { select: contactProjection, orderBy: { createdAt: 'asc' } },
        address: true,
        emergencyContact: true,
        employmentContracts: {
          where: { companyId },
          select: {
            ...contractProjection,
            company: { select: { id: true, tradeName: true } },
            branch: { select: { id: true, name: true } },
            department: { select: { id: true, name: true } },
            position: { select: { id: true, name: true } },
            costCenter: { select: { id: true, name: true } },
          },
          orderBy: { startDate: 'desc' },
        },
      },
    });
    if (!entity) throw new NotFoundException('Colaborador não encontrado');
    return entity;
  }

  async create(dto: CreateEmployeeDto, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'employee.manage');
    try {
      return await this.audit.transaction(async (tx) => {
        const employee = await tx.employee.create({
          data: { legalName: dto.legalName, ...this.employeeProfileData(dto) },
          select: employeeProfileProjection,
        });
        await this.syncProfileRelations(tx, employee.id, dto);
        await this.audit.append(
          {
            principal,
            action: 'EMPLOYEE_CREATED',
            entityType: 'Employee',
            entityId: employee.id,
            nextState: { status: employee.status },
          },
          tx,
        );
        return tx.employee.findUniqueOrThrow({
          where: { id: employee.id },
          select: {
            ...employeeProfileProjection,
            contacts: { select: contactProjection, orderBy: { createdAt: 'asc' } },
            address: true,
            emergencyContact: true,
          },
        });
      });
    } catch (error) {
      this.handleDuplicate(error);
    }
  }

  async update(id: string, dto: UpdateEmployeeDto, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'employee.manage');
    const current = await this.findInCompany(id, principal.activeCompanyId!);
    await this.assertExclusiveCompany(id, principal.activeCompanyId!);
    try {
      return await this.audit.transaction(async (tx) => {
        const employee = await tx.employee.update({
          where: { id },
          data: {
            ...(dto.legalName !== undefined ? { legalName: dto.legalName } : {}),
            ...this.employeeProfileData(dto),
          },
          select: employeeProfileProjection,
        });
        await this.syncProfileRelations(tx, id, dto);
        await this.audit.append(
          {
            principal,
            action: 'EMPLOYEE_UPDATED',
            entityType: 'Employee',
            entityId: id,
            previousState: { status: current.status },
            nextState: { status: employee.status },
          },
          tx,
        );
        return tx.employee.findUniqueOrThrow({
          where: { id },
          select: {
            ...employeeProfileProjection,
            contacts: { select: contactProjection, orderBy: { createdAt: 'asc' } },
            address: true,
            emergencyContact: true,
          },
        });
      });
    } catch (error) {
      this.handleDuplicate(error);
    }
  }

  async setStatus(id: string, status: RecordStatus, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'employee.manage');
    const employee = await this.findInCompany(id, principal.activeCompanyId!);
    await this.assertExclusiveCompany(id, principal.activeCompanyId!);
    if (status === 'INACTIVE') {
      const activeContracts = await this.prisma.employmentContract.count({
        where: { employeeId: id, status: 'ACTIVE' },
      });
      if (activeContracts) throw new ConflictException('Colaborador possui contrato ativo');
    }
    if (employee.status === status) return employee;
    return this.audit.transaction(async (tx) => {
      const updated = await tx.employee.update({
        where: { id },
        data: { status },
        select: employeeListProjection,
      });
      await this.audit.append(
        {
          principal,
          action: 'EMPLOYEE_STATUS_CHANGED',
          entityType: 'Employee',
          entityId: id,
          previousState: { status: employee.status },
          nextState: { status },
        },
        tx,
      );
      return updated;
    });
  }

  async listContacts(employeeId: string, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'employee.read');
    await this.findInCompany(employeeId, principal.activeCompanyId!);
    return this.prisma.employeeContact.findMany({
      where: { employeeId },
      select: contactProjection,
      orderBy: { createdAt: 'asc' },
    });
  }

  async listContracts(employeeId: string, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'employee.read');
    await this.findInCompany(employeeId, principal.activeCompanyId!);
    return this.prisma.employmentContract.findMany({
      where: { employeeId, companyId: principal.activeCompanyId! },
      select: {
        ...contractProjection,
        company: { select: { id: true, tradeName: true } },
        branch: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        position: { select: { id: true, name: true } },
        costCenter: { select: { id: true, name: true } },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async createContact(
    employeeId: string,
    dto: CreateEmployeeContactDto,
    principal: AuthenticatedPrincipal,
  ) {
    this.authorization.requireCapability(principal, 'employee.manage');
    await this.findInCompany(employeeId, principal.activeCompanyId!);
    await this.assertExclusiveCompany(employeeId, principal.activeCompanyId!);
    this.assertContact(dto.type, dto.value);
    try {
      return await this.audit.transaction(async (tx) => {
        if (dto.isPrimary)
          await tx.employeeContact.updateMany({
            where: { employeeId, type: dto.type, isPrimary: true },
            data: { isPrimary: false },
          });
        const contact = await tx.employeeContact.create({
          data: { ...dto, employeeId },
          select: contactProjection,
        });
        await this.auditEmployeeUpdate(employeeId, principal, tx);
        return contact;
      });
    } catch (error) {
      this.handleDuplicate(error);
    }
  }

  async updateContact(
    employeeId: string,
    contactId: string,
    dto: UpdateEmployeeContactDto,
    principal: AuthenticatedPrincipal,
  ) {
    this.authorization.requireCapability(principal, 'employee.manage');
    await this.findInCompany(employeeId, principal.activeCompanyId!);
    await this.assertExclusiveCompany(employeeId, principal.activeCompanyId!);
    const contact = await this.findContact(employeeId, contactId);
    const type = dto.type ?? contact.type;
    const value = dto.value ?? contact.value;
    this.assertContact(type as 'EMAIL' | 'PHONE', value);
    try {
      return await this.audit.transaction(async (tx) => {
        if (dto.isPrimary)
          await tx.employeeContact.updateMany({
            where: { employeeId, type, isPrimary: true, id: { not: contactId } },
            data: { isPrimary: false },
          });
        const updated = await tx.employeeContact.update({
          where: { id: contactId },
          data: dto,
          select: contactProjection,
        });
        await this.auditEmployeeUpdate(employeeId, principal, tx);
        return updated;
      });
    } catch (error) {
      this.handleDuplicate(error);
    }
  }

  async setContactStatus(
    employeeId: string,
    contactId: string,
    status: RecordStatus,
    principal: AuthenticatedPrincipal,
  ) {
    this.authorization.requireCapability(principal, 'employee.manage');
    await this.findInCompany(employeeId, principal.activeCompanyId!);
    await this.assertExclusiveCompany(employeeId, principal.activeCompanyId!);
    await this.findContact(employeeId, contactId);
    return this.audit.transaction(async (tx) => {
      const updated = await tx.employeeContact.update({
        where: { id: contactId },
        data: { status, isPrimary: status === 'INACTIVE' ? false : undefined },
        select: contactProjection,
      });
      await this.auditEmployeeUpdate(employeeId, principal, tx);
      return updated;
    });
  }

  private async assertExclusiveCompany(employeeId: string, companyId: string) {
    const foreignContract = await this.prisma.employmentContract.findFirst({
      where: { employeeId, companyId: { not: companyId } },
      select: { id: true },
    });
    if (foreignContract)
      throw new ConflictException(
        'Colaborador vinculado a outra empresa não pode ser alterado neste contexto',
      );
  }

  private async findContact(employeeId: string, contactId: string) {
    const contact = await this.prisma.employeeContact.findFirst({
      where: { id: contactId, employeeId },
      select: contactProjection,
    });
    if (!contact) throw new NotFoundException('Contato não encontrado');
    return contact;
  }

  private assertContact(type: 'EMAIL' | 'PHONE', value: string) {
    if (!validateContactValue(type, value))
      throw new BadRequestException('Contato inválido para o tipo informado');
  }

  private async auditEmployeeUpdate(
    employeeId: string,
    principal: AuthenticatedPrincipal,
    tx: Prisma.TransactionClient,
  ) {
    await this.audit.append(
      {
        principal,
        action: 'EMPLOYEE_UPDATED',
        entityType: 'Employee',
        entityId: employeeId,
      },
      tx,
    );
  }

  private employeeProfileData(dto: CreateEmployeeDto | UpdateEmployeeDto) {
    let birthDate: Date | undefined;
    if (dto.birthDate !== undefined) {
      const parsed = parseEmployeeBirthDate(dto.birthDate);
      if (!parsed) {
        throw new BadRequestException(
          'Data de nascimento deve ser uma data real, não futura e posterior a 1900-01-01',
        );
      }
      birthDate = parsed;
    }
    let cpf: string | undefined;
    if (dto.cpf !== undefined) {
      cpf = normalizeCpf(dto.cpf);
      if (!isValidCpf(cpf)) throw new BadRequestException('CPF inválido');
    }
    return {
      ...(dto.preferredName !== undefined ? { preferredName: dto.preferredName } : {}),
      ...(cpf !== undefined ? { cpf } : {}),
      ...(birthDate !== undefined ? { birthDate } : {}),
      ...(dto.maritalStatus !== undefined ? { maritalStatus: dto.maritalStatus } : {}),
      ...(dto.nationality !== undefined ? { nationality: dto.nationality } : {}),
      ...(dto.placeOfBirth !== undefined ? { placeOfBirth: dto.placeOfBirth } : {}),
    } satisfies Prisma.EmployeeUpdateInput;
  }

  private async syncProfileRelations(
    tx: Prisma.TransactionClient,
    employeeId: string,
    dto: CreateEmployeeDto | UpdateEmployeeDto,
  ) {
    if (dto.personalEmail !== undefined) {
      await this.upsertProfileContact(
        tx,
        employeeId,
        'EMAIL',
        dto.personalEmail.toLowerCase(),
        true,
      );
    }
    if (dto.phone !== undefined) {
      if (!isValidPhone(dto.phone)) throw new BadRequestException('Telefone principal inválido');
      await this.upsertProfileContact(tx, employeeId, 'PHONE', normalizePhone(dto.phone), true);
    }
    if (dto.secondaryPhone !== undefined) {
      if (!isValidPhone(dto.secondaryPhone))
        throw new BadRequestException('Telefone secundário inválido');
      await this.upsertProfileContact(
        tx,
        employeeId,
        'PHONE',
        normalizePhone(dto.secondaryPhone),
        false,
      );
    }
    if (dto.address !== undefined) {
      const address = {
        ...dto.address,
        ...(dto.address.postalCode !== undefined
          ? { postalCode: normalizePostalCode(dto.address.postalCode) }
          : {}),
        ...(dto.address.state !== undefined ? { state: dto.address.state.toUpperCase() } : {}),
      };
      await tx.employeeAddress.upsert({
        where: { employeeId },
        create: { ...address, employeeId },
        update: address,
      });
    }
    if (dto.emergencyContact !== undefined) {
      if (!isValidPhone(dto.emergencyContact.phone)) {
        throw new BadRequestException('Telefone do contato de emergência inválido');
      }
      const emergencyContact = {
        ...dto.emergencyContact,
        phone: normalizePhone(dto.emergencyContact.phone),
      };
      await tx.employeeEmergencyContact.upsert({
        where: { employeeId },
        create: { ...emergencyContact, employeeId },
        update: emergencyContact,
      });
    }
  }

  private async upsertProfileContact(
    tx: Prisma.TransactionClient,
    employeeId: string,
    type: 'EMAIL' | 'PHONE',
    value: string,
    isPrimary: boolean,
  ) {
    const contact = await tx.employeeContact.findFirst({
      where: { employeeId, type, isPrimary, status: 'ACTIVE' },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    if (isPrimary) {
      await tx.employeeContact.updateMany({
        where: {
          employeeId,
          type,
          isPrimary: true,
          ...(contact ? { id: { not: contact.id } } : {}),
        },
        data: { isPrimary: false },
      });
    }
    if (contact) {
      await tx.employeeContact.update({ where: { id: contact.id }, data: { value } });
      return;
    }
    await tx.employeeContact.create({ data: { employeeId, type, value, isPrimary } });
  }

  private handleDuplicate(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
      throw new ConflictException('Contato já cadastrado para este colaborador');
    throw error;
  }
}

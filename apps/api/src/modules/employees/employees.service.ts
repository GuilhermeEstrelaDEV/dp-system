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

const employeeProjection = {
  id: true,
  legalName: true,
  preferredName: true,
  status: true,
  createdAt: true,
  updatedAt: true,
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
        select: employeeProjection,
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
        ...employeeProjection,
        contacts: { select: contactProjection, orderBy: { createdAt: 'asc' } },
        employmentContracts: {
          where: { companyId },
          select: contractProjection,
          orderBy: { startDate: 'desc' },
        },
      },
    });
    if (!entity) throw new NotFoundException('Colaborador não encontrado');
    return entity;
  }

  async create(dto: CreateEmployeeDto, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'employee.manage');
    return this.audit.transaction(async (tx) => {
      const employee = await tx.employee.create({ data: dto, select: employeeProjection });
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
      return employee;
    });
  }

  async update(id: string, dto: UpdateEmployeeDto, principal: AuthenticatedPrincipal) {
    this.authorization.requireCapability(principal, 'employee.manage');
    const current = await this.findInCompany(id, principal.activeCompanyId!);
    await this.assertExclusiveCompany(id, principal.activeCompanyId!);
    return this.audit.transaction(async (tx) => {
      const employee = await tx.employee.update({
        where: { id },
        data: dto,
        select: employeeProjection,
      });
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
      return employee;
    });
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
        select: employeeProjection,
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

  private handleDuplicate(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
      throw new ConflictException('Contato já cadastrado para este colaborador');
    throw error;
  }
}

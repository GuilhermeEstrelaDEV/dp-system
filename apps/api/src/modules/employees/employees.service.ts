import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { RecordStatus } from '../organizational/common.dto';
import {
  CreateEmployeeContactDto,
  CreateEmployeeDto,
  EmployeeListQueryDto,
  UpdateEmployeeContactDto,
  UpdateEmployeeDto,
  validateContactValue,
} from './employees.dto';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: EmployeeListQueryDto) {
    const where: Prisma.EmployeeWhereInput = {
      status: query.status,
      employmentContracts:
        query.companyId ||
        query.branchId ||
        query.departmentId ||
        query.positionId ||
        query.costCenterId
          ? {
              some: {
                companyId: query.companyId,
                branchId: query.branchId,
                departmentId: query.departmentId,
                positionId: query.positionId,
                costCenterId: query.costCenterId,
              },
            }
          : undefined,
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

  async find(id: string) {
    const entity = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        contacts: { orderBy: { createdAt: 'asc' } },
        employmentContracts: { orderBy: { startDate: 'desc' } },
      },
    });
    if (!entity) throw new NotFoundException('Colaborador não encontrado');
    return entity;
  }

  create(dto: CreateEmployeeDto) {
    return this.prisma.employee.create({ data: dto });
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    await this.find(id);
    return this.prisma.employee.update({ where: { id }, data: dto });
  }

  async setStatus(id: string, status: RecordStatus) {
    const employee = await this.find(id);
    if (status === 'INACTIVE') {
      const activeContracts = await this.prisma.employmentContract.count({
        where: { employeeId: id, status: 'ACTIVE' },
      });
      if (activeContracts) throw new ConflictException('Colaborador possui contrato ativo');
    }
    if (employee.status === status) return employee;
    return this.prisma.employee.update({ where: { id }, data: { status } });
  }

  async listContacts(employeeId: string) {
    await this.find(employeeId);
    return this.prisma.employeeContact.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async listContracts(employeeId: string) {
    await this.find(employeeId);
    return this.prisma.employmentContract.findMany({
      where: { employeeId },
      include: { company: true, branch: true, department: true, position: true, costCenter: true },
      orderBy: { startDate: 'desc' },
    });
  }

  async createContact(employeeId: string, dto: CreateEmployeeContactDto) {
    await this.find(employeeId);
    this.assertContact(dto.type, dto.value);
    return this.prisma.$transaction(async (tx) => {
      if (dto.isPrimary)
        await tx.employeeContact.updateMany({
          where: { employeeId, type: dto.type, isPrimary: true },
          data: { isPrimary: false },
        });
      try {
        return await tx.employeeContact.create({ data: { ...dto, employeeId } });
      } catch (error) {
        this.handleDuplicate(error);
      }
    });
  }

  async updateContact(employeeId: string, contactId: string, dto: UpdateEmployeeContactDto) {
    const contact = await this.findContact(employeeId, contactId);
    const type = dto.type ?? contact.type;
    const value = dto.value ?? contact.value;
    this.assertContact(type as 'EMAIL' | 'PHONE', value);
    return this.prisma.$transaction(async (tx) => {
      if (dto.isPrimary)
        await tx.employeeContact.updateMany({
          where: { employeeId, type, isPrimary: true, id: { not: contactId } },
          data: { isPrimary: false },
        });
      try {
        return await tx.employeeContact.update({ where: { id: contactId }, data: dto });
      } catch (error) {
        this.handleDuplicate(error);
      }
    });
  }

  async setContactStatus(employeeId: string, contactId: string, status: RecordStatus) {
    await this.findContact(employeeId, contactId);
    return this.prisma.employeeContact.update({
      where: { id: contactId },
      data: { status, isPrimary: status === 'INACTIVE' ? false : undefined },
    });
  }

  private async findContact(employeeId: string, contactId: string) {
    const contact = await this.prisma.employeeContact.findFirst({
      where: { id: contactId, employeeId },
    });
    if (!contact) throw new NotFoundException('Contato não encontrado');
    return contact;
  }

  private assertContact(type: 'EMAIL' | 'PHONE', value: string) {
    if (!validateContactValue(type, value))
      throw new BadRequestException('Contato inválido para o tipo informado');
  }

  private handleDuplicate(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
      throw new ConflictException('Contato já cadastrado para este colaborador');
    throw error;
  }
}

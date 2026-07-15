import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CompanyScopedListQueryDto, type RecordStatus } from '../organizational/common.dto';
import { CreateDepartmentDto, UpdateDepartmentDto } from './departments.dto';
@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}
  async list(query: CompanyScopedListQueryDto) {
    const where: Prisma.DepartmentWhereInput = {
      companyId: query.companyId,
      status: query.status,
      OR: query.search
        ? [
            { name: { contains: query.search, mode: 'insensitive' } },
            { code: { contains: query.search, mode: 'insensitive' } },
          ]
        : undefined,
    };
    const [items, totalItems] = await this.prisma.$transaction([
      this.prisma.department.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { [query.sortBy]: query.sortDirection },
      }),
      this.prisma.department.count({ where }),
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
    const entity = await this.prisma.department.findUnique({ where: { id } });
    if (!entity) throw new NotFoundException('Departamento não encontrado');
    return entity;
  }
  async create(dto: CreateDepartmentDto) {
    await this.assertCompany(dto.companyId);
    if (dto.branchId) await this.assertBranch(dto.branchId, dto.companyId);
    try {
      return await this.prisma.department.create({ data: dto });
    } catch (error) {
      this.duplicate(error);
    }
  }
  async update(id: string, dto: UpdateDepartmentDto) {
    const entity = await this.find(id);
    if (dto.branchId) await this.assertBranch(dto.branchId, entity.companyId);
    try {
      return await this.prisma.department.update({ where: { id }, data: dto });
    } catch (error) {
      this.duplicate(error);
    }
  }
  async setStatus(id: string, status: RecordStatus) {
    await this.find(id);
    return this.prisma.department.update({ where: { id }, data: { status } });
  }
  private async assertCompany(id: string) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company || company.status !== 'ACTIVE')
      throw new ConflictException('Empresa inexistente ou inativa');
  }
  private async assertBranch(id: string, companyId: string) {
    const branch = await this.prisma.branch.findUnique({ where: { id } });
    if (!branch || branch.companyId !== companyId || branch.status !== 'ACTIVE')
      throw new ConflictException('Filial inexistente, inativa ou fora da empresa');
  }
  private duplicate(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
      throw new ConflictException('Código já utilizado nesta empresa');
    throw error;
  }
}

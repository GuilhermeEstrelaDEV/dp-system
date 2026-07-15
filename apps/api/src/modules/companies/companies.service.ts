import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CompanyListQueryDto, type RecordStatus } from '../organizational/common.dto';
import { CreateCompanyDto, UpdateCompanyDto } from './companies.dto';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}
  async list(query: CompanyListQueryDto) {
    const where: Prisma.CompanyWhereInput = {
      status: query.status,
      OR: query.search
        ? [
            { legalName: { contains: query.search, mode: 'insensitive' } },
            { tradeName: { contains: query.search, mode: 'insensitive' } },
          ]
        : undefined,
    };
    const [items, totalItems] = await this.prisma.$transaction([
      this.prisma.company.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { [query.sortBy]: query.sortDirection },
      }),
      this.prisma.company.count({ where }),
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
    const entity = await this.prisma.company.findUnique({ where: { id } });
    if (!entity) throw new NotFoundException('Empresa não encontrada');
    return entity;
  }
  async create(dto: CreateCompanyDto) {
    try {
      return await this.prisma.company.create({ data: dto });
    } catch (error) {
      this.handleDuplicate(error);
    }
  }
  async update(id: string, dto: UpdateCompanyDto) {
    await this.find(id);
    try {
      return await this.prisma.company.update({ where: { id }, data: dto });
    } catch (error) {
      this.handleDuplicate(error);
    }
  }
  async setStatus(id: string, status: RecordStatus) {
    const entity = await this.find(id);
    if (status === 'INACTIVE') {
      const activeDependencies = await this.prisma.$transaction([
        this.prisma.branch.count({ where: { companyId: id, status: 'ACTIVE' } }),
        this.prisma.department.count({ where: { companyId: id, status: 'ACTIVE' } }),
        this.prisma.position.count({ where: { companyId: id, status: 'ACTIVE' } }),
        this.prisma.costCenter.count({ where: { companyId: id, status: 'ACTIVE' } }),
      ]);
      if (activeDependencies.some(Boolean))
        throw new ConflictException('Empresa possui dependências ativas');
    }
    if (entity.status === status) return entity;
    return this.prisma.company.update({ where: { id }, data: { status } });
  }
  private handleDuplicate(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
      throw new ConflictException('Já existe uma empresa com estes dados');
    throw error;
  }
}

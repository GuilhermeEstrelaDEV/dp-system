import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CompanyScopedListQueryDto, type RecordStatus } from '../organizational/common.dto';
import { CreatePositionDto, UpdatePositionDto } from './positions.dto';
@Injectable()
export class PositionsService {
  constructor(private readonly prisma: PrismaService) {}
  async list(query: CompanyScopedListQueryDto) {
    const where: Prisma.PositionWhereInput = {
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
      this.prisma.position.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { [query.sortBy]: query.sortDirection },
      }),
      this.prisma.position.count({ where }),
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
    const entity = await this.prisma.position.findUnique({ where: { id } });
    if (!entity) throw new NotFoundException('Cargo não encontrado');
    return entity;
  }
  async create(dto: CreatePositionDto) {
    await this.assertCompany(dto.companyId);
    try {
      return await this.prisma.position.create({ data: dto });
    } catch (error) {
      this.duplicate(error);
    }
  }
  async update(id: string, dto: UpdatePositionDto) {
    await this.find(id);
    try {
      return await this.prisma.position.update({ where: { id }, data: dto });
    } catch (error) {
      this.duplicate(error);
    }
  }
  async setStatus(id: string, status: RecordStatus) {
    await this.find(id);
    return this.prisma.position.update({ where: { id }, data: { status } });
  }
  private async assertCompany(id: string) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company || company.status !== 'ACTIVE')
      throw new ConflictException('Empresa inexistente ou inativa');
  }
  private duplicate(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
      throw new ConflictException('Código já utilizado nesta empresa');
    throw error;
  }
}

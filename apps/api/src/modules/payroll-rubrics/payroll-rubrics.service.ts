import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreatePayrollRubricDto,
  PayrollRubricQueryDto,
  UpdatePayrollRubricDto,
} from './payroll-rubrics.dto';
@Injectable()
export class PayrollRubricsService {
  constructor(private readonly prisma: PrismaService) {}
  async list(q: PayrollRubricQueryDto) {
    const where: Prisma.PayrollRubricWhereInput = {
      companyId: q.companyId,
      status: q.status,
      OR: q.search
        ? [
            { code: { contains: q.search, mode: 'insensitive' } },
            { name: { contains: q.search, mode: 'insensitive' } },
          ]
        : undefined,
    };
    const [items, totalItems] = await this.prisma.$transaction([
      this.prisma.payrollRubric.findMany({
        where,
        include: { versions: { orderBy: { validFrom: 'desc' } }, payrollRubricCategory: true },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        orderBy: { [q.sortBy]: q.sortDirection },
      }),
      this.prisma.payrollRubric.count({ where }),
    ]);
    return {
      items,
      pagination: {
        page: q.page,
        pageSize: q.pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / q.pageSize),
      },
    };
  }
  async find(id: string) {
    const item = await this.prisma.payrollRubric.findUnique({
      where: { id },
      include: { versions: true, payrollRubricCategory: true },
    });
    if (!item) throw new NotFoundException('Rubrica não encontrada');
    return item;
  }
  async create(dto: CreatePayrollRubricDto) {
    if (dto.validTo && new Date(dto.validTo) < new Date(dto.validFrom))
      throw new ConflictException('Vigência inválida');
    const category = await this.prisma.payrollRubricCategory.findUnique({
      where: { id: dto.payrollRubricCategoryId },
    });
    if (!category || category.companyId !== dto.companyId)
      throw new ConflictException('Categoria inválida para a empresa');
    try {
      return await this.prisma.payrollRubric.create({
        data: {
          companyId: dto.companyId,
          payrollRubricCategoryId: dto.payrollRubricCategoryId,
          code: dto.code,
          name: dto.name,
          versions: {
            create: {
              version: dto.version,
              validFrom: new Date(dto.validFrom),
              validTo: dto.validTo ? new Date(dto.validTo) : null,
              calculationBase: dto.calculationBase,
              incidenceConfiguration: dto.incidenceConfiguration,
              configuration: dto.configuration,
            },
          },
        },
        include: { versions: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
        throw new ConflictException('Rubrica ou vigência já existe');
      throw error;
    }
  }
  async update(id: string, dto: UpdatePayrollRubricDto) {
    const rubric = await this.find(id);
    const used = await this.prisma.payrollCalculationItem.count({ where: { payrollRubricId: id } });
    if (used && dto.name && dto.name !== rubric.name)
      throw new ConflictException('Rubrica usada historicamente não pode ser renomeada');
    return this.prisma.payrollRubric.update({ where: { id }, data: dto });
  }
}

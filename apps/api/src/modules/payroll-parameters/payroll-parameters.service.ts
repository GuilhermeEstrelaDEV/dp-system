import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreatePayrollParameterDto,
  PayrollParameterQueryDto,
  UpdatePayrollParameterDto,
} from './payroll-parameters.dto';
@Injectable()
export class PayrollParametersService {
  constructor(private readonly prisma: PrismaService) {}
  async list(q: PayrollParameterQueryDto) {
    const where: Prisma.PayrollParameterWhereInput = {
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
      this.prisma.payrollParameter.findMany({
        where,
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        orderBy: { [q.sortBy]: q.sortDirection },
      }),
      this.prisma.payrollParameter.count({ where }),
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
    const item = await this.prisma.payrollParameter.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Parâmetro não encontrado');
    return item;
  }
  async create(dto: CreatePayrollParameterDto) {
    const validFrom = new Date(dto.validFrom);
    const validTo = dto.validTo ? new Date(dto.validTo) : null;
    if (validTo && validTo < validFrom) throw new ConflictException('Vigência inválida');
    const overlap = await this.prisma.payrollParameter.findFirst({
      where: {
        companyId: dto.companyId ?? null,
        code: dto.code,
        validFrom: { lte: validTo ?? new Date('9999-12-31') },
        OR: [{ validTo: null }, { validTo: { gte: validFrom } }],
      },
    });
    if (overlap) throw new ConflictException('Há vigência incompatível para este parâmetro');
    try {
      return await this.prisma.payrollParameter.create({ data: { ...dto, validFrom, validTo } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
        throw new ConflictException('Parâmetro duplicado');
      throw error;
    }
  }
  async update(id: string, dto: UpdatePayrollParameterDto) {
    const parameter = await this.find(id);
    const used = await this.prisma.payrollRun.count({
      where: { parameterVersion: parameter.version, payrollPeriod: { status: 'CLOSED' } },
    });
    if (used)
      throw new ConflictException('Parâmetro histórico usado em competência fechada é imutável');
    return this.prisma.payrollParameter.update({ where: { id }, data: dto });
  }
}

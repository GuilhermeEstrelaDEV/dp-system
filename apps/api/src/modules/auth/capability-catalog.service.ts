import { Injectable, NotFoundException } from '@nestjs/common';
import type { Permission } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CapabilityCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  listActive(): Promise<Permission[]> {
    return this.prisma.permission.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { code: 'asc' },
    });
  }

  async requireActive(code: string): Promise<Permission> {
    const capability = await this.prisma.permission.findFirst({
      where: { code, status: 'ACTIVE' },
    });
    if (!capability) throw new NotFoundException('Capability não encontrada');
    return capability;
  }
}

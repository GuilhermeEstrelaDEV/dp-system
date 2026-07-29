import { NotFoundException } from '@nestjs/common';
import type { Permission } from '@prisma/client';
import type { PrismaService as ApplicationPrismaService } from '../../prisma/prisma.service';
import { CapabilityCatalogService } from './capability-catalog.service';

describe('CapabilityCatalogService', () => {
  const findMany = jest.fn();
  const findFirst = jest.fn();
  const prisma = {
    permission: { findMany, findFirst },
  } as unknown as ApplicationPrismaService;
  const service = new CapabilityCatalogService(prisma);

  beforeEach(() => jest.clearAllMocks());

  it('lists only active capabilities in stable code order', async () => {
    findMany.mockResolvedValue([]);
    await expect(service.listActive()).resolves.toEqual([]);
    expect(findMany).toHaveBeenCalledWith({
      where: { status: 'ACTIVE' },
      orderBy: { code: 'asc' },
    });
  });

  it('fails closed when an active capability is absent', async () => {
    findFirst.mockResolvedValue(null);
    await expect(service.requireActive('unknown.code')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns the canonical active catalog record', async () => {
    const capability = { id: 'permission', code: 'platform.read' } as Permission;
    findFirst.mockResolvedValue(capability);
    await expect(service.requireActive('platform.read')).resolves.toBe(capability);
    expect(findFirst).toHaveBeenCalledWith({
      where: { code: 'platform.read', status: 'ACTIVE' },
    });
  });
});

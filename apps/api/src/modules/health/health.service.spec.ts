import { HealthService } from './health.service';
import type { PrismaService } from '../../prisma/prisma.service';

describe('HealthService', () => {
  it('does not query Prisma for liveness', () => {
    const prisma = { $queryRaw: jest.fn() } as unknown as PrismaService;
    new HealthService(prisma).liveness();
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });
  it('reports readiness states without exposing database errors', async () => {
    const service = new HealthService({
      $queryRaw: jest.fn().mockRejectedValue(new Error('secret')),
    } as unknown as PrismaService);
    await expect(service.readiness()).resolves.toMatchObject({
      status: 'error',
      database: 'unavailable',
    });
  });
});

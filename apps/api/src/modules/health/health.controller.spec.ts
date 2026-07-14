import { HealthController } from './health.controller';
import type { PrismaService } from '../../prisma/prisma.service';

describe('HealthController', () => {
  it('reports the technical services as available when the database query succeeds', async () => {
    const queryRaw = jest.fn().mockResolvedValue([{ result: 1 }]);
    const prisma = { $queryRaw: queryRaw } as unknown as PrismaService;
    const controller = new HealthController(prisma);

    await expect(controller.check()).resolves.toEqual({
      status: 'ok',
      database: 'connected',
    });
    expect(queryRaw).toHaveBeenCalledTimes(1);
  });
});

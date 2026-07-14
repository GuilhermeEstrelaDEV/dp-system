import { HealthController } from './health.controller';
import type { HealthService } from './health.service';

describe('HealthController', () => {
  it('reports the technical services as available when the database query succeeds', async () => {
    const healthService = {
      liveness: jest.fn().mockReturnValue({ status: 'ok', timestamp: '2026-01-01T00:00:00.000Z' }),
      readiness: jest.fn().mockResolvedValue({ status: 'ok', database: 'connected', latencyMs: 1 }),
    } as unknown as HealthService;
    const controller = new HealthController(healthService);

    await expect(controller.readiness()).resolves.toEqual({
      status: 'ok',
      database: 'connected',
      latencyMs: 1,
    });
  });
});

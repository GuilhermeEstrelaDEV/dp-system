import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  liveness() {
    return { status: 'ok' as const, timestamp: new Date().toISOString() };
  }

  async readiness() {
    const startedAt = performance.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok' as const,
        database: 'connected' as const,
        latencyMs: Math.round(performance.now() - startedAt),
      };
    } catch {
      return {
        status: 'error' as const,
        database: 'unavailable' as const,
        latencyMs: Math.round(performance.now() - startedAt),
      };
    }
  }
}

import { Controller, Get, Module } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { createApplication } from '../src/app.factory';
import { PrismaService } from '../src/prisma/prisma.service';

@Controller('technical-test')
class TechnicalTestController {
  @Get('rate-limited')
  rateLimited() {
    return { ok: true };
  }
  @Get('unexpected-error')
  unexpectedError() {
    throw new Error('internal diagnostic must not be returned');
  }
}

@Module({ imports: [AppModule], controllers: [TechnicalTestController] })
class TechnicalTestModule {}

describe('technical platform integration', () => {
  let moduleRef: TestingModule;
  let app: Awaited<ReturnType<typeof createApplication>>;
  const originalCorsOrigins = process.env.CORS_ORIGINS;
  const prisma = { $queryRaw: jest.fn().mockResolvedValue([{ result: 1 }]) };

  beforeAll(async () => {
    process.env.CORS_ORIGINS = 'http://allowed.test';
    moduleRef = await Test.createTestingModule({ imports: [TechnicalTestModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();
    app = await createApplication(async () => moduleRef.createNestApplication());
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
    process.env.CORS_ORIGINS = originalCorsOrigins;
  });

  it('serves versioned, correlated, secure and CORS-aware HTTP responses', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/health/live')
      .set('Origin', 'http://allowed.test')
      .set('x-correlation-id', 'valid-request-1')
      .expect(200);
    expect(response.headers['x-correlation-id']).toBe('valid-request-1');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['access-control-allow-origin']).toBe('http://allowed.test');
    expect(response.body).toMatchObject({
      data: { status: 'ok' },
      meta: { correlationId: 'valid-request-1', path: '/api/v1/health/live' },
    });
  });

  it('handles Swagger, health readiness, errors, limits and rate limiting without a database', async () => {
    await request(app.getHttpServer()).get('/api/docs').expect(200);
    await request(app.getHttpServer()).get('/api/docs-json').expect(200);
    await request(app.getHttpServer()).get('/api/v1/health/ready').expect(200);
    prisma.$queryRaw.mockRejectedValueOnce(new Error('database secret'));
    const unavailable = await request(app.getHttpServer()).get('/api/v1/health/ready').expect(503);
    expect(unavailable.body).toMatchObject({
      error: { message: 'Internal server error' },
      meta: { path: '/api/v1/health/ready' },
    });
    expect(JSON.stringify(unavailable.body)).not.toContain('database secret');
    const rejectedCors = await request(app.getHttpServer())
      .get('/api/v1/health/live')
      .set('Origin', 'http://blocked.test');
    expect(rejectedCors.headers['access-control-allow-origin']).toBeUndefined();
    await request(app.getHttpServer())
      .post('/api/v1/health/live')
      .set('content-type', 'application/json')
      .send({ payload: 'x'.repeat(2 * 1024 * 1024) })
      .expect(413);
    const error = await request(app.getHttpServer())
      .get('/api/v1/technical-test/unexpected-error')
      .expect(500);
    expect(JSON.stringify(error.body)).not.toContain('internal diagnostic');
    for (let index = 0; index < 10; index += 1)
      await request(app.getHttpServer()).get('/api/v1/technical-test/rate-limited').expect(200);
    await request(app.getHttpServer()).get('/api/v1/technical-test/rate-limited').expect(429);
    for (let index = 0; index < 12; index += 1)
      await request(app.getHttpServer()).get('/api/v1/health/live').expect(200);
  });
});

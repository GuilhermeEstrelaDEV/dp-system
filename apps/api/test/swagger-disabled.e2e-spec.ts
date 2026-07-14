import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import request from 'supertest';

describe('Swagger disabled integration', () => {
  let moduleRef: TestingModule;
  let app: INestApplication;

  beforeAll(async () => {
    jest.resetModules();
    process.env.SWAGGER_ENABLED = 'false';

    const [{ Test }, { AppModule }, { createApplication }, { PrismaService }] = await Promise.all([
      import('@nestjs/testing'),
      import('../src/app.module'),
      import('../src/app.factory'),
      import('../src/prisma/prisma.service'),
    ]);

    moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({ $queryRaw: jest.fn() })
      .compile();
    app = await createApplication(async () => moduleRef.createNestApplication());
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
    else if (moduleRef) await moduleRef.close();
  });

  it('does not expose Swagger UI or OpenAPI JSON', async () => {
    await request(app.getHttpServer()).get('/api/docs').expect(404);
    await request(app.getHttpServer()).get('/api/docs-json').expect(404);
  });
});

import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { createApplication } from '../src/app.factory';
import { PasswordHasherService } from '../src/modules/auth/password-hasher.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('authenticated company context integration', () => {
  let moduleRef: TestingModule;
  let app: Awaited<ReturnType<typeof createApplication>>;
  let passwordHash: string;
  let assignmentActive = true;

  const company = { id: '11111111-1111-4111-8111-111111111111', legalName: 'A', tradeName: 'A' };
  const prisma = {
    $queryRaw: jest.fn().mockResolvedValue([{ result: 1 }]),
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    userCompanyRole: { findMany: jest.fn() },
    auditLog: { create: jest.fn().mockResolvedValue({ id: 'audit-1' }) },
  };

  beforeAll(async () => {
    passwordHash = await new PasswordHasherService().hash('correct-password');
    prisma.user.findUnique.mockImplementation(({ where }: { where: { email: string } }) =>
      where.email === 'user@example.com' ? { id: 'user-1', status: 'ACTIVE', passwordHash } : null,
    );
    prisma.userCompanyRole.findMany.mockImplementation(() =>
      assignmentActive ? [{ company }] : [],
    );
    prisma.user.findFirst.mockImplementation(
      ({ where }: { where: { id: string }; select: unknown }) =>
        where.id === 'user-1'
          ? {
              roles: [],
              companyRoles: assignmentActive
                ? [
                    {
                      role: {
                        permissions: [{ permission: { code: 'payroll.view' } }],
                      },
                    },
                  ]
                : [],
            }
          : null,
    );
    moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();
    app = await createApplication(async () => moduleRef.createNestApplication());
    await app.init();
  });

  afterAll(async () => app.close());
  beforeEach(() => {
    assignmentActive = true;
    jest.clearAllMocks();
  });

  async function login(): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'user@example.com', password: 'correct-password' })
      .expect(201);
    return response.body.data.accessToken as string;
  }

  it('accepts valid login and rejects invalid credentials', async () => {
    await expect(login()).resolves.toEqual(expect.any(String));
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'user@example.com', password: 'wrong-password' })
      .expect(401);
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'unknown@example.com', password: 'correct-password' })
      .expect(401);
  });

  it('requires JWT on protected bootstrap routes', async () => {
    await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid')
      .expect(401);
  });

  it('selects an active linked company and propagates the typed context', async () => {
    const bootstrapToken = await login();
    const selection = await request(app.getHttpServer())
      .post('/api/v1/auth/context')
      .set('Authorization', `Bearer ${bootstrapToken}`)
      .set('x-correlation-id', 'trace-auth-1')
      .send({ companyId: company.id })
      .expect(201);
    const context = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${selection.body.data.accessToken}`)
      .set('x-correlation-id', 'trace-auth-2')
      .expect(200);
    expect(context.body.data).toMatchObject({
      actorId: 'user-1',
      activeCompanyId: company.id,
      permissions: ['payroll.view'],
      traceId: 'trace-auth-2',
    });
    expect(context.body.data.sessionId).toEqual(expect.any(String));
    expect(prisma.auditLog.create).toHaveBeenCalled();
  });

  it('returns 404 when the company assignment is absent or inactive', async () => {
    const bootstrapToken = await login();
    assignmentActive = false;
    await request(app.getHttpServer())
      .post('/api/v1/auth/context')
      .set('Authorization', `Bearer ${bootstrapToken}`)
      .send({ companyId: company.id })
      .expect(404);
  });

  it('keeps legacy routes outside the incremental protection rollout', async () => {
    await request(app.getHttpServer()).get('/api/v1/health/live').expect(200);
  });
});

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
  const sessions = new Map<
    string,
    { userId: string; status: 'ACTIVE' | 'REVOKED'; expiresAt: Date }
  >();

  const company = { id: '11111111-1111-4111-8111-111111111111', legalName: 'A', tradeName: 'A' };
  const prisma = {
    $queryRaw: jest.fn().mockResolvedValue([{ result: 1 }]),
    user: {
      findUnique: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    userCompanyRole: { findMany: jest.fn() },
    auditLog: { create: jest.fn().mockResolvedValue({ id: 'audit-1' }) },
  };

  beforeAll(async () => {
    passwordHash = await new PasswordHasherService().hash('correct-password');
    prisma.user.findUnique.mockImplementation(
      ({
        where,
        select,
      }: {
        where: { email?: string; id?: string };
        select?: { displayName?: boolean };
      }) => {
        if (where.email) {
          return where.email === 'user@example.com'
            ? { id: 'user-1', status: 'ACTIVE', passwordHash }
            : null;
        }
        if (where.id === 'user-1' && select?.displayName) {
          return {
            email: 'user@example.com',
            displayName: 'User Example',
            companyRoles: assignmentActive ? [{ role: { code: 'HR' } }] : [],
          };
        }
        return where.id === 'user-1'
          ? {
              status: 'ACTIVE',
              roles: [],
              companyRoles: assignmentActive
                ? [{ role: { permissions: [{ permission: { code: 'payroll.view' } }] } }]
                : [],
              substitutionsAsSubstitute: [],
              emergencyAccesses: [],
            }
          : null;
      },
    );
    prisma.userCompanyRole.findMany.mockImplementation(() =>
      assignmentActive ? [{ company }] : [],
    );
    prisma.refreshToken.create.mockImplementation(
      ({ data }: { data: { tokenHash: string; userId: string; expiresAt: Date } }) => {
        sessions.set(data.tokenHash, {
          userId: data.userId,
          status: 'ACTIVE',
          expiresAt: data.expiresAt,
        });
        return { id: 'session-record', ...data };
      },
    );
    prisma.refreshToken.findUnique.mockImplementation(
      ({ where }: { where: { tokenHash: string } }) => {
        const session = sessions.get(where.tokenHash);
        return session ? { ...session, revokedAt: null } : null;
      },
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
    sessions.clear();
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
      .set('user-agent', 'dp-system-test-agent')
      .expect(200);
    expect(context.body.data).toMatchObject({
      actorId: 'user-1',
      activeCompanyId: company.id,
      permissions: ['payroll.view'],
      traceId: 'trace-auth-2',
      userAgent: 'dp-system-test-agent',
    });
    expect(context.body.data.ipAddress).toEqual(expect.any(String));
    expect(context.body.data.sessionId).toEqual(expect.any(String));
    expect(prisma.auditLog.create).toHaveBeenCalled();
  });

  it('returns 403 when the company assignment is absent or inactive', async () => {
    const bootstrapToken = await login();
    assignmentActive = false;
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/context')
      .set('Authorization', `Bearer ${bootstrapToken}`)
      .send({ companyId: company.id })
      .expect(403);
    expect(response.body.error).toEqual({
      code: 'COMPANY_SELECTION_FORBIDDEN',
      message: 'Empresa não disponível para a identidade autenticada',
    });
  });

  it('rejects missing and malformed company selections before persistence resolution', async () => {
    const bootstrapToken = await login();
    await request(app.getHttpServer())
      .post('/api/v1/auth/context')
      .set('Authorization', `Bearer ${bootstrapToken}`)
      .send({})
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/v1/auth/context')
      .set('Authorization', `Bearer ${bootstrapToken}`)
      .send({ companyId: 'invalid' })
      .expect(400);
  });

  it('keeps legacy routes outside the incremental protection rollout', async () => {
    await request(app.getHttpServer()).get('/api/v1/health/live').expect(200);
  });

  it('denies new administrative routes when capability is absent', async () => {
    const bootstrapToken = await login();
    const selection = await request(app.getHttpServer())
      .post('/api/v1/auth/context')
      .set('Authorization', `Bearer ${bootstrapToken}`)
      .send({ companyId: company.id })
      .expect(201);
    await request(app.getHttpServer())
      .get('/api/v1/access-grants/substitutions')
      .set('Authorization', `Bearer ${selection.body.data.accessToken}`)
      .expect(403);
  });
});

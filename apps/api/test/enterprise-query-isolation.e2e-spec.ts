import { Module, UnauthorizedException, type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { createApplication } from '../src/app.factory';
import type { RequestWithContext } from '../src/common/http/request-context';
import { AccessGrantsRepository } from '../src/modules/auth/access-grants.repository';
import { ActiveCompanyGuard } from '../src/modules/auth/active-company.guard';
import { createActiveCompanyContext } from '../src/modules/auth/active-company-context';
import { AuditWriterService } from '../src/modules/auth/audit-writer.service';
import { CapabilityCatalogService } from '../src/modules/auth/capability-catalog.service';
import { EnterpriseScopeFactory } from '../src/modules/auth/enterprise-scope';
import { JwtAuthGuard } from '../src/modules/auth/jwt-auth.guard';
import { PrismaService } from '../src/prisma/prisma.service';

@Module({ imports: [AppModule] })
class EnterpriseIsolationProofModule {}

describe('ETP-015.5 enterprise query isolation API', () => {
  let moduleRef: TestingModule;
  let app: INestApplication;
  const companyA = '11111111-1111-4111-8111-111111111111';
  const grantA = '22222222-2222-4222-8222-222222222222';
  const grantB = '33333333-3333-4333-8333-333333333333';
  const repository = {
    findActiveSubstitution: jest.fn((scope: { companyId: string }, id: string) =>
      id === grantA && scope.companyId === companyA
        ? Promise.resolve({ id, companyId: companyA, status: 'ACTIVE' })
        : Promise.resolve(null),
    ),
    revokeSubstitution: jest.fn((scope: { companyId: string }, id: string) =>
      Promise.resolve({ id, companyId: scope.companyId, status: 'REVOKED' }),
    ),
  };

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({ imports: [EnterpriseIsolationProofModule] })
      .overrideProvider(PrismaService)
      .useValue({ $queryRaw: jest.fn().mockResolvedValue([{ result: 1 }]) })
      .overrideProvider(JwtAuthGuard)
      .useValue({
        canActivate: (context: { switchToHttp(): { getRequest(): RequestWithContext } }) => {
          const target = context.switchToHttp().getRequest();
          if (target.header('authorization') !== 'Bearer valid') {
            throw new UnauthorizedException('Token inválido');
          }
          target.principal = {
            actorId: '44444444-4444-4444-8444-444444444444',
            activeCompanyId: companyA,
            sessionId: 'session-a',
            permissions: target.header('x-test-capabilities')?.split(',').filter(Boolean) ?? [],
            traceId: target.correlationId ?? 'test-trace',
            ipAddress: '127.0.0.1',
            userAgent: 'test',
            accessGrants: [],
          };
          return true;
        },
      })
      .overrideProvider(ActiveCompanyGuard)
      .useValue({
        canActivate: (context: { switchToHttp(): { getRequest(): RequestWithContext } }) => {
          const target = context.switchToHttp().getRequest();
          const principal = target.principal!;
          target.activeCompanyContext = createActiveCompanyContext({
            userId: principal.actorId,
            companyId: principal.activeCompanyId!,
            assignmentIds: ['assignment-a'],
            selectionSource: 'SESSION_TOKEN',
            resolvedAt: '2026-08-03T00:00:00.000Z',
          });
          target.enterpriseScope = new EnterpriseScopeFactory().create(
            target.activeCompanyContext,
            principal,
          );
          return true;
        },
      })
      .overrideProvider(CapabilityCatalogService)
      .useValue({
        requireActive: (code: string) =>
          Promise.resolve({ code, scope: 'COMPANY', status: 'ACTIVE' }),
      })
      .overrideProvider(AccessGrantsRepository)
      .useValue(repository)
      .overrideProvider(AuditWriterService)
      .useValue({
        transaction: (work: (client: object) => Promise<unknown>) => work({}),
        append: jest.fn().mockResolvedValue({ id: 'audit' }),
      })
      .compile();
    app = await createApplication(async () => moduleRef.createNestApplication());
    await app.init();
  });

  afterAll(async () => app.close());
  beforeEach(() => jest.clearAllMocks());

  const revoke = (id: string, capabilities = 'delegation.manage') =>
    request(app.getHttpServer())
      .post(`/api/v1/access-grants/substitutions/${id}/revoke`)
      .set('authorization', 'Bearer valid')
      .set('x-test-capabilities', capabilities)
      .send({ reason: 'ETP-015.5 isolation proof' });

  it('preserves 401 and 403 before any repository lookup', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/access-grants/substitutions/${grantA}/revoke`)
      .send({ reason: 'ETP-015.5 isolation proof' })
      .expect(401);
    await revoke(grantA, '').expect(403);
    expect(repository.findActiveSubstitution).not.toHaveBeenCalled();
  });

  it('returns an indistinguishable 404 for another company and an unknown ID', async () => {
    const external = await revoke(grantB).expect(404);
    const missing = await revoke('55555555-5555-4555-8555-555555555555').expect(404);
    expect(external.body.error).toEqual(missing.body.error);
    expect(external.body.error.message).toBe('Concessão não encontrada');
    expect(repository.revokeSubstitution).not.toHaveBeenCalled();
  });

  it('updates a resource only inside the active enterprise scope', async () => {
    const response = await revoke(grantA).expect(201);
    expect(response.body.data).toMatchObject({
      id: grantA,
      companyId: companyA,
      status: 'REVOKED',
    });
    expect(repository.findActiveSubstitution).toHaveBeenCalledWith(
      expect.objectContaining({ companyId: companyA }),
      grantA,
      expect.anything(),
    );
  });
});

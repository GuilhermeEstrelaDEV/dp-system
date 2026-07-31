import {
  Controller,
  ForbiddenException,
  Get,
  Module,
  UnauthorizedException,
  type INestApplication,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import type { RequestWithContext } from '../src/common/http/request-context';
import { ActiveCompanyGuard } from '../src/modules/auth/active-company.guard';
import { CapabilityCatalogService } from '../src/modules/auth/capability-catalog.service';
import { JwtAuthGuard } from '../src/modules/auth/jwt-auth.guard';
import { AuthenticatedRoute, RequireCapabilities } from '../src/modules/auth/route-access-policy';
import { PrismaService } from '../src/prisma/prisma.service';
import { createApplication } from '../src/app.factory';

let unclassifiedExecutions = 0;

@Controller('authorization-proof')
class AuthorizationProofController {
  @Get('authenticated')
  @AuthenticatedRoute()
  authenticated() {
    return { allowed: true };
  }

  @Get('capability')
  @RequireCapabilities('payroll.review.view')
  capability() {
    return { allowed: true };
  }

  @Get('unclassified')
  unclassified() {
    unclassifiedExecutions += 1;
    return { allowed: true };
  }
}

@Module({ imports: [AppModule], controllers: [AuthorizationProofController] })
class AuthorizationProofModule {}

describe('ETP-015.4 authorization foundation E2E', () => {
  let moduleRef: TestingModule;
  let app: INestApplication;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({ imports: [AuthorizationProofModule] })
      .overrideProvider(PrismaService)
      .useValue({ $queryRaw: jest.fn().mockResolvedValue([{ result: 1 }]) })
      .overrideProvider(JwtAuthGuard)
      .useValue({
        canActivate: (context: { switchToHttp(): { getRequest(): RequestWithContext } }) => {
          const target = context.switchToHttp().getRequest();
          const authorization = target.header('authorization');
          if (!authorization) throw new UnauthorizedException('Token ausente');
          if (authorization !== 'Bearer valid') throw new UnauthorizedException('Token inválido');
          const capabilities =
            target.header('x-test-capabilities')?.split(',').filter(Boolean) ?? [];
          target.principal = {
            actorId: '11111111-1111-4111-8111-111111111111',
            activeCompanyId: '22222222-2222-4222-8222-222222222222',
            sessionId: '33333333-3333-4333-8333-333333333333',
            permissions: capabilities,
            traceId: target.correlationId ?? 'test-trace',
            ipAddress: '127.0.0.1',
            userAgent: 'test',
            accessGrants: [],
          };
          return true;
        },
      })
      .overrideProvider(ActiveCompanyGuard)
      .useValue({ canActivate: () => true })
      .overrideProvider(CapabilityCatalogService)
      .useValue({
        requireActive: (code: string) => {
          if (code !== 'payroll.review.view') throw new ForbiddenException();
          return Promise.resolve({ code, scope: 'COMPANY', status: 'ACTIVE' });
        },
      })
      .compile();
    app = await createApplication(async () => moduleRef.createNestApplication());
    await app.init();
  });

  afterAll(async () => app.close());

  it('keeps the explicit public allowlist reachable without a token', async () => {
    await request(app.getHttpServer()).get('/api/v1/health/live').expect(200);
  });

  it('standardizes missing and invalid identity as 401', async () => {
    await request(app.getHttpServer()).get('/api/v1/authorization-proof/authenticated').expect(401);
    await request(app.getHttpServer())
      .get('/api/v1/authorization-proof/authenticated')
      .set('authorization', 'Bearer invalid')
      .expect(401);
  });

  it('returns 403 without the required capability and succeeds with an explicit test grant', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/authorization-proof/capability')
      .set('authorization', 'Bearer valid')
      .expect(403);
    await request(app.getHttpServer())
      .get('/api/v1/authorization-proof/capability')
      .set('authorization', 'Bearer valid')
      .set('x-test-capabilities', 'payroll.review.view')
      .expect(200);
  });

  it('blocks an unclassified route without executing its handler', async () => {
    await request(app.getHttpServer()).get('/api/v1/authorization-proof/unclassified').expect(403);
    expect(unclassifiedExecutions).toBe(0);
  });
});

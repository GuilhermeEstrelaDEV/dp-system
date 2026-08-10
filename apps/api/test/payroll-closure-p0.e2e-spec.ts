import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
  type INestApplication,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { createApplication } from '../src/app.factory';
import type { RequestWithContext } from '../src/common/http/request-context';
import { ActiveCompanyGuard } from '../src/modules/auth/active-company.guard';
import { CapabilityCatalogService } from '../src/modules/auth/capability-catalog.service';
import { JwtAuthGuard } from '../src/modules/auth/jwt-auth.guard';
import { PayrollPeriodControlledReopeningService } from '../src/modules/payroll-periods/payroll-period-controlled-reopening.service';
import { PayrollPeriodHistoryService } from '../src/modules/payroll-periods/payroll-period-history.service';
import { PayrollPeriodOperationalClosureService } from '../src/modules/payroll-periods/payroll-period-operational-closure.service';
import { PrismaService } from '../src/prisma/prisma.service';

const companyId = '22222222-2222-4222-8222-222222222222';
const periodId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const foreignId = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
const closureId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const payrollRunId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const now = '2026-08-10T12:00:00.000Z';
const version = {
  id: closureId,
  version: 1,
  status: 'CLOSED',
  isActive: true,
  openedAt: now,
  closedAt: now,
  reopenedAt: null,
  supersededAt: null,
  payrollRun: { id: payrollRunId, sequence: 1, status: 'COMPLETED' },
  review: null,
  predecessor: null,
  successor: null,
  manifest: null,
  events: [],
};
const history = {
  list: jest.fn(async (id: string) => {
    if (id === foreignId) throw new NotFoundException();
    return { payrollPeriodId: id, versions: [version] };
  }),
  findByClosureId: jest.fn(async (id: string) => {
    if (id === foreignId) throw new NotFoundException();
    return version;
  }),
};
const operationalClosure = {
  close: jest.fn(async (id: string) => {
    if (id === foreignId) throw new NotFoundException();
    return {
      payrollPeriodId: id,
      closureId,
      closureVersion: 1,
      status: 'CLOSED',
      payrollRunId,
      reviewCycleId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      reviewRound: 1,
      manifestId: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
      manifestHash: 'hash',
      hashAlgorithmVersion: 'sha256-canonical-json-v1',
      warningsAcknowledged: [],
      closedAt: now,
      consistencyToken: now,
      idempotentReplay: false,
    };
  }),
};
const controlledReopening = {
  reopen: jest.fn(async (id: string) => {
    if (id === foreignId) throw new NotFoundException();
    return {
      payrollPeriodId: id,
      previousClosureId: closureId,
      invalidationId: '11111111-1111-4111-8111-111111111111',
      invalidatedDecisionIds: [],
      invalidatedApprovalCount: 0,
      reviewCycleId: null,
      reopenedClosureId: '12121212-1212-4121-8121-121212121212',
      closureVersion: 2,
      status: 'OPEN',
      reopenedAt: now,
      consistencyToken: now,
      idempotentReplay: false,
    };
  }),
};

describe('ETP-015.8 payroll closure P0 compatibility adapters E2E', () => {
  let moduleRef: TestingModule;
  let app: INestApplication;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({ $queryRaw: jest.fn().mockResolvedValue([{ result: 1 }]) })
      .overrideProvider(JwtAuthGuard)
      .useValue({
        canActivate: (context: { switchToHttp(): { getRequest(): RequestWithContext } }) => {
          const target = context.switchToHttp().getRequest();
          const authorization = target.header('authorization');
          if (!authorization) throw new UnauthorizedException('Token ausente');
          if (authorization !== 'Bearer valid') throw new UnauthorizedException('Token inválido');
          target.principal = {
            actorId: '11111111-1111-4111-8111-111111111111',
            activeCompanyId: companyId,
            sessionId: '33333333-3333-4333-8333-333333333333',
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
      .useValue({ canActivate: () => true })
      .overrideProvider(CapabilityCatalogService)
      .useValue({
        requireActive: (code: string) => {
          if (!code.startsWith('payroll.period.close.')) throw new ForbiddenException();
          return Promise.resolve({ code, scope: 'COMPANY', status: 'ACTIVE' });
        },
      })
      .overrideProvider(PayrollPeriodHistoryService)
      .useValue(history)
      .overrideProvider(PayrollPeriodOperationalClosureService)
      .useValue(operationalClosure)
      .overrideProvider(PayrollPeriodControlledReopeningService)
      .useValue(controlledReopening)
      .compile();
    app = await createApplication(async () => moduleRef.createNestApplication());
    await app.init();
  });

  afterAll(async () => app.close());

  const cases = [
    {
      name: 'list',
      capability: 'payroll.period.close.history',
      request: (id = periodId) =>
        request(app.getHttpServer()).get(`/api/v1/payroll-closures?payrollPeriodId=${id}`),
    },
    {
      name: 'detail',
      capability: 'payroll.period.close.history',
      request: (id = closureId) =>
        request(app.getHttpServer()).get(`/api/v1/payroll-closures/${id}`),
    },
    {
      name: 'close',
      capability: 'payroll.period.close.execute',
      request: (id = periodId) =>
        request(app.getHttpServer())
          .post('/api/v1/payroll-closures')
          .set('Idempotency-Key', 'close-intent-12345678')
          .send({
            payrollPeriodId: id,
            payrollRunId,
            expectedConsistencyToken: now,
            warningAcknowledgements: [],
            expectedClosureVersion: 0,
          }),
    },
    {
      name: 'reopen',
      capability: 'payroll.period.close.reopen',
      request: (id = periodId) =>
        request(app.getHttpServer())
          .post(`/api/v1/payroll-closures/${id}/reopen`)
          .set('Idempotency-Key', 'reopen-intent-12345678')
          .send({
            reason: 'Correção operacional',
            expectedConsistencyToken: now,
            expectedClosureVersion: 1,
          }),
    },
  ] as const;

  it.each(cases)(
    '$name returns 401 without identity and 403 without capability',
    async ({ request: makeRequest }) => {
      await makeRequest().expect(401);
      await makeRequest().set('authorization', 'Bearer valid').expect(403);
    },
  );

  it.each(cases)(
    '$name succeeds with the exact capability and exposes deprecation',
    async ({ request: makeRequest, capability }) => {
      const response = await makeRequest()
        .set('authorization', 'Bearer valid')
        .set('x-test-capabilities', capability)
        .expect(({ status }) => expect([200, 201]).toContain(status));
      expect(response.headers.deprecation).toBe('true');
    },
  );

  it.each(cases)(
    '$name returns 404 for a resource outside the active company',
    async ({ request: makeRequest, capability }) => {
      await makeRequest(foreignId)
        .set('authorization', 'Bearer valid')
        .set('x-test-capabilities', capability)
        .expect(404);
    },
  );

  it('fails closed on an incomplete closure contract and returns MINIMAL history', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/payroll-closures')
      .set('authorization', 'Bearer valid')
      .set('x-test-capabilities', 'payroll.period.close.execute')
      .set('Idempotency-Key', 'invalid-intent-12345678')
      .send({ payrollPeriodId: periodId })
      .expect(400);
    const response = await request(app.getHttpServer())
      .get(`/api/v1/payroll-closures?payrollPeriodId=${periodId}`)
      .set('authorization', 'Bearer valid')
      .set('x-test-capabilities', 'payroll.period.close.history')
      .expect(200);
    expect(response.body.data.items[0]).not.toHaveProperty('actorId');
    expect(response.body.data.items[0]).not.toHaveProperty('reason');
  });

  it('preserves canonical 409/422 errors and the 200 replay status', async () => {
    operationalClosure.close.mockRejectedValueOnce(new ConflictException('stale token'));
    await cases[2]
      .request()
      .set('authorization', 'Bearer valid')
      .set('x-test-capabilities', cases[2].capability)
      .expect(409);

    operationalClosure.close.mockRejectedValueOnce(
      new UnprocessableEntityException('warning acknowledgement required'),
    );
    await cases[2]
      .request()
      .set('authorization', 'Bearer valid')
      .set('x-test-capabilities', cases[2].capability)
      .expect(422);

    operationalClosure.close.mockResolvedValueOnce({
      ...(await operationalClosure.close(periodId)),
      idempotentReplay: true,
    });
    await cases[2]
      .request()
      .set('authorization', 'Bearer valid')
      .set('x-test-capabilities', cases[2].capability)
      .expect(200);

    controlledReopening.reopen.mockRejectedValueOnce(new ConflictException('version conflict'));
    await cases[3]
      .request()
      .set('authorization', 'Bearer valid')
      .set('x-test-capabilities', cases[3].capability)
      .expect(409);
  });
});

import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { CapabilitiesGuard } from '../auth/capabilities.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ROUTE_ACCESS_POLICY, type RouteAccessPolicy } from '../auth/route-access-policy';
import { PayrollPeriodReadinessService } from './payroll-period-readiness.service';
import { PayrollPeriodOperationalClosureService } from './payroll-period-operational-closure.service';
import { PayrollPeriodControlledReopeningService } from './payroll-period-controlled-reopening.service';
import { PayrollPeriodHistoryService } from './payroll-period-history.service';
import { PayrollPeriodsController } from './payroll-periods.controller';
import { PayrollPeriodsService } from './payroll-periods.service';

describe('PayrollPeriodsController readiness contract', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PayrollPeriodsController],
      providers: [
        { provide: PayrollPeriodsService, useValue: {} },
        { provide: PayrollPeriodReadinessService, useValue: { evaluate: jest.fn() } },
        { provide: PayrollPeriodOperationalClosureService, useValue: { close: jest.fn() } },
        { provide: PayrollPeriodControlledReopeningService, useValue: { reopen: jest.fn() } },
        {
          provide: PayrollPeriodHistoryService,
          useValue: { list: jest.fn(), find: jest.fn(), events: jest.fn(), manifest: jest.fn() },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(CapabilitiesGuard)
      .useValue({ canActivate: () => true })
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => app.close());

  it('declares the canonical capability and OpenAPI GET operation', () => {
    expect(
      Reflect.getMetadata(
        ROUTE_ACCESS_POLICY,
        PayrollPeriodsController.prototype.readiness,
      ) as RouteAccessPolicy,
    ).toMatchObject({ requiredCapabilities: ['payroll.period.close.readiness'] });

    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('test').build(),
    );
    const operation = document.paths['/payroll-periods/{payrollPeriodId}/closure-readiness']?.get;
    expect(operation).toBeDefined();
    expect(operation?.responses['200']).toBeDefined();
    expect(operation?.responses['401']).toBeDefined();
    expect(operation?.responses['403']).toBeDefined();
    expect(operation?.security).toEqual(
      expect.arrayContaining([expect.objectContaining({ bearer: [] })]),
    );
    expect((operation as unknown as Record<string, unknown>)['x-access-classification']).toBe(
      'CAPABILITY_PROTECTED',
    );
    expect((operation as unknown as Record<string, unknown>)['x-active-company-required']).toBe(
      true,
    );
    expect((operation as unknown as Record<string, unknown>)['x-required-capabilities']).toBe(
      'payroll.period.close.readiness',
    );
    expect(operation?.parameters).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'payrollRunId', in: 'query' })]),
    );
  });

  it('declares the authenticated operational close contract', () => {
    expect(
      Reflect.getMetadata(
        ROUTE_ACCESS_POLICY,
        PayrollPeriodsController.prototype.close,
      ) as RouteAccessPolicy,
    ).toMatchObject({ requiredCapabilities: ['payroll.period.close.execute'] });

    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('test').build(),
    );
    const operation = document.paths['/payroll-periods/{payrollPeriodId}/close']?.post;
    expect(operation).toBeDefined();
    expect(operation?.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Idempotency-Key', in: 'header', required: true }),
      ]),
    );
    expect(operation?.responses['201']).toBeDefined();
    expect(operation?.responses['409']).toBeDefined();
    expect(operation?.responses['422']).toBeDefined();
  });

  it('declares one authenticated canonical reopen operation', () => {
    expect(
      Reflect.getMetadata(ROUTE_ACCESS_POLICY, PayrollPeriodsController.prototype.reopen),
    ).toMatchObject({ requiredCapabilities: ['payroll.period.close.reopen'] });
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('test').build(),
    );
    const paths = Object.keys(document.paths).filter((path) => path.endsWith('/reopen'));
    expect(paths).toEqual(['/payroll-periods/{payrollPeriodId}/reopen']);
    const operation = document.paths[paths[0]!]?.post;
    expect(operation?.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Idempotency-Key', in: 'header', required: true }),
      ]),
    );
    expect(operation?.responses['201']).toBeDefined();
    expect(operation?.responses['409']).toBeDefined();
  });

  it('documents four history operations under the history capability', () => {
    for (const handler of [
      'history',
      'historyVersion',
      'historyEvents',
      'historyManifest',
    ] as const) {
      expect(
        Reflect.getMetadata(ROUTE_ACCESS_POLICY, PayrollPeriodsController.prototype[handler]),
      ).toMatchObject({ requiredCapabilities: ['payroll.period.close.history'] });
    }
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('test').build(),
    );
    expect(document.paths['/payroll-periods/{payrollPeriodId}/history']?.get).toBeDefined();
    expect(
      document.paths['/payroll-periods/{payrollPeriodId}/history/{closureVersion}']?.get,
    ).toBeDefined();
    expect(
      document.paths['/payroll-periods/{payrollPeriodId}/history/{closureVersion}/events']?.get,
    ).toBeDefined();
    expect(
      document.paths['/payroll-periods/{payrollPeriodId}/history/{closureVersion}/manifest']?.get,
    ).toBeDefined();
  });
});

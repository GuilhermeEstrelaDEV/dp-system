import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { REQUIRED_CAPABILITIES } from '../auth/auth.decorators';
import { CapabilitiesGuard } from '../auth/capabilities.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PayrollPeriodReadinessService } from './payroll-period-readiness.service';
import { PayrollPeriodOperationalClosureService } from './payroll-period-operational-closure.service';
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
        REQUIRED_CAPABILITIES,
        PayrollPeriodsController.prototype.readiness,
      ) as unknown,
    ).toEqual(['payroll.period.close.readiness']);

    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('test').build(),
    );
    const operation = document.paths['/payroll-periods/{payrollPeriodId}/closure-readiness']?.get;
    expect(operation).toBeDefined();
    expect(operation?.responses['200']).toBeDefined();
    expect(operation?.parameters).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'payrollRunId', in: 'query' })]),
    );
  });

  it('declares the authenticated operational close contract', () => {
    expect(
      Reflect.getMetadata(
        REQUIRED_CAPABILITIES,
        PayrollPeriodsController.prototype.close,
      ) as unknown,
    ).toEqual(['payroll.period.close.execute']);

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
});

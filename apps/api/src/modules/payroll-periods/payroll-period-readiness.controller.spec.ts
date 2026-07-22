import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { REQUIRED_CAPABILITIES } from '../auth/auth.decorators';
import { CapabilitiesGuard } from '../auth/capabilities.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PayrollPeriodReadinessService } from './payroll-period-readiness.service';
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
});

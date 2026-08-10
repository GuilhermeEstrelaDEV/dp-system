import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ROUTE_ACCESS_POLICY, type RouteAccessPolicy } from '../auth/route-access-policy';
import { PayrollClosuresController } from './payroll-closures.controller';
import { PayrollClosuresService } from './payroll-closures.service';

describe('PayrollClosuresController P0 contract', () => {
  const methods = [
    ['list', 'payroll.period.close.history'],
    ['find', 'payroll.period.close.history'],
    ['close', 'payroll.period.close.execute'],
    ['reopen', 'payroll.period.close.reopen'],
  ] as const;

  it.each(methods)('%s has an explicit company capability policy', (method, capability) => {
    const policy = Reflect.getMetadata(
      ROUTE_ACCESS_POLICY,
      PayrollClosuresController.prototype[method],
    ) as RouteAccessPolicy;
    expect(policy).toEqual({
      classification: 'CAPABILITY_PROTECTED',
      requireActiveCompany: true,
      requiredCapabilities: [capability],
      capabilitySemantics: 'ALL',
    });
  });

  it('publishes all four aliases as deprecated bearer-protected real contracts', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PayrollClosuresController],
      providers: [{ provide: PayrollClosuresService, useValue: {} }],
    }).compile();
    const app: INestApplication = moduleRef.createNestApplication();
    await app.init();
    try {
      const document = SwaggerModule.createDocument(
        app,
        new DocumentBuilder().setTitle('P0').addBearerAuth().build(),
      );
      const operations = [
        document.paths['/payroll-closures']?.get,
        document.paths['/payroll-closures/{id}']?.get,
        document.paths['/payroll-closures']?.post,
        document.paths['/payroll-closures/{payrollPeriodId}/reopen']?.post,
      ];
      expect(operations).toHaveLength(4);
      for (const operation of operations) {
        expect(operation).toMatchObject({
          deprecated: true,
          security: [{ bearer: [] }],
          'x-access-classification': 'CAPABILITY_PROTECTED',
          'x-active-company-required': true,
        });
      }
      expect(document.paths['/payroll-closures']?.post?.responses).toHaveProperty('422');
      expect(document.paths['/payroll-closures']?.post?.responses).toHaveProperty('409');
      expect(document.paths['/payroll-closures']?.post?.requestBody).toBeDefined();
      expect(document.paths['/payroll-closures']?.post?.parameters).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ in: 'header', name: 'Idempotency-Key' }),
        ]),
      );
    } finally {
      await app.close();
    }
  });
});

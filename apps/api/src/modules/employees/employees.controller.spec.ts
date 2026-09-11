import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';

describe('EmployeesController profile contract', () => {
  it('publishes the additive profile in OpenAPI without making legacy fields required', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [EmployeesController],
      providers: [{ provide: EmployeesService, useValue: {} }],
    }).compile();
    const app: INestApplication = moduleRef.createNestApplication();
    await app.init();
    try {
      const document = SwaggerModule.createDocument(
        app,
        new DocumentBuilder().setTitle('Employees').addBearerAuth().build(),
      );
      const createSchema = document.components?.schemas?.CreateEmployeeDto as {
        properties?: Record<string, unknown>;
        required?: string[];
      };
      const updateSchema = document.components?.schemas?.UpdateEmployeeDto as {
        properties?: Record<string, unknown>;
        required?: string[];
      };

      expect(document.paths['/employees']?.post?.requestBody).toBeDefined();
      expect(document.paths['/employees/{id}']?.patch?.requestBody).toBeDefined();
      expect(createSchema.properties).toEqual(
        expect.objectContaining({
          cpf: expect.objectContaining({ type: 'string' }),
          birthDate: expect.objectContaining({ format: 'date' }),
          maritalStatus: expect.objectContaining({ type: 'string' }),
          personalEmail: expect.objectContaining({ format: 'email' }),
          address: expect.any(Object),
          emergencyContact: expect.any(Object),
        }),
      );
      expect(createSchema.required).toEqual(['legalName']);
      expect(updateSchema.required).toBeUndefined();
    } finally {
      await app.close();
    }
  });
});

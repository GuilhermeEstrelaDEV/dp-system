import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';
import { validateEnvironment } from './config/env.validation';
import { AppLoggerService } from './common/logger/app-logger.service';
import { GracefulShutdownService } from './common/lifecycle/graceful-shutdown.service';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { BranchesModule } from './modules/branches/branches.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { CostCentersModule } from './modules/cost-centers/cost-centers.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { PositionsModule } from './modules/positions/positions.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { EmploymentContractsModule } from './modules/employment-contracts/employment-contracts.module';
import { AdmissionProcessesModule } from './modules/admission-processes/admission-processes.module';
import { ChecklistTemplatesModule } from './modules/checklist-templates/checklist-templates.module';
import { AdmissionChecklistsModule } from './modules/admission-checklists/admission-checklists.module';
import { AdmissionDocumentsModule } from './modules/admission-documents/admission-documents.module';
import { TimeManagementModule } from './modules/time-management/time-management.module';
import { BenefitsModule } from './modules/benefits/benefits.module';
import { VacationsLeavesModule } from './modules/vacations-leaves/vacations-leaves.module';
import { PayrollPeriodsModule } from './modules/payroll-periods/payroll-periods.module';
import { PayrollRubricsModule } from './modules/payroll-rubrics/payroll-rubrics.module';
import { PayrollParametersModule } from './modules/payroll-parameters/payroll-parameters.module';
import { PayrollInputsModule } from './modules/payroll-inputs/payroll-inputs.module';
import { PayrollRunsModule } from './modules/payroll-runs/payroll-runs.module';
import { PayrollClosuresModule } from './modules/payroll-closures/payroll-closures.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnvironment,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.getOrThrow<number>('app.rateLimitTtlMs'),
          limit: configService.getOrThrow<number>('app.rateLimitMaxRequests'),
        },
      ],
    }),
    PrismaModule,
    AuthModule,
    HealthModule,
    CompaniesModule,
    BranchesModule,
    DepartmentsModule,
    PositionsModule,
    CostCentersModule,
    EmployeesModule,
    EmploymentContractsModule,
    AdmissionProcessesModule,
    ChecklistTemplatesModule,
    AdmissionChecklistsModule,
    AdmissionDocumentsModule,
    TimeManagementModule,
    BenefitsModule,
    VacationsLeavesModule,
    PayrollPeriodsModule,
    PayrollRubricsModule,
    PayrollParametersModule,
    PayrollInputsModule,
    PayrollRunsModule,
    PayrollClosuresModule,
  ],
  providers: [
    AppLoggerService,
    GracefulShutdownService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}

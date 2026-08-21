import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { PayrollRunsController } from './payroll-runs.controller';
import { PayrollRunsService } from './payroll-runs.service';
import { PayrollCalculationService } from './domain/payroll-calculation.service';
@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PayrollRunsController],
  providers: [PayrollRunsService, PayrollCalculationService],
  exports: [PayrollRunsService],
})
export class PayrollRunsModule {}

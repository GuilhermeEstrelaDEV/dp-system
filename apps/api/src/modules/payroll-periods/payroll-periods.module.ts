import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { PayrollPeriodReadinessService } from './payroll-period-readiness.service';
import { PayrollPeriodsController } from './payroll-periods.controller';
import { PayrollPeriodsService } from './payroll-periods.service';
@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PayrollPeriodsController],
  providers: [PayrollPeriodsService, PayrollPeriodReadinessService],
  exports: [PayrollPeriodsService],
})
export class PayrollPeriodsModule {}

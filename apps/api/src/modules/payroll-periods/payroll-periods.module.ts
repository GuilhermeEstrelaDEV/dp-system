import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { PayrollPeriodClosurePersistenceService } from './payroll-period-closure-persistence.service';
import { PayrollPeriodClosureRepository } from './payroll-period-closure.repository';
import { PayrollPeriodOperationalClosureService } from './payroll-period-operational-closure.service';
import { PayrollPeriodControlledReopeningService } from './payroll-period-controlled-reopening.service';
import { PayrollPeriodHistoryService } from './payroll-period-history.service';
import { PayrollPeriodReadinessService } from './payroll-period-readiness.service';
import { PayrollPeriodsController } from './payroll-periods.controller';
import { PayrollPeriodsService } from './payroll-periods.service';
@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PayrollPeriodsController],
  providers: [
    PayrollPeriodsService,
    PayrollPeriodReadinessService,
    PayrollPeriodClosureRepository,
    PayrollPeriodClosurePersistenceService,
    PayrollPeriodOperationalClosureService,
    PayrollPeriodControlledReopeningService,
    PayrollPeriodHistoryService,
  ],
  exports: [PayrollPeriodsService, PayrollPeriodClosurePersistenceService],
})
export class PayrollPeriodsModule {}

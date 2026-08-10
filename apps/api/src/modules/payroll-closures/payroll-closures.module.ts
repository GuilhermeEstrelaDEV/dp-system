import { Module } from '@nestjs/common';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { PayrollPeriodsModule } from '../payroll-periods/payroll-periods.module';
import { PayrollClosureLegacyTelemetryService } from './payroll-closure-legacy-telemetry.service';
import { PayrollClosuresController } from './payroll-closures.controller';
import { PayrollClosuresService } from './payroll-closures.service';
@Module({
  imports: [PayrollPeriodsModule],
  controllers: [PayrollClosuresController],
  providers: [AppLoggerService, PayrollClosureLegacyTelemetryService, PayrollClosuresService],
})
export class PayrollClosuresModule {}

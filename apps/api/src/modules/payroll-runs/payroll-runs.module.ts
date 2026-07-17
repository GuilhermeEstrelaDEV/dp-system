import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PayrollRunsController } from './payroll-runs.controller';
import { PayrollRunsService } from './payroll-runs.service';
@Module({
  imports: [PrismaModule],
  controllers: [PayrollRunsController],
  providers: [PayrollRunsService],
  exports: [PayrollRunsService],
})
export class PayrollRunsModule {}

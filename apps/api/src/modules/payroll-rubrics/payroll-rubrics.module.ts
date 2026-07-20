import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PayrollRubricsController } from './payroll-rubrics.controller';
import { PayrollRubricsService } from './payroll-rubrics.service';
@Module({
  imports: [PrismaModule],
  controllers: [PayrollRubricsController],
  providers: [PayrollRubricsService],
})
export class PayrollRubricsModule {}

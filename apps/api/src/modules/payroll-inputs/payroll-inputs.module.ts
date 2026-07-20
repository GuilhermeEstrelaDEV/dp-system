import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PayrollInputsController } from './payroll-inputs.controller';
import { PayrollInputsService } from './payroll-inputs.service';
@Module({
  imports: [PrismaModule],
  controllers: [PayrollInputsController],
  providers: [PayrollInputsService],
})
export class PayrollInputsModule {}

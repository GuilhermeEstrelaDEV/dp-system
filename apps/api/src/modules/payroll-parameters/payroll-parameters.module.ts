import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PayrollParametersController } from './payroll-parameters.controller';
import { PayrollParametersService } from './payroll-parameters.service';
@Module({
  imports: [PrismaModule],
  controllers: [PayrollParametersController],
  providers: [PayrollParametersService],
})
export class PayrollParametersModule {}

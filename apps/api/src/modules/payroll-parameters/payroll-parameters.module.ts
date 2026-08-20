import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { PayrollParametersController } from './payroll-parameters.controller';
import { PayrollParametersService } from './payroll-parameters.service';
@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PayrollParametersController],
  providers: [PayrollParametersService],
})
export class PayrollParametersModule {}

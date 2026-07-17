import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PayrollClosuresController } from './payroll-closures.controller';
import { PayrollClosuresService } from './payroll-closures.service';
@Module({
  imports: [PrismaModule],
  controllers: [PayrollClosuresController],
  providers: [PayrollClosuresService],
})
export class PayrollClosuresModule {}

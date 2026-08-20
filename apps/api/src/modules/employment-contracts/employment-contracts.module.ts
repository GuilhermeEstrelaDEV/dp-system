import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EmploymentContractsController } from './employment-contracts.controller';
import { EmploymentContractsService } from './employment-contracts.service';
@Module({
  imports: [AuthModule],
  controllers: [EmploymentContractsController],
  providers: [EmploymentContractsService],
})
export class EmploymentContractsModule {}

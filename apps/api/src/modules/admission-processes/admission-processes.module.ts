import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdmissionProcessesController } from './admission-processes.controller';
import { AdmissionProcessesService } from './admission-processes.service';
@Module({
  imports: [AuthModule],
  controllers: [AdmissionProcessesController],
  providers: [AdmissionProcessesService],
})
export class AdmissionProcessesModule {}

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdmissionChecklistsService } from './admission-checklists.service';
import { AdmissionChecklistsController } from './admission-checklists.controller';
@Module({
  imports: [AuthModule],
  controllers: [AdmissionChecklistsController],
  providers: [AdmissionChecklistsService],
})
export class AdmissionChecklistsModule {}

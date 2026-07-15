import { Module } from '@nestjs/common';
import { AdmissionChecklistsService } from './admission-checklists.service';
import { AdmissionChecklistsController } from './admission-checklists.controller';
@Module({ controllers: [AdmissionChecklistsController], providers: [AdmissionChecklistsService] })
export class AdmissionChecklistsModule {}

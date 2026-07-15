import { Module } from '@nestjs/common';
import { AdmissionProcessesController } from './admission-processes.controller';
import { AdmissionProcessesService } from './admission-processes.service';
@Module({ controllers: [AdmissionProcessesController], providers: [AdmissionProcessesService] })
export class AdmissionProcessesModule {}

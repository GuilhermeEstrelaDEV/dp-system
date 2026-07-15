import { Module } from '@nestjs/common';
import { AdmissionDocumentsController } from './admission-documents.controller';
import { AdmissionDocumentsService } from './admission-documents.service';
@Module({ controllers: [AdmissionDocumentsController], providers: [AdmissionDocumentsService] })
export class AdmissionDocumentsModule {}

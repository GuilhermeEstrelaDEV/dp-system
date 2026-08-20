import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdmissionDocumentsController } from './admission-documents.controller';
import { AdmissionDocumentsService } from './admission-documents.service';
@Module({
  imports: [AuthModule],
  controllers: [AdmissionDocumentsController],
  providers: [AdmissionDocumentsService],
})
export class AdmissionDocumentsModule {}

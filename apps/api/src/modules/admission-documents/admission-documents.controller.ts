import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdmissionDocumentsService } from './admission-documents.service';
import { CreateAdmissionDocumentDto, DocumentNoteDto } from './admission-documents.dto';
@ApiTags('admission-documents')
@Controller()
export class AdmissionDocumentsController {
  constructor(private readonly service: AdmissionDocumentsService) {}
  @Get('admission-processes/:id/documents') list(@Param('id') id: string) {
    return this.service.list(id);
  }
  @Post('admission-processes/:id/documents') create(
    @Param('id') id: string,
    @Body() dto: CreateAdmissionDocumentDto,
  ) {
    return this.service.create(id, dto);
  }

  @Patch('admission-documents/:id')
  update(@Param('id') id: string, @Body() dto: DocumentNoteDto) {
    return this.service.updateObservation(id, dto.observation);
  }

  @Post('admission-documents/:id/mark-received') received(
    @Param('id') id: string,
    @Body() dto: DocumentNoteDto,
  ) {
    return this.service.markReceived(id, dto.observation);
  }
  @Post('admission-documents/:id/mark-reviewed') reviewed(
    @Param('id') id: string,
    @Body() dto: DocumentNoteDto,
  ) {
    return this.service.markReviewed(id, dto.observation);
  }
}

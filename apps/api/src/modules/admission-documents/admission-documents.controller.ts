import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { CurrentPrincipal, RequireCapabilities } from '../auth/auth.decorators';
import { CreateAdmissionDocumentDto, DocumentNoteDto } from './admission-documents.dto';
import { AdmissionDocumentsService } from './admission-documents.service';

@ApiTags('admission-documents')
@ApiBearerAuth()
@ApiUnauthorizedResponse()
@ApiForbiddenResponse()
@Controller()
export class AdmissionDocumentsController {
  constructor(private readonly service: AdmissionDocumentsService) {}

  @RequireCapabilities('admission.read')
  @ApiNotFoundResponse()
  @Get('admission-processes/:id/documents')
  list(@Param('id') id: string, @CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return this.service.list(id, principal);
  }

  @RequireCapabilities('admission.manage')
  @ApiNotFoundResponse()
  @Post('admission-processes/:id/documents')
  create(
    @Param('id') id: string,
    @Body() dto: CreateAdmissionDocumentDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.create(id, dto, principal);
  }

  @RequireCapabilities('admission.manage')
  @ApiNotFoundResponse()
  @Patch('admission-documents/:id')
  update(
    @Param('id') id: string,
    @Body() dto: DocumentNoteDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.updateObservation(id, dto.observation, principal);
  }

  @RequireCapabilities('admission.manage')
  @ApiNotFoundResponse()
  @Post('admission-documents/:id/mark-received')
  received(
    @Param('id') id: string,
    @Body() dto: DocumentNoteDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.markReceived(id, dto.observation, principal);
  }

  @RequireCapabilities('admission.manage')
  @ApiNotFoundResponse()
  @Post('admission-documents/:id/mark-reviewed')
  reviewed(
    @Param('id') id: string,
    @Body() dto: DocumentNoteDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.markReviewed(id, dto.observation, principal);
  }
}

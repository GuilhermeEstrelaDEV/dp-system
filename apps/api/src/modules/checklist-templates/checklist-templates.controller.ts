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
import { CreateChecklistTemplateDto } from './checklist-templates.dto';
import { ChecklistTemplatesService } from './checklist-templates.service';

@ApiTags('checklist-templates')
@ApiBearerAuth()
@ApiUnauthorizedResponse()
@ApiForbiddenResponse()
@Controller('checklist-templates')
export class ChecklistTemplatesController {
  constructor(private readonly service: ChecklistTemplatesService) {}

  @RequireCapabilities('admission.read')
  @Get()
  list(@CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return this.service.list(principal);
  }

  @RequireCapabilities('admission.manage')
  @Post()
  create(
    @Body() dto: CreateChecklistTemplateDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.create(dto, principal);
  }

  @RequireCapabilities('admission.read')
  @ApiNotFoundResponse()
  @Get(':id')
  find(@Param('id') id: string, @CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return this.service.find(id, principal);
  }

  @RequireCapabilities('admission.manage')
  @ApiNotFoundResponse()
  @Patch(':id/activate')
  activate(@Param('id') id: string, @CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return this.service.setStatus(id, 'ACTIVE', principal);
  }

  @RequireCapabilities('admission.manage')
  @ApiNotFoundResponse()
  @Patch(':id/inactivate')
  inactivate(@Param('id') id: string, @CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return this.service.setStatus(id, 'INACTIVE', principal);
  }
}

import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { CurrentPrincipal, RequireCapabilities } from '../auth/auth.decorators';
import { AdmissionChecklistsService } from './admission-checklists.service';

class StatusDto {
  @IsIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'NOT_APPLICABLE'])
  status!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}

@ApiTags('admission-checklists')
@ApiBearerAuth()
@ApiUnauthorizedResponse()
@ApiForbiddenResponse()
@Controller()
export class AdmissionChecklistsController {
  constructor(private readonly service: AdmissionChecklistsService) {}

  @RequireCapabilities('admission.read')
  @ApiNotFoundResponse()
  @Get('admission-processes/:id/checklist')
  get(@Param('id') id: string, @CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return this.service.get(id, principal);
  }

  @RequireCapabilities('admission.manage')
  @ApiNotFoundResponse()
  @Post('admission-processes/:id/checklist/from-template')
  fromTemplate(@Param('id') id: string, @CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return this.service.fromTemplate(id, principal);
  }

  @RequireCapabilities('admission.manage')
  @ApiNotFoundResponse()
  @Patch('admission-checklist-items/:id')
  set(
    @Param('id') id: string,
    @Body() dto: StatusDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.setItem(id, dto.status, dto.reason, principal);
  }
}

import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { CurrentPrincipal, RequireCapabilities } from '../auth/auth.decorators';
import {
  AdmissionProcessListQueryDto,
  CreateAdmissionProcessDto,
  ReasonDto,
  UpdateAdmissionProcessDto,
} from './admission-processes.dto';
import { AdmissionProcessesService } from './admission-processes.service';

@ApiTags('admission-processes')
@ApiBearerAuth()
@ApiUnauthorizedResponse()
@ApiForbiddenResponse()
@Controller('admission-processes')
export class AdmissionProcessesController {
  constructor(private readonly service: AdmissionProcessesService) {}

  @RequireCapabilities('admission.read')
  @Get()
  list(
    @Query() query: AdmissionProcessListQueryDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.list(query, principal);
  }

  @RequireCapabilities('admission.manage')
  @Post()
  create(
    @Body() dto: CreateAdmissionProcessDto,
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
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAdmissionProcessDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.update(id, dto, principal);
  }

  @RequireCapabilities('admission.manage')
  @ApiNotFoundResponse()
  @Post(':id/complete')
  complete(@Param('id') id: string, @CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return this.service.complete(id, principal);
  }

  @RequireCapabilities('admission.manage')
  @ApiNotFoundResponse()
  @Post(':id/cancel')
  cancel(
    @Param('id') id: string,
    @Body() dto: ReasonDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.cancel(id, dto.reason, principal);
  }
}

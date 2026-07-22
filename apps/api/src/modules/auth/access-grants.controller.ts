import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import {
  CreateSubstitutionDto,
  GrantEmergencyAccessDto,
  RevokeAccessDto,
} from './access-grants.dto';
import { AccessGrantsService } from './access-grants.service';
import { CurrentPrincipal, RequireCapabilities } from './auth.decorators';
import { CapabilitiesGuard } from './capabilities.guard';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('access-grants')
@ApiBearerAuth()
@Controller('access-grants')
@UseGuards(JwtAuthGuard, CapabilitiesGuard)
export class AccessGrantsController {
  constructor(private readonly service: AccessGrantsService) {}

  @Get('substitutions')
  @RequireCapabilities('delegation.manage')
  listSubstitutions(@CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return this.service.listSubstitutions(principal);
  }

  @Post('substitutions')
  @RequireCapabilities('delegation.manage')
  createSubstitution(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Body() dto: CreateSubstitutionDto,
  ) {
    return this.service.createSubstitution(principal, dto);
  }

  @Post('substitutions/:id/revoke')
  @RequireCapabilities('delegation.manage')
  revokeSubstitution(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RevokeAccessDto,
  ) {
    return this.service.revokeSubstitution(principal, id, dto.reason);
  }

  @Get('emergency')
  @RequireCapabilities('emergency_access.manage')
  listEmergency(@CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return this.service.listEmergencyAccesses(principal);
  }

  @Post('emergency')
  @RequireCapabilities('emergency_access.manage')
  grantEmergency(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Body() dto: GrantEmergencyAccessDto,
  ) {
    return this.service.grantEmergencyAccess(principal, dto);
  }

  @Post('emergency/:id/revoke')
  @RequireCapabilities('emergency_access.manage')
  revokeEmergency(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RevokeAccessDto,
  ) {
    return this.service.revokeEmergencyAccess(principal, id, dto.reason);
  }
}

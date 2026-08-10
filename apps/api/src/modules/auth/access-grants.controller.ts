import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import {
  CreateSubstitutionDto,
  EmergencyAccessMinimalResponseDto,
  GrantEmergencyAccessDto,
  RevokeAccessDto,
  SubstitutionMinimalResponseDto,
} from './access-grants.dto';
import { AccessGrantsService } from './access-grants.service';
import { CurrentEnterpriseScope, CurrentPrincipal, RequireCapabilities } from './auth.decorators';
import type { EnterpriseScope } from './enterprise-scope';

@ApiTags('access-grants')
@ApiBearerAuth()
@ApiUnauthorizedResponse()
@ApiForbiddenResponse()
@ApiNotFoundResponse()
@Controller('access-grants')
export class AccessGrantsController {
  constructor(private readonly service: AccessGrantsService) {}

  @Get('substitutions')
  @ApiOkResponse({ type: SubstitutionMinimalResponseDto, isArray: true })
  @RequireCapabilities('delegation.manage')
  listSubstitutions(
    @CurrentEnterpriseScope() scope: EnterpriseScope,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.listSubstitutions(scope, principal);
  }

  @Post('substitutions')
  @ApiCreatedResponse({ type: SubstitutionMinimalResponseDto })
  @RequireCapabilities('delegation.manage')
  createSubstitution(
    @CurrentEnterpriseScope() scope: EnterpriseScope,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Body() dto: CreateSubstitutionDto,
  ) {
    return this.service.createSubstitution(scope, principal, dto);
  }

  @Post('substitutions/:id/revoke')
  @ApiCreatedResponse({ type: SubstitutionMinimalResponseDto })
  @RequireCapabilities('delegation.manage')
  revokeSubstitution(
    @CurrentEnterpriseScope() scope: EnterpriseScope,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RevokeAccessDto,
  ) {
    return this.service.revokeSubstitution(scope, principal, id, dto.reason);
  }

  @Get('emergency')
  @ApiOkResponse({ type: EmergencyAccessMinimalResponseDto, isArray: true })
  @RequireCapabilities('emergency_access.manage')
  listEmergency(
    @CurrentEnterpriseScope() scope: EnterpriseScope,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.listEmergencyAccesses(scope, principal);
  }

  @Post('emergency')
  @ApiCreatedResponse({ type: EmergencyAccessMinimalResponseDto })
  @RequireCapabilities('emergency_access.manage')
  grantEmergency(
    @CurrentEnterpriseScope() scope: EnterpriseScope,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Body() dto: GrantEmergencyAccessDto,
  ) {
    return this.service.grantEmergencyAccess(scope, principal, dto);
  }

  @Post('emergency/:id/revoke')
  @ApiCreatedResponse({ type: EmergencyAccessMinimalResponseDto })
  @RequireCapabilities('emergency_access.manage')
  revokeEmergency(
    @CurrentEnterpriseScope() scope: EnterpriseScope,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RevokeAccessDto,
  ) {
    return this.service.revokeEmergencyAccess(scope, principal, id, dto.reason);
  }
}

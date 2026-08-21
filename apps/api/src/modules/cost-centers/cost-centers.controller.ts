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
import { CompanyScopedListQueryDto } from '../organizational/common.dto';
import { CreateCostCenterDto, UpdateCostCenterDto } from './cost-centers.dto';
import { CostCentersService } from './cost-centers.service';
@ApiTags('cost-centers')
@ApiBearerAuth()
@ApiUnauthorizedResponse()
@ApiForbiddenResponse()
@Controller('cost-centers')
export class CostCentersController {
  constructor(private readonly service: CostCentersService) {}
  @RequireCapabilities('organization.read')
  @Get()
  list(
    @Query() query: CompanyScopedListQueryDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.list(query, principal);
  }
  @RequireCapabilities('organization.read')
  @ApiNotFoundResponse()
  @Get(':id')
  find(@Param('id') id: string, @CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return this.service.find(id, principal);
  }
  @RequireCapabilities('organization.manage')
  @Post()
  create(@Body() dto: CreateCostCenterDto, @CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return this.service.create(dto, principal);
  }
  @RequireCapabilities('organization.manage')
  @ApiNotFoundResponse()
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCostCenterDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.update(id, dto, principal);
  }
  @RequireCapabilities('organization.manage')
  @ApiNotFoundResponse()
  @Patch(':id/activate')
  activate(@Param('id') id: string, @CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return this.service.setStatus(id, 'ACTIVE', principal);
  }
  @RequireCapabilities('organization.manage')
  @ApiNotFoundResponse()
  @Patch(':id/inactivate')
  inactivate(@Param('id') id: string, @CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return this.service.setStatus(id, 'INACTIVE', principal);
  }
}

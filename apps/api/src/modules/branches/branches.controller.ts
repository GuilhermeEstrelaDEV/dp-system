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
import { CreateBranchDto, UpdateBranchDto } from './branches.dto';
import { BranchesService } from './branches.service';
@ApiTags('branches')
@ApiBearerAuth()
@ApiUnauthorizedResponse()
@ApiForbiddenResponse()
@Controller('branches')
export class BranchesController {
  constructor(private readonly service: BranchesService) {}
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
  create(@Body() dto: CreateBranchDto, @CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return this.service.create(dto, principal);
  }
  @RequireCapabilities('organization.manage')
  @ApiNotFoundResponse()
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBranchDto,
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

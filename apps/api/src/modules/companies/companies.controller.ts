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
import { CompanyListQueryDto } from '../organizational/common.dto';
import { CreateCompanyDto, UpdateCompanyDto } from './companies.dto';
import { CompaniesService } from './companies.service';
@ApiTags('companies')
@ApiBearerAuth()
@ApiUnauthorizedResponse()
@ApiForbiddenResponse()
@Controller('companies')
export class CompaniesController {
  constructor(private readonly service: CompaniesService) {}
  @RequireCapabilities('company.read')
  @Get()
  list(@Query() query: CompanyListQueryDto) {
    return this.service.list(query);
  }
  @RequireCapabilities('company.read')
  @ApiNotFoundResponse()
  @Get(':id')
  find(@Param('id') id: string) {
    return this.service.find(id);
  }
  @RequireCapabilities('company.manage')
  @Post()
  create(@Body() dto: CreateCompanyDto, @CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return this.service.create(dto, principal);
  }
  @RequireCapabilities('company.manage')
  @ApiNotFoundResponse()
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCompanyDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.update(id, dto, principal);
  }
  @RequireCapabilities('company.manage')
  @ApiNotFoundResponse()
  @Patch(':id/activate')
  activate(@Param('id') id: string, @CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return this.service.setStatus(id, 'ACTIVE', principal);
  }
  @RequireCapabilities('company.manage')
  @ApiNotFoundResponse()
  @Patch(':id/inactivate')
  inactivate(@Param('id') id: string, @CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return this.service.setStatus(id, 'INACTIVE', principal);
  }
}

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
import type { RecordStatus } from '../organizational/common.dto';
import {
  ContractStatusDto,
  CreateEmploymentContractDto,
  EmploymentContractListQueryDto,
  UpdateEmploymentContractDto,
} from './employment-contracts.dto';
import { EmploymentContractsService } from './employment-contracts.service';

@ApiTags('employment-contracts')
@ApiBearerAuth()
@ApiUnauthorizedResponse()
@ApiForbiddenResponse()
@Controller('employment-contracts')
export class EmploymentContractsController {
  constructor(private readonly service: EmploymentContractsService) {}
  @RequireCapabilities('contract.read')
  @Get()
  list(
    @Query() query: EmploymentContractListQueryDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.list(query, principal);
  }
  @RequireCapabilities('contract.manage')
  @Post()
  create(
    @Body() dto: CreateEmploymentContractDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.create(dto, principal);
  }
  @RequireCapabilities('contract.read')
  @ApiNotFoundResponse()
  @Get(':id')
  find(@Param('id') id: string, @CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return this.service.find(id, principal);
  }
  @RequireCapabilities('contract.manage')
  @ApiNotFoundResponse()
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEmploymentContractDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.update(id, dto, principal);
  }
  @RequireCapabilities('contract.read')
  @ApiNotFoundResponse()
  @Get(':id/history')
  history(@Param('id') id: string, @CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return this.service.history(id, principal);
  }
  @RequireCapabilities('contract.manage')
  @ApiNotFoundResponse()
  @Patch(':id/activate')
  activate(
    @Param('id') id: string,
    @Body() dto: ContractStatusDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.setStatus(id, 'ACTIVE' as RecordStatus, dto.reason, principal);
  }
  @RequireCapabilities('contract.manage')
  @ApiNotFoundResponse()
  @Patch(':id/inactivate')
  inactivate(
    @Param('id') id: string,
    @Body() dto: ContractStatusDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.setStatus(id, 'INACTIVE' as RecordStatus, dto.reason, principal);
  }
}

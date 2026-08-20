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
  CreatePayrollParameterDto,
  PayrollParameterQueryDto,
  UpdatePayrollParameterDto,
} from './payroll-parameters.dto';
import { PayrollParametersService } from './payroll-parameters.service';
@ApiTags('payroll-parameters')
@ApiBearerAuth()
@ApiUnauthorizedResponse()
@ApiForbiddenResponse()
@Controller('payroll-parameters')
export class PayrollParametersController {
  constructor(private readonly service: PayrollParametersService) {}
  @RequireCapabilities('payroll.parameter.read')
  @Get()
  list(
    @Query() q: PayrollParameterQueryDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.list(q, principal);
  }
  @RequireCapabilities('payroll.parameter.read')
  @ApiNotFoundResponse()
  @Get(':id')
  find(@Param('id') id: string, @CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return this.service.find(id, principal);
  }
  @RequireCapabilities('payroll.parameter.manage')
  @Post()
  create(
    @Body() dto: CreatePayrollParameterDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.create(dto, principal);
  }
  @RequireCapabilities('payroll.parameter.manage')
  @ApiNotFoundResponse()
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePayrollParameterDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.update(id, dto, principal);
  }
}

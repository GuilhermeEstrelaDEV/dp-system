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
  CreatePayrollInputDto,
  PayrollInputQueryDto,
  UpdatePayrollInputDto,
} from './payroll-inputs.dto';
import { PayrollInputsService } from './payroll-inputs.service';
@ApiTags('payroll-inputs')
@ApiBearerAuth()
@ApiUnauthorizedResponse()
@ApiForbiddenResponse()
@Controller('payroll-inputs')
export class PayrollInputsController {
  constructor(private readonly service: PayrollInputsService) {}
  @RequireCapabilities('payroll.input.read')
  @Get()
  list(@Query() q: PayrollInputQueryDto, @CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return this.service.list(q, principal);
  }
  @RequireCapabilities('payroll.input.read')
  @ApiNotFoundResponse({ description: 'Input missing or outside the active company.' })
  @Get(':id')
  find(@Param('id') id: string, @CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return this.service.find(id, principal);
  }
  @RequireCapabilities('payroll.input.manage')
  @Post()
  create(
    @Body() dto: CreatePayrollInputDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.create(dto, principal);
  }
  @RequireCapabilities('payroll.input.manage')
  @ApiNotFoundResponse({ description: 'Input missing or outside the active company.' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePayrollInputDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.update(id, dto, principal);
  }
}

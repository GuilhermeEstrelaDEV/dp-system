import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
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
  CreatePayrollRunDto,
  CreatePayrollRunMessageDto,
  PayrollRunQueryDto,
} from './payroll-runs.dto';
import { PayrollRunsService } from './payroll-runs.service';
@ApiTags('payroll-runs')
@ApiBearerAuth()
@ApiUnauthorizedResponse()
@ApiForbiddenResponse()
@Controller('payroll-runs')
export class PayrollRunsController {
  constructor(private readonly service: PayrollRunsService) {}
  @RequireCapabilities('payroll.run.read')
  @Get()
  list(@Query() q: PayrollRunQueryDto, @CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return this.service.list(q, principal);
  }
  @RequireCapabilities('payroll.run.read')
  @ApiNotFoundResponse({ description: 'Run missing or outside the active company.' })
  @Get(':id')
  find(@Param('id') id: string, @CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return this.service.find(id, principal);
  }
  @RequireCapabilities('payroll.run.read')
  @ApiNotFoundResponse({ description: 'Run missing or outside the active company.' })
  @Get(':id/messages')
  messages(@Param('id') id: string, @CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return this.service.messages(id, principal);
  }
  @RequireCapabilities('payroll.run.manage')
  @Post()
  start(@Body() dto: CreatePayrollRunDto, @CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return this.service.start(dto, principal);
  }
  @RequireCapabilities('payroll.run.manage')
  @ApiNotFoundResponse({ description: 'Run missing or outside the active company.' })
  @Post(':id/messages')
  addMessage(
    @Param('id') id: string,
    @Body() dto: CreatePayrollRunMessageDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.addMessage(id, dto, principal);
  }
}

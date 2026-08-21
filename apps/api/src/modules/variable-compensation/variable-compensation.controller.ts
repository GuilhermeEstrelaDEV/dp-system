import { Body, Controller, Get, Post, Query } from '@nestjs/common';
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
  CreateOffCyclePaymentDto,
  CreatePayrollReconciliationDto,
  CreateSalaryAdvanceDto,
  CreateVariableCompensationEventDto,
  VariableCompensationQueryDto,
} from './variable-compensation.dto';
import { VariableCompensationService } from './variable-compensation.service';

@ApiTags('variable-compensation')
@ApiBearerAuth()
@ApiUnauthorizedResponse()
@ApiForbiddenResponse()
@Controller('variable-compensation')
export class VariableCompensationController {
  constructor(private readonly service: VariableCompensationService) {}

  @RequireCapabilities('variable_compensation.read')
  @ApiNotFoundResponse()
  @Get('events')
  listEvents(
    @Query() query: VariableCompensationQueryDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.listEvents(query, principal);
  }

  @RequireCapabilities('variable_compensation.manage')
  @ApiNotFoundResponse()
  @Post('events')
  createEvent(
    @Body() dto: CreateVariableCompensationEventDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.createEvent(dto, principal);
  }

  @RequireCapabilities('variable_compensation.read')
  @ApiNotFoundResponse()
  @Get('advances')
  listAdvances(
    @Query() query: VariableCompensationQueryDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.listAdvances(query, principal);
  }

  @RequireCapabilities('variable_compensation.manage')
  @ApiNotFoundResponse()
  @Post('advances')
  createAdvance(
    @Body() dto: CreateSalaryAdvanceDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.createAdvance(dto, principal);
  }

  @RequireCapabilities('variable_compensation.read')
  @ApiNotFoundResponse()
  @Get('off-cycle-payments')
  listOffCycle(
    @Query() query: VariableCompensationQueryDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.listOffCyclePayments(query, principal);
  }

  @RequireCapabilities('variable_compensation.manage')
  @ApiNotFoundResponse()
  @Post('off-cycle-payments')
  createOffCycle(
    @Body() dto: CreateOffCyclePaymentDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.createOffCyclePayment(dto, principal);
  }

  @RequireCapabilities('variable_compensation.read')
  @ApiNotFoundResponse()
  @Get('reconciliations')
  listReconciliations(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Query('payrollRunId') runId?: string,
    @Query('status') status?: string,
  ) {
    return this.service.listReconciliations(principal, runId, status);
  }

  @RequireCapabilities('variable_compensation.manage')
  @ApiNotFoundResponse()
  @Post('reconciliations')
  createReconciliation(
    @Body() dto: CreatePayrollReconciliationDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.createReconciliation(dto, principal);
  }
}

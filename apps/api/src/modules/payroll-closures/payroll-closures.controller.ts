import {
  Body,
  Controller,
  Get,
  Header,
  Headers,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { CurrentPrincipal, RequireCapabilities } from '../auth/auth.decorators';
import { ReopenPayrollPeriodResponseDto } from '../payroll-periods/payroll-period-controlled-reopening.dto';
import { PayrollPeriodClosureVersionMinimalDto } from '../payroll-periods/payroll-period-history.dto';
import { ClosePayrollPeriodResponseDto } from '../payroll-periods/payroll-period-operational-closure.dto';
import {
  ClosePayrollPeriodDto,
  PayrollClosurePageResponseDto,
  PayrollClosureQueryDto,
  ReopenPayrollPeriodDto,
} from './payroll-closures.dto';
import { PayrollClosuresService } from './payroll-closures.service';

const DEPRECATION_HEADER = 'true';

@ApiTags('payroll-closures')
@Controller('payroll-closures')
export class PayrollClosuresController {
  constructor(private readonly service: PayrollClosuresService) {}

  @Get()
  @Header('Deprecation', DEPRECATION_HEADER)
  @ApiOperation({
    deprecated: true,
    summary: 'Legacy compatibility alias for canonical payroll-period history.',
  })
  @ApiOkResponse({ type: PayrollClosurePageResponseDto })
  @ApiBadRequestResponse({ description: 'payrollPeriodId is required; global legacy scans fail.' })
  @ApiNotFoundResponse({ description: 'Period missing or outside the active company.' })
  @RequireCapabilities('payroll.period.close.history')
  list(
    @Query() query: PayrollClosureQueryDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.list(query, principal);
  }

  @Get(':id')
  @Header('Deprecation', DEPRECATION_HEADER)
  @ApiOperation({
    deprecated: true,
    summary: 'Legacy ID alias for one canonical company-scoped closure version.',
  })
  @ApiOkResponse({ type: PayrollPeriodClosureVersionMinimalDto })
  @ApiNotFoundResponse({ description: 'Version missing or outside the active company.' })
  @RequireCapabilities('payroll.period.close.history')
  find(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.find(id, principal);
  }

  @Post()
  @Header('Deprecation', DEPRECATION_HEADER)
  @ApiOperation({
    deprecated: true,
    summary: 'Legacy URI adapter delegating exclusively to canonical operational closure.',
  })
  @ApiCreatedResponse({ type: ClosePayrollPeriodResponseDto })
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiOkResponse({ type: ClosePayrollPeriodResponseDto, description: 'Idempotent replay.' })
  @ApiBadRequestResponse({ description: 'Canonical payload or Idempotency-Key is invalid.' })
  @ApiNotFoundResponse({ description: 'Period or evidence missing/outside the active company.' })
  @ApiConflictResponse({ description: 'Idempotency, state, consistency or concurrency conflict.' })
  @ApiUnprocessableEntityResponse({ description: 'Readiness or acknowledgement not met.' })
  @RequireCapabilities('payroll.period.close.execute')
  async close(
    @Body() dto: ClosePayrollPeriodDto,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.service.close(dto, idempotencyKey, principal);
    response.status(result.idempotentReplay ? HttpStatus.OK : HttpStatus.CREATED);
    return result;
  }

  @Post(':payrollPeriodId/reopen')
  @Header('Deprecation', DEPRECATION_HEADER)
  @ApiOperation({
    deprecated: true,
    summary: 'Legacy URI adapter delegating exclusively to canonical controlled reopening.',
  })
  @ApiCreatedResponse({ type: ReopenPayrollPeriodResponseDto })
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiOkResponse({ type: ReopenPayrollPeriodResponseDto, description: 'Idempotent replay.' })
  @ApiBadRequestResponse({ description: 'Canonical payload or Idempotency-Key is invalid.' })
  @ApiNotFoundResponse({ description: 'Period missing or outside the active company.' })
  @ApiConflictResponse({ description: 'State, evidence, idempotency or concurrency conflict.' })
  @RequireCapabilities('payroll.period.close.reopen')
  async reopen(
    @Param('payrollPeriodId', ParseUUIDPipe) payrollPeriodId: string,
    @Body() dto: ReopenPayrollPeriodDto,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.service.reopen(payrollPeriodId, dto, idempotencyKey, principal);
    response.status(result.idempotentReplay ? HttpStatus.OK : HttpStatus.CREATED);
    return result;
  }
}

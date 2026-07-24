import {
  Body,
  Controller,
  Get,
  Headers,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { CurrentPrincipal, RequireCapabilities } from '../auth/auth.decorators';
import { CapabilitiesGuard } from '../auth/capabilities.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  PayrollPeriodClosureReadinessQueryDto,
  PayrollPeriodClosureReadinessResponseDto,
} from './payroll-period-readiness.dto';
import { PayrollPeriodReadinessService } from './payroll-period-readiness.service';
import {
  ClosePayrollPeriodCommandDto,
  ClosePayrollPeriodResponseDto,
} from './payroll-period-operational-closure.dto';
import { PayrollPeriodOperationalClosureService } from './payroll-period-operational-closure.service';
import { ReopenPayrollPeriodResponseDto } from './payroll-period-controlled-reopening.dto';
import { PayrollPeriodControlledReopeningService } from './payroll-period-controlled-reopening.service';
import {
  CreatePayrollPeriodDto,
  PayrollPeriodQueryDto,
  ReopenPayrollPeriodDto,
  UpdatePayrollPeriodDto,
} from './payroll-periods.dto';
import { PayrollPeriodsService } from './payroll-periods.service';
@ApiTags('payroll-periods')
@Controller('payroll-periods')
export class PayrollPeriodsController {
  constructor(
    private readonly service: PayrollPeriodsService,
    private readonly readinessService: PayrollPeriodReadinessService,
    private readonly operationalClosureService: PayrollPeriodOperationalClosureService,
    private readonly controlledReopeningService: PayrollPeriodControlledReopeningService,
  ) {}
  @Get() list(@Query() q: PayrollPeriodQueryDto) {
    return this.service.list(q);
  }
  @Get(':id') find(@Param('id') id: string) {
    return this.service.find(id);
  }
  @Get(':payrollPeriodId/closure-readiness')
  @ApiBearerAuth()
  @ApiOkResponse({ type: PayrollPeriodClosureReadinessResponseDto })
  @UseGuards(JwtAuthGuard, CapabilitiesGuard)
  @RequireCapabilities('payroll.period.close.readiness')
  readiness(
    @Param('payrollPeriodId') payrollPeriodId: string,
    @Query() query: PayrollPeriodClosureReadinessQueryDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.readinessService.evaluate(payrollPeriodId, query.payrollRunId, principal);
  }
  @Post() create(@Body() dto: CreatePayrollPeriodDto) {
    return this.service.create(dto);
  }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdatePayrollPeriodDto) {
    return this.service.update(id, dto);
  }
  @Post(':id/open') open(@Param('id') id: string) {
    return this.service.open(id);
  }
  @Post(':id/validate') validate(@Param('id') id: string) {
    return this.service.validate(id);
  }
  @Post(':payrollPeriodId/close')
  @ApiBearerAuth()
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description: 'UUID unique within company, payroll period and CLOSE operation.',
  })
  @ApiCreatedResponse({ type: ClosePayrollPeriodResponseDto })
  @ApiOkResponse({ type: ClosePayrollPeriodResponseDto, description: 'Idempotent replay.' })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @ApiNotFoundResponse({ description: 'Period missing or outside the active company.' })
  @ApiConflictResponse({ description: 'Idempotency, consistency or concurrency conflict.' })
  @ApiUnprocessableEntityResponse({ description: 'Readiness or acknowledgement not met.' })
  @UseGuards(JwtAuthGuard, CapabilitiesGuard)
  @RequireCapabilities('payroll.period.close.execute')
  async close(
    @Param('payrollPeriodId') payrollPeriodId: string,
    @Body() dto: ClosePayrollPeriodCommandDto,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.operationalClosureService.close(
      payrollPeriodId,
      dto,
      idempotencyKey,
      principal,
    );
    response.status(result.idempotentReplay ? HttpStatus.OK : HttpStatus.CREATED);
    return result;
  }
  @Post(':payrollPeriodId/reopen')
  @ApiBearerAuth()
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description: 'UUID unique within company, payroll period and REOPEN operation.',
  })
  @ApiCreatedResponse({ type: ReopenPayrollPeriodResponseDto })
  @ApiOkResponse({ type: ReopenPayrollPeriodResponseDto, description: 'Idempotent replay.' })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @ApiNotFoundResponse({ description: 'Period missing or outside the active company.' })
  @ApiConflictResponse({ description: 'State, evidence, idempotency or concurrency conflict.' })
  @UseGuards(JwtAuthGuard, CapabilitiesGuard)
  @RequireCapabilities('payroll.period.close.reopen')
  async reopen(
    @Param('payrollPeriodId') payrollPeriodId: string,
    @Body() dto: ReopenPayrollPeriodDto,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.controlledReopeningService.reopen(
      payrollPeriodId,
      dto,
      idempotencyKey,
      principal,
    );
    response.status(result.idempotentReplay ? HttpStatus.OK : HttpStatus.CREATED);
    return result;
  }
}

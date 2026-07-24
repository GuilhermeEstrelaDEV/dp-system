import {
  Body,
  Controller,
  Get,
  Headers,
  HttpStatus,
  Param,
  ParseIntPipe,
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
  PayrollPeriodHistoryEventsResponseDto,
  PayrollPeriodHistoryResponseDto,
  PayrollPeriodManifestResponseDto,
} from './payroll-period-history.dto';
import { PayrollPeriodHistoryService } from './payroll-period-history.service';
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
  ControlledReopenPayrollPeriodDto,
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
    private readonly historyService: PayrollPeriodHistoryService,
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
  @Get(':payrollPeriodId/history')
  @ApiBearerAuth()
  @ApiOkResponse({
    type: PayrollPeriodHistoryResponseDto,
    description: 'Ordered closure versions with summarized immutable evidence.',
  })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @ApiNotFoundResponse({ description: 'Period missing or outside the active company.' })
  @UseGuards(JwtAuthGuard, CapabilitiesGuard)
  @RequireCapabilities('payroll.period.close.history')
  history(
    @Param('payrollPeriodId') payrollPeriodId: string,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.historyService.list(payrollPeriodId, principal);
  }
  @Get(':payrollPeriodId/history/:closureVersion/events')
  @ApiBearerAuth()
  @ApiOkResponse({
    type: PayrollPeriodHistoryEventsResponseDto,
    description: 'Chronological append-only event timeline.',
  })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @ApiNotFoundResponse()
  @UseGuards(JwtAuthGuard, CapabilitiesGuard)
  @RequireCapabilities('payroll.period.close.history')
  historyEvents(
    @Param('payrollPeriodId') payrollPeriodId: string,
    @Param('closureVersion', ParseIntPipe) closureVersion: number,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.historyService.events(payrollPeriodId, closureVersion, principal);
  }
  @Get(':payrollPeriodId/history/:closureVersion/manifest')
  @ApiBearerAuth()
  @ApiOkResponse({
    type: PayrollPeriodManifestResponseDto,
    description: 'Safe read-only manifest projection without internal context or unnecessary PII.',
  })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @ApiNotFoundResponse({ description: 'Period, version or manifest not found.' })
  @UseGuards(JwtAuthGuard, CapabilitiesGuard)
  @RequireCapabilities('payroll.period.close.history')
  historyManifest(
    @Param('payrollPeriodId') payrollPeriodId: string,
    @Param('closureVersion', ParseIntPipe) closureVersion: number,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.historyService.manifest(payrollPeriodId, closureVersion, principal);
  }
  @Get(':payrollPeriodId/history/:closureVersion')
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Complete safe projection for one closure version.' })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @ApiNotFoundResponse()
  @UseGuards(JwtAuthGuard, CapabilitiesGuard)
  @RequireCapabilities('payroll.period.close.history')
  historyVersion(
    @Param('payrollPeriodId') payrollPeriodId: string,
    @Param('closureVersion', ParseIntPipe) closureVersion: number,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.historyService.find(payrollPeriodId, closureVersion, principal);
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
    @Body() dto: ControlledReopenPayrollPeriodDto,
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

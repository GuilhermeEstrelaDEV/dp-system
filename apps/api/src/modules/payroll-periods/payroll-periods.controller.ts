import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
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
  @Post(':id/close') close(@Param('id') id: string) {
    return this.service.close(id);
  }
  @Post(':id/reopen') reopen(@Param('id') id: string, @Body() dto: ReopenPayrollPeriodDto) {
    return this.service.reopen(id, dto);
  }
}

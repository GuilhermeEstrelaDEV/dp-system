import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  CreateOffCyclePaymentDto,
  CreatePayrollReconciliationDto,
  CreateSalaryAdvanceDto,
  CreateVariableCompensationEventDto,
  VariableCompensationQueryDto,
} from './variable-compensation.dto';
import { VariableCompensationService } from './variable-compensation.service';

@Controller('variable-compensation')
export class VariableCompensationController {
  constructor(private readonly service: VariableCompensationService) {}
  @Get('events') listEvents(@Query() query: VariableCompensationQueryDto) {
    return this.service.listEvents(query);
  }
  @Post('events') createEvent(@Body() dto: CreateVariableCompensationEventDto) {
    return this.service.createEvent(dto);
  }
  @Get('advances') listAdvances(@Query() query: VariableCompensationQueryDto) {
    return this.service.listAdvances(query);
  }
  @Post('advances') createAdvance(@Body() dto: CreateSalaryAdvanceDto) {
    return this.service.createAdvance(dto);
  }
  @Get('off-cycle-payments') listOffCycle(@Query() query: VariableCompensationQueryDto) {
    return this.service.listOffCyclePayments(query);
  }
  @Post('off-cycle-payments') createOffCycle(@Body() dto: CreateOffCyclePaymentDto) {
    return this.service.createOffCyclePayment(dto);
  }
  @Get('reconciliations') listReconciliations(
    @Query('payrollRunId') runId?: string,
    @Query('status') status?: string,
  ) {
    return this.service.listReconciliations(runId, status);
  }
  @Post('reconciliations') createReconciliation(@Body() dto: CreatePayrollReconciliationDto) {
    return this.service.createReconciliation(dto);
  }
}

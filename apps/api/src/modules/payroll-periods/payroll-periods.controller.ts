import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
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
  constructor(private readonly service: PayrollPeriodsService) {}
  @Get() list(@Query() q: PayrollPeriodQueryDto) {
    return this.service.list(q);
  }
  @Get(':id') find(@Param('id') id: string) {
    return this.service.find(id);
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

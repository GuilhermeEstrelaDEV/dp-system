import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  ClosePayrollPeriodDto,
  PayrollClosureQueryDto,
  ReopenPayrollPeriodDto,
} from './payroll-closures.dto';
import { PayrollClosuresService } from './payroll-closures.service';
@ApiTags('payroll-closures')
@Controller('payroll-closures')
export class PayrollClosuresController {
  constructor(private readonly service: PayrollClosuresService) {}
  @Get() list(@Query() q: PayrollClosureQueryDto) {
    return this.service.list(q);
  }
  @Get(':id') find(@Param('id') id: string) {
    return this.service.find(id);
  }
  @Post() close(@Body() dto: ClosePayrollPeriodDto) {
    return this.service.close(dto);
  }
  @Post(':payrollPeriodId/reopen') reopen(
    @Param('payrollPeriodId') id: string,
    @Body() dto: ReopenPayrollPeriodDto,
  ) {
    return this.service.reopen(id, dto);
  }
}

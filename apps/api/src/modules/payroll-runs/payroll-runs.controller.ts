import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  CreatePayrollRunDto,
  CreatePayrollRunMessageDto,
  PayrollRunQueryDto,
} from './payroll-runs.dto';
import { PayrollRunsService } from './payroll-runs.service';
@ApiTags('payroll-runs')
@Controller('payroll-runs')
export class PayrollRunsController {
  constructor(private readonly service: PayrollRunsService) {}
  @Get() list(@Query() q: PayrollRunQueryDto) {
    return this.service.list(q);
  }
  @Get(':id') find(@Param('id') id: string) {
    return this.service.find(id);
  }
  @Get(':id/messages') messages(@Param('id') id: string) {
    return this.service.messages(id);
  }
  @Post() start(@Body() dto: CreatePayrollRunDto) {
    return this.service.start(dto);
  }
  @Post(':id/messages') addMessage(
    @Param('id') id: string,
    @Body() dto: CreatePayrollRunMessageDto,
  ) {
    return this.service.addMessage(id, dto);
  }
}

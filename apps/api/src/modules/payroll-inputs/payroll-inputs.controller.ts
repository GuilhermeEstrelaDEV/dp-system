import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  CreatePayrollInputDto,
  PayrollInputQueryDto,
  UpdatePayrollInputDto,
} from './payroll-inputs.dto';
import { PayrollInputsService } from './payroll-inputs.service';
@ApiTags('payroll-inputs')
@Controller('payroll-inputs')
export class PayrollInputsController {
  constructor(private readonly service: PayrollInputsService) {}
  @Get() list(@Query() q: PayrollInputQueryDto) {
    return this.service.list(q);
  }
  @Get(':id') find(@Param('id') id: string) {
    return this.service.find(id);
  }
  @Post() create(@Body() dto: CreatePayrollInputDto) {
    return this.service.create(dto);
  }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdatePayrollInputDto) {
    return this.service.update(id, dto);
  }
}

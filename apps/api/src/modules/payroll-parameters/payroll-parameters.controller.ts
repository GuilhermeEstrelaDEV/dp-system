import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  CreatePayrollParameterDto,
  PayrollParameterQueryDto,
  UpdatePayrollParameterDto,
} from './payroll-parameters.dto';
import { PayrollParametersService } from './payroll-parameters.service';
@ApiTags('payroll-parameters')
@Controller('payroll-parameters')
export class PayrollParametersController {
  constructor(private readonly service: PayrollParametersService) {}
  @Get() list(@Query() q: PayrollParameterQueryDto) {
    return this.service.list(q);
  }
  @Get(':id') find(@Param('id') id: string) {
    return this.service.find(id);
  }
  @Post() create(@Body() dto: CreatePayrollParameterDto) {
    return this.service.create(dto);
  }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdatePayrollParameterDto) {
    return this.service.update(id, dto);
  }
}

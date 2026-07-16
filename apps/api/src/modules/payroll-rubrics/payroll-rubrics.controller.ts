import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  CreatePayrollRubricDto,
  PayrollRubricQueryDto,
  UpdatePayrollRubricDto,
} from './payroll-rubrics.dto';
import { PayrollRubricsService } from './payroll-rubrics.service';
@ApiTags('payroll-rubrics')
@Controller('payroll-rubrics')
export class PayrollRubricsController {
  constructor(private readonly service: PayrollRubricsService) {}
  @Get() list(@Query() q: PayrollRubricQueryDto) {
    return this.service.list(q);
  }
  @Get(':id') find(@Param('id') id: string) {
    return this.service.find(id);
  }
  @Post() create(@Body() dto: CreatePayrollRubricDto) {
    return this.service.create(dto);
  }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdatePayrollRubricDto) {
    return this.service.update(id, dto);
  }
}

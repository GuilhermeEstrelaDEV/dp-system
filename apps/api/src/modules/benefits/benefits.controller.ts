import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { BenefitsService } from './benefits.service';
import {
  BenefitsQueryDto,
  ChangeEnrollmentStatusDto,
  CreateBenefitDto,
  CreateEnrollmentDto,
  CreatePlanDto,
} from './benefits.dto';

@Controller('benefits')
export class BenefitsController {
  constructor(private readonly service: BenefitsService) {}

  @Get()
  list(@Query() query: BenefitsQueryDto) {
    return this.service.list(query);
  }

  @Get('enrollments/:employmentContractId')
  listEnrollments(@Param('employmentContractId') employmentContractId: string) {
    return this.service.listEnrollments(employmentContractId);
  }

  @Post()
  create(@Body() dto: CreateBenefitDto) {
    return this.service.create(dto);
  }

  @Post('plans')
  plan(@Body() dto: CreatePlanDto) {
    return this.service.plan(dto);
  }

  @Post('enrollments')
  enroll(@Body() dto: CreateEnrollmentDto) {
    return this.service.enroll(dto);
  }

  @Patch('enrollments/:id')
  changeEnrollmentStatus(@Param('id') id: string, @Body() dto: ChangeEnrollmentStatusDto) {
    return this.service.changeEnrollmentStatus(id, dto);
  }
}

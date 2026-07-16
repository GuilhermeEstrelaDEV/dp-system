import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { VacationsLeavesService } from './vacations-leaves.service';
import {
  CreateCollectiveVacationDto,
  CreateLeaveCaseDto,
  CreateLeaveTypeDto,
  CreateVacationPeriodDto,
  CreateVacationRequestDto,
  DecisionDto,
  ReturnLeaveDto,
} from './vacations-leaves.dto';

@Controller()
export class VacationsLeavesController {
  constructor(private readonly service: VacationsLeavesService) {}
  @Get('vacation-periods') listPeriods(@Query('employmentContractId') id?: string) {
    return this.service.listVacationPeriods(id);
  }
  @Post('vacation-periods') createPeriod(@Body() dto: CreateVacationPeriodDto) {
    return this.service.createVacationPeriod(dto);
  }
  @Get('vacation-requests') listRequests(@Query('employmentContractId') id?: string) {
    return this.service.listVacationRequests(id);
  }
  @Post('vacation-requests') createRequest(@Body() dto: CreateVacationRequestDto) {
    return this.service.createVacationRequest(dto);
  }
  @Post('vacation-requests/:id/approve') approve(
    @Param('id') id: string,
    @Body() dto: DecisionDto,
  ) {
    return this.service.decideVacationRequest(id, 'APPROVED', dto);
  }
  @Post('vacation-requests/:id/cancel') cancel(@Param('id') id: string, @Body() dto: DecisionDto) {
    return this.service.decideVacationRequest(id, 'CANCELLED', dto);
  }
  @Post('collective-vacations') createCollective(@Body() dto: CreateCollectiveVacationDto) {
    return this.service.createCollectiveVacation(dto);
  }
  @Get('leave-types') listTypes(@Query('companyId') id?: string) {
    return this.service.listLeaveTypes(id);
  }
  @Post('leave-types') createType(@Body() dto: CreateLeaveTypeDto) {
    return this.service.createLeaveType(dto);
  }
  @Get('leave-cases') listCases(@Query('employmentContractId') id?: string) {
    return this.service.listLeaveCases(id);
  }
  @Post('leave-cases') createCase(@Body() dto: CreateLeaveCaseDto) {
    return this.service.createLeaveCase(dto);
  }
  @Post('leave-cases/:id/return') returnFromLeave(
    @Param('id') id: string,
    @Body() dto: ReturnLeaveDto,
  ) {
    return this.service.returnFromLeave(id, dto);
  }
}

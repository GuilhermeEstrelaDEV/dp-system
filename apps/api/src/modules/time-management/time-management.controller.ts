import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  AssignScheduleDto,
  CloseBalanceDto,
  CreateHolidayDto,
  CreateScheduleDto,
  CreateTimeEntryDto,
} from './time-management.dto';
import { TimeManagementService } from './time-management.service';

@ApiTags('time-management')
@Controller()
export class TimeManagementController {
  constructor(private readonly service: TimeManagementService) {}
  @Get('work-schedules') schedules(@Query('companyId') companyId?: string) {
    return this.service.schedules(companyId);
  }
  @Post('work-schedules') createSchedule(@Body() dto: CreateScheduleDto) {
    return this.service.createSchedule(dto);
  }
  @Post('employment-contracts/:id/work-schedules') assign(
    @Param('id') id: string,
    @Body() dto: AssignScheduleDto,
  ) {
    return this.service.assignSchedule(id, dto);
  }
  @Post('holidays') holiday(@Body() dto: CreateHolidayDto) {
    return this.service.createHoliday(dto);
  }
  @Get('time-entries') entries(@Query('employmentContractId') employmentContractId?: string) {
    return this.service.entries(employmentContractId);
  }
  @Post('time-entries') entry(@Body() dto: CreateTimeEntryDto) {
    return this.service.createEntry(dto);
  }
  @Get('employment-contracts/:id/time-balance') balance(@Param('id') id: string) {
    return this.service.balance(id);
  }
  @Post('time-balance-closings') close(@Body() dto: CloseBalanceDto) {
    return this.service.close(dto);
  }
}

import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { CurrentPrincipal, RequireCapabilities } from '../auth/auth.decorators';
import {
  AssignScheduleDto,
  CloseBalanceDto,
  CreateHolidayDto,
  CreateScheduleDto,
  CreateTimeEntryDto,
} from './time-management.dto';
import { TimeManagementService } from './time-management.service';

@ApiTags('time-management')
@ApiBearerAuth()
@ApiUnauthorizedResponse()
@ApiForbiddenResponse()
@Controller()
export class TimeManagementController {
  constructor(private readonly service: TimeManagementService) {}

  @RequireCapabilities('time.read')
  @ApiNotFoundResponse()
  @Get('work-schedules')
  schedules(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Query('companyId') companyId?: string,
  ) {
    return this.service.schedules(principal, companyId);
  }

  @RequireCapabilities('time.manage')
  @ApiNotFoundResponse()
  @Post('work-schedules')
  createSchedule(
    @Body() dto: CreateScheduleDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.createSchedule(dto, principal);
  }

  @RequireCapabilities('time.manage')
  @ApiNotFoundResponse()
  @Post('employment-contracts/:id/work-schedules')
  assign(
    @Param('id') id: string,
    @Body() dto: AssignScheduleDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.assignSchedule(id, dto, principal);
  }

  @RequireCapabilities('time.manage')
  @ApiNotFoundResponse()
  @Post('holidays')
  holiday(@Body() dto: CreateHolidayDto, @CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return this.service.createHoliday(dto, principal);
  }

  @RequireCapabilities('time.read')
  @ApiNotFoundResponse()
  @Get('time-entries')
  entries(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Query('employmentContractId') employmentContractId?: string,
  ) {
    return this.service.entries(principal, employmentContractId);
  }

  @RequireCapabilities('time.manage')
  @ApiNotFoundResponse()
  @Post('time-entries')
  entry(@Body() dto: CreateTimeEntryDto, @CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return this.service.createEntry(dto, principal);
  }

  @RequireCapabilities('time.read')
  @ApiNotFoundResponse()
  @Get('employment-contracts/:id/time-balance')
  balance(@Param('id') id: string, @CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return this.service.balance(id, principal);
  }

  @RequireCapabilities('time.manage')
  @ApiNotFoundResponse()
  @Post('time-balance-closings')
  close(@Body() dto: CloseBalanceDto, @CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return this.service.close(dto, principal);
  }
}

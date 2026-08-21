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
  CreateCollectiveVacationDto,
  CreateLeaveCaseDto,
  CreateLeaveTypeDto,
  CreateVacationPeriodDto,
  CreateVacationRequestDto,
  DecisionDto,
  ReturnLeaveDto,
} from './vacations-leaves.dto';
import { VacationsLeavesService } from './vacations-leaves.service';

@ApiTags('vacations-leaves')
@Controller()
export class VacationsLeavesController {
  constructor(private readonly service: VacationsLeavesService) {}

  @Get('vacation-periods')
  listPeriods(@Query('employmentContractId') id?: string) {
    return this.service.listVacationPeriods(id);
  }

  @Post('vacation-periods')
  createPeriod(@Body() dto: CreateVacationPeriodDto) {
    return this.service.createVacationPeriod(dto);
  }

  @Get('vacation-requests')
  listRequests(@Query('employmentContractId') id?: string) {
    return this.service.listVacationRequests(id);
  }

  @Post('vacation-requests')
  createRequest(@Body() dto: CreateVacationRequestDto) {
    return this.service.createVacationRequest(dto);
  }

  @Post('vacation-requests/:id/approve')
  approve(@Param('id') id: string, @Body() dto: DecisionDto) {
    return this.service.decideVacationRequest(id, 'APPROVED', dto);
  }

  @Post('vacation-requests/:id/cancel')
  cancel(@Param('id') id: string, @Body() dto: DecisionDto) {
    return this.service.decideVacationRequest(id, 'CANCELLED', dto);
  }

  @Post('collective-vacations')
  createCollective(@Body() dto: CreateCollectiveVacationDto) {
    return this.service.createCollectiveVacation(dto);
  }

  @RequireCapabilities('leave.read')
  @ApiBearerAuth()
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @Get('leave-types')
  listTypes(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Query('companyId') id?: string,
  ) {
    return this.service.listLeaveTypes(principal, id);
  }

  @RequireCapabilities('leave.manage')
  @ApiBearerAuth()
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @Post('leave-types')
  createType(
    @Body() dto: CreateLeaveTypeDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.createLeaveType(dto, principal);
  }

  @RequireCapabilities('leave.read')
  @ApiBearerAuth()
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @ApiNotFoundResponse()
  @Get('leave-cases')
  listCases(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Query('employmentContractId') id?: string,
  ) {
    return this.service.listLeaveCases(principal, id);
  }

  @RequireCapabilities('leave.manage')
  @ApiBearerAuth()
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @ApiNotFoundResponse()
  @Post('leave-cases')
  createCase(
    @Body() dto: CreateLeaveCaseDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.createLeaveCase(dto, principal);
  }

  @RequireCapabilities('leave.manage')
  @ApiBearerAuth()
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @ApiNotFoundResponse()
  @Post('leave-cases/:id/return')
  returnFromLeave(
    @Param('id') id: string,
    @Body() dto: ReturnLeaveDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.returnFromLeave(id, dto, principal);
  }
}

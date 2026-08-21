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

  @RequireCapabilities('vacation.read')
  @ApiBearerAuth()
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @ApiNotFoundResponse()
  @Get('vacation-periods')
  listPeriods(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Query('employmentContractId') id?: string,
  ) {
    return this.service.listVacationPeriods(principal, id);
  }

  @RequireCapabilities('vacation.manage')
  @ApiBearerAuth()
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @ApiNotFoundResponse()
  @Post('vacation-periods')
  createPeriod(
    @Body() dto: CreateVacationPeriodDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.createVacationPeriod(dto, principal);
  }

  @RequireCapabilities('vacation.read')
  @ApiBearerAuth()
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @ApiNotFoundResponse()
  @Get('vacation-requests')
  listRequests(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Query('employmentContractId') id?: string,
  ) {
    return this.service.listVacationRequests(principal, id);
  }

  @RequireCapabilities('vacation.manage')
  @ApiBearerAuth()
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @ApiNotFoundResponse()
  @Post('vacation-requests')
  createRequest(
    @Body() dto: CreateVacationRequestDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.createVacationRequest(dto, principal);
  }

  @RequireCapabilities('vacation.manage')
  @ApiBearerAuth()
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @ApiNotFoundResponse()
  @Post('vacation-requests/:id/approve')
  approve(
    @Param('id') id: string,
    @Body() dto: DecisionDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.decideVacationRequest(id, 'APPROVED', dto, principal);
  }

  @RequireCapabilities('vacation.manage')
  @ApiBearerAuth()
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @ApiNotFoundResponse()
  @Post('vacation-requests/:id/cancel')
  cancel(
    @Param('id') id: string,
    @Body() dto: DecisionDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.decideVacationRequest(id, 'CANCELLED', dto, principal);
  }

  @RequireCapabilities('vacation.manage')
  @ApiBearerAuth()
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @ApiNotFoundResponse()
  @Post('collective-vacations')
  createCollective(
    @Body() dto: CreateCollectiveVacationDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.createCollectiveVacation(dto, principal);
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

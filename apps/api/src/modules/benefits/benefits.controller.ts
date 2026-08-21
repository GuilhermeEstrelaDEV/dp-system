import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
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
  BenefitsQueryDto,
  ChangeEnrollmentStatusDto,
  CreateBenefitDto,
  CreateEnrollmentDto,
  CreatePlanDto,
} from './benefits.dto';
import { BenefitsService } from './benefits.service';

@ApiTags('benefits')
@ApiBearerAuth()
@ApiUnauthorizedResponse()
@ApiForbiddenResponse()
@Controller('benefits')
export class BenefitsController {
  constructor(private readonly service: BenefitsService) {}

  @RequireCapabilities('benefit.read')
  @ApiNotFoundResponse()
  @Get()
  list(@Query() query: BenefitsQueryDto, @CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return this.service.list(query, principal);
  }

  @RequireCapabilities('benefit.read')
  @ApiNotFoundResponse()
  @Get('enrollments/:employmentContractId')
  listEnrollments(
    @Param('employmentContractId') employmentContractId: string,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.listEnrollments(employmentContractId, principal);
  }

  @RequireCapabilities('benefit.manage')
  @ApiNotFoundResponse()
  @Post()
  create(@Body() dto: CreateBenefitDto, @CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return this.service.create(dto, principal);
  }

  @RequireCapabilities('benefit.manage')
  @ApiNotFoundResponse()
  @Post('plans')
  plan(@Body() dto: CreatePlanDto, @CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return this.service.plan(dto, principal);
  }

  @RequireCapabilities('benefit.manage')
  @ApiNotFoundResponse()
  @Post('enrollments')
  enroll(@Body() dto: CreateEnrollmentDto, @CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return this.service.enroll(dto, principal);
  }

  @RequireCapabilities('benefit.manage')
  @ApiNotFoundResponse()
  @Patch('enrollments/:id')
  changeEnrollmentStatus(
    @Param('id') id: string,
    @Body() dto: ChangeEnrollmentStatusDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.changeEnrollmentStatus(id, dto, principal);
  }
}

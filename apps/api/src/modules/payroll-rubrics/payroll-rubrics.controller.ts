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
  CreatePayrollRubricDto,
  PayrollRubricQueryDto,
  UpdatePayrollRubricDto,
} from './payroll-rubrics.dto';
import { PayrollRubricsService } from './payroll-rubrics.service';
@ApiTags('payroll-rubrics')
@ApiBearerAuth()
@ApiUnauthorizedResponse()
@ApiForbiddenResponse()
@Controller('payroll-rubrics')
export class PayrollRubricsController {
  constructor(private readonly service: PayrollRubricsService) {}
  @RequireCapabilities('payroll.rubric.read')
  @Get()
  list(@Query() q: PayrollRubricQueryDto, @CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return this.service.list(q, principal);
  }
  @RequireCapabilities('payroll.rubric.read')
  @ApiNotFoundResponse()
  @Get(':id')
  find(@Param('id') id: string, @CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return this.service.find(id, principal);
  }
  @RequireCapabilities('payroll.rubric.manage')
  @Post()
  create(
    @Body() dto: CreatePayrollRubricDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.create(dto, principal);
  }
  @RequireCapabilities('payroll.rubric.manage')
  @ApiNotFoundResponse()
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePayrollRubricDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.update(id, dto, principal);
  }
}

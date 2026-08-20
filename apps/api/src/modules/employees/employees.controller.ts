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
import { type RecordStatus } from '../organizational/common.dto';
import {
  CreateEmployeeContactDto,
  CreateEmployeeDto,
  EmployeeListQueryDto,
  UpdateEmployeeContactDto,
  UpdateEmployeeDto,
} from './employees.dto';
import { EmployeesService } from './employees.service';

@ApiTags('employees')
@ApiBearerAuth()
@ApiUnauthorizedResponse()
@ApiForbiddenResponse()
@Controller('employees')
export class EmployeesController {
  constructor(private readonly service: EmployeesService) {}
  @RequireCapabilities('employee.read')
  @Get()
  list(
    @Query() query: EmployeeListQueryDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.list(query, principal);
  }
  @RequireCapabilities('employee.manage')
  @Post()
  create(@Body() dto: CreateEmployeeDto, @CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return this.service.create(dto, principal);
  }
  @RequireCapabilities('employee.read')
  @ApiNotFoundResponse()
  @Get(':id')
  find(@Param('id') id: string, @CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return this.service.find(id, principal);
  }
  @RequireCapabilities('employee.manage')
  @ApiNotFoundResponse()
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.update(id, dto, principal);
  }
  @RequireCapabilities('employee.manage')
  @ApiNotFoundResponse()
  @Patch(':id/activate')
  activate(@Param('id') id: string, @CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return this.service.setStatus(id, 'ACTIVE' as RecordStatus, principal);
  }
  @RequireCapabilities('employee.manage')
  @ApiNotFoundResponse()
  @Patch(':id/inactivate')
  inactivate(@Param('id') id: string, @CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return this.service.setStatus(id, 'INACTIVE' as RecordStatus, principal);
  }
  @RequireCapabilities('employee.read')
  @ApiNotFoundResponse()
  @Get(':employeeId/contracts')
  listContracts(
    @Param('employeeId') employeeId: string,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.listContracts(employeeId, principal);
  }
  @RequireCapabilities('employee.read')
  @ApiNotFoundResponse()
  @Get(':employeeId/contacts')
  listContacts(
    @Param('employeeId') employeeId: string,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.listContacts(employeeId, principal);
  }
  @RequireCapabilities('employee.manage')
  @ApiNotFoundResponse()
  @Post(':employeeId/contacts')
  createContact(
    @Param('employeeId') employeeId: string,
    @Body() dto: CreateEmployeeContactDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.createContact(employeeId, dto, principal);
  }
  @RequireCapabilities('employee.manage')
  @ApiNotFoundResponse()
  @Patch(':employeeId/contacts/:contactId')
  updateContact(
    @Param('employeeId') employeeId: string,
    @Param('contactId') contactId: string,
    @Body() dto: UpdateEmployeeContactDto,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.updateContact(employeeId, contactId, dto, principal);
  }
  @RequireCapabilities('employee.manage')
  @ApiNotFoundResponse()
  @Patch(':employeeId/contacts/:contactId/activate')
  activateContact(
    @Param('employeeId') employeeId: string,
    @Param('contactId') contactId: string,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.setContactStatus(
      employeeId,
      contactId,
      'ACTIVE' as RecordStatus,
      principal,
    );
  }
  @RequireCapabilities('employee.manage')
  @ApiNotFoundResponse()
  @Patch(':employeeId/contacts/:contactId/inactivate')
  inactivateContact(
    @Param('employeeId') employeeId: string,
    @Param('contactId') contactId: string,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.service.setContactStatus(
      employeeId,
      contactId,
      'INACTIVE' as RecordStatus,
      principal,
    );
  }
}

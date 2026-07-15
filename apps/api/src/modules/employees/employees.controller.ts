import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
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
@Controller('employees')
export class EmployeesController {
  constructor(private readonly service: EmployeesService) {}
  @Get() list(@Query() query: EmployeeListQueryDto) {
    return this.service.list(query);
  }
  @Post() create(@Body() dto: CreateEmployeeDto) {
    return this.service.create(dto);
  }
  @Get(':id') find(@Param('id') id: string) {
    return this.service.find(id);
  }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.service.update(id, dto);
  }
  @Patch(':id/activate') activate(@Param('id') id: string) {
    return this.service.setStatus(id, 'ACTIVE' as RecordStatus);
  }
  @Patch(':id/inactivate') inactivate(@Param('id') id: string) {
    return this.service.setStatus(id, 'INACTIVE' as RecordStatus);
  }
  @Get(':employeeId/contracts') listContracts(@Param('employeeId') employeeId: string) {
    return this.service.listContracts(employeeId);
  }
  @Get(':employeeId/contacts') listContacts(@Param('employeeId') employeeId: string) {
    return this.service.listContacts(employeeId);
  }
  @Post(':employeeId/contacts') createContact(
    @Param('employeeId') employeeId: string,
    @Body() dto: CreateEmployeeContactDto,
  ) {
    return this.service.createContact(employeeId, dto);
  }
  @Patch(':employeeId/contacts/:contactId') updateContact(
    @Param('employeeId') employeeId: string,
    @Param('contactId') contactId: string,
    @Body() dto: UpdateEmployeeContactDto,
  ) {
    return this.service.updateContact(employeeId, contactId, dto);
  }
  @Patch(':employeeId/contacts/:contactId/activate') activateContact(
    @Param('employeeId') employeeId: string,
    @Param('contactId') contactId: string,
  ) {
    return this.service.setContactStatus(employeeId, contactId, 'ACTIVE' as RecordStatus);
  }
  @Patch(':employeeId/contacts/:contactId/inactivate') inactivateContact(
    @Param('employeeId') employeeId: string,
    @Param('contactId') contactId: string,
  ) {
    return this.service.setContactStatus(employeeId, contactId, 'INACTIVE' as RecordStatus);
  }
}

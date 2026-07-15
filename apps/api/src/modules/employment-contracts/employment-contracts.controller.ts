import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { RecordStatus } from '../organizational/common.dto';
import {
  ContractStatusDto,
  CreateEmploymentContractDto,
  EmploymentContractListQueryDto,
  UpdateEmploymentContractDto,
} from './employment-contracts.dto';
import { EmploymentContractsService } from './employment-contracts.service';

@ApiTags('employment-contracts')
@Controller('employment-contracts')
export class EmploymentContractsController {
  constructor(private readonly service: EmploymentContractsService) {}
  @Get() list(@Query() query: EmploymentContractListQueryDto) {
    return this.service.list(query);
  }
  @Post() create(@Body() dto: CreateEmploymentContractDto) {
    return this.service.create(dto);
  }
  @Get(':id') find(@Param('id') id: string) {
    return this.service.find(id);
  }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateEmploymentContractDto) {
    return this.service.update(id, dto);
  }
  @Get(':id/history') history(@Param('id') id: string) {
    return this.service.history(id);
  }
  @Patch(':id/activate') activate(@Param('id') id: string, @Body() dto: ContractStatusDto) {
    return this.service.setStatus(id, 'ACTIVE' as RecordStatus, dto.reason);
  }
  @Patch(':id/inactivate') inactivate(@Param('id') id: string, @Body() dto: ContractStatusDto) {
    return this.service.setStatus(id, 'INACTIVE' as RecordStatus, dto.reason);
  }
}

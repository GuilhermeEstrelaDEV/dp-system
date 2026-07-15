import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CompanyListQueryDto } from '../organizational/common.dto';
import { CreateCompanyDto, UpdateCompanyDto } from './companies.dto';
import { CompaniesService } from './companies.service';
@ApiTags('companies')
@Controller('companies')
export class CompaniesController {
  constructor(private readonly service: CompaniesService) {}
  @Get() list(@Query() query: CompanyListQueryDto) {
    return this.service.list(query);
  }
  @Get(':id') find(@Param('id') id: string) {
    return this.service.find(id);
  }
  @Post() create(@Body() dto: CreateCompanyDto) {
    return this.service.create(dto);
  }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateCompanyDto) {
    return this.service.update(id, dto);
  }
  @Patch(':id/activate') activate(@Param('id') id: string) {
    return this.service.setStatus(id, 'ACTIVE');
  }
  @Patch(':id/inactivate') inactivate(@Param('id') id: string) {
    return this.service.setStatus(id, 'INACTIVE');
  }
}

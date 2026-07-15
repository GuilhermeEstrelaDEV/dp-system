import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CompanyScopedListQueryDto } from '../organizational/common.dto';
import { CreateCostCenterDto, UpdateCostCenterDto } from './cost-centers.dto';
import { CostCentersService } from './cost-centers.service';
@ApiTags('cost-centers')
@Controller('cost-centers')
export class CostCentersController {
  constructor(private readonly service: CostCentersService) {}
  @Get() list(@Query() query: CompanyScopedListQueryDto) {
    return this.service.list(query);
  }
  @Get(':id') find(@Param('id') id: string) {
    return this.service.find(id);
  }
  @Post() create(@Body() dto: CreateCostCenterDto) {
    return this.service.create(dto);
  }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateCostCenterDto) {
    return this.service.update(id, dto);
  }
  @Patch(':id/activate') activate(@Param('id') id: string) {
    return this.service.setStatus(id, 'ACTIVE');
  }
  @Patch(':id/inactivate') inactivate(@Param('id') id: string) {
    return this.service.setStatus(id, 'INACTIVE');
  }
}

import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CompanyScopedListQueryDto } from '../organizational/common.dto';
import { CreateBranchDto, UpdateBranchDto } from './branches.dto';
import { BranchesService } from './branches.service';
@ApiTags('branches')
@Controller('branches')
export class BranchesController {
  constructor(private readonly service: BranchesService) {}
  @Get() list(@Query() query: CompanyScopedListQueryDto) {
    return this.service.list(query);
  }
  @Get(':id') find(@Param('id') id: string) {
    return this.service.find(id);
  }
  @Post() create(@Body() dto: CreateBranchDto) {
    return this.service.create(dto);
  }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateBranchDto) {
    return this.service.update(id, dto);
  }
  @Patch(':id/activate') activate(@Param('id') id: string) {
    return this.service.setStatus(id, 'ACTIVE');
  }
  @Patch(':id/inactivate') inactivate(@Param('id') id: string) {
    return this.service.setStatus(id, 'INACTIVE');
  }
}

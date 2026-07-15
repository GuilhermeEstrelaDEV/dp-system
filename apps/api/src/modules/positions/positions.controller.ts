import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CompanyScopedListQueryDto } from '../organizational/common.dto';
import { CreatePositionDto, UpdatePositionDto } from './positions.dto';
import { PositionsService } from './positions.service';
@ApiTags('positions')
@Controller('positions')
export class PositionsController {
  constructor(private readonly service: PositionsService) {}
  @Get() list(@Query() query: CompanyScopedListQueryDto) {
    return this.service.list(query);
  }
  @Get(':id') find(@Param('id') id: string) {
    return this.service.find(id);
  }
  @Post() create(@Body() dto: CreatePositionDto) {
    return this.service.create(dto);
  }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdatePositionDto) {
    return this.service.update(id, dto);
  }
  @Patch(':id/activate') activate(@Param('id') id: string) {
    return this.service.setStatus(id, 'ACTIVE');
  }
  @Patch(':id/inactivate') inactivate(@Param('id') id: string) {
    return this.service.setStatus(id, 'INACTIVE');
  }
}

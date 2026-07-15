import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdmissionProcessesService } from './admission-processes.service';
import {
  CreateAdmissionProcessDto,
  ReasonDto,
  UpdateAdmissionProcessDto,
} from './admission-processes.dto';
@ApiTags('admission-processes')
@Controller('admission-processes')
export class AdmissionProcessesController {
  constructor(private readonly service: AdmissionProcessesService) {}
  @Get() list() {
    return this.service.list();
  }
  @Post() create(@Body() dto: CreateAdmissionProcessDto) {
    return this.service.create(dto);
  }
  @Get(':id') find(@Param('id') id: string) {
    return this.service.find(id);
  }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateAdmissionProcessDto) {
    return this.service.update(id, dto);
  }
  @Post(':id/complete') complete(@Param('id') id: string) {
    return this.service.complete(id);
  }
  @Post(':id/cancel') cancel(@Param('id') id: string, @Body() dto: ReasonDto) {
    return this.service.cancel(id, dto.reason);
  }
}

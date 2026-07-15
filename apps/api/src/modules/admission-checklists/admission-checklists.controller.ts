import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { AdmissionChecklistsService } from './admission-checklists.service';

class StatusDto {
  @IsIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'NOT_APPLICABLE'])
  status!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}

@ApiTags('admission-checklists')
@Controller()
export class AdmissionChecklistsController {
  constructor(private readonly service: AdmissionChecklistsService) {}

  @Get('admission-processes/:id/checklist')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Post('admission-processes/:id/checklist/from-template')
  fromTemplate(@Param('id') id: string) {
    return this.service.fromTemplate(id);
  }

  @Patch('admission-checklist-items/:id')
  set(@Param('id') id: string, @Body() dto: StatusDto) {
    return this.service.setItem(id, dto.status, dto.reason);
  }
}

import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ChecklistTemplatesService } from './checklist-templates.service';
import { CreateChecklistTemplateDto } from './checklist-templates.dto';
@ApiTags('checklist-templates')
@Controller('checklist-templates')
export class ChecklistTemplatesController {
  constructor(private readonly service: ChecklistTemplatesService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Post() create(@Body() dto: CreateChecklistTemplateDto) {
    return this.service.create(dto);
  }
  @Get(':id') find(@Param('id') id: string) {
    return this.service.find(id);
  }
  @Patch(':id/activate') activate(@Param('id') id: string) {
    return this.service.setStatus(id, 'ACTIVE');
  }
  @Patch(':id/inactivate') inactivate(@Param('id') id: string) {
    return this.service.setStatus(id, 'INACTIVE');
  }
}

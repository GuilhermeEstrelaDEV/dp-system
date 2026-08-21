import { Module } from '@nestjs/common';
import { OrganizationResourceModule } from '../organizational/organization-resource.module';
import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from './departments.service';
@Module({
  imports: [OrganizationResourceModule],
  controllers: [DepartmentsController],
  providers: [DepartmentsService],
})
export class DepartmentsModule {}

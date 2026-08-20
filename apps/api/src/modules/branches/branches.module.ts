import { Module } from '@nestjs/common';
import { OrganizationResourceModule } from '../organizational/organization-resource.module';
import { BranchesController } from './branches.controller';
import { BranchesService } from './branches.service';
@Module({
  imports: [OrganizationResourceModule],
  controllers: [BranchesController],
  providers: [BranchesService],
})
export class BranchesModule {}

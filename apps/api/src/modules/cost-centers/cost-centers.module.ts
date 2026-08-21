import { Module } from '@nestjs/common';
import { OrganizationResourceModule } from '../organizational/organization-resource.module';
import { CostCentersController } from './cost-centers.controller';
import { CostCentersService } from './cost-centers.service';
@Module({
  imports: [OrganizationResourceModule],
  controllers: [CostCentersController],
  providers: [CostCentersService],
})
export class CostCentersModule {}

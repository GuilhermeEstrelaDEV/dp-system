import { Module } from '@nestjs/common';
import { OrganizationResourceModule } from '../organizational/organization-resource.module';
import { PositionsController } from './positions.controller';
import { PositionsService } from './positions.service';
@Module({
  imports: [OrganizationResourceModule],
  controllers: [PositionsController],
  providers: [PositionsService],
})
export class PositionsModule {}

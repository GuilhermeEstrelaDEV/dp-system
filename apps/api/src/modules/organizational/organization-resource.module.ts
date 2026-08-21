import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OrganizationResourceService } from './organization-resource.service';

@Module({
  imports: [AuthModule],
  providers: [OrganizationResourceService],
  exports: [OrganizationResourceService],
})
export class OrganizationResourceModule {}

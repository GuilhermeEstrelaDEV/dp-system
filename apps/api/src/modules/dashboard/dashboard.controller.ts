import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { CurrentEnterpriseScope, CurrentPrincipal } from '../auth/auth.decorators';
import type { EnterpriseScope } from '../auth/enterprise-scope';
import { RequireActiveCompany } from '../auth/route-access-policy';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@RequireActiveCompany()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('summary')
  summary(
    @CurrentEnterpriseScope() scope: EnterpriseScope,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ) {
    return this.dashboard.summary(scope, principal);
  }
}

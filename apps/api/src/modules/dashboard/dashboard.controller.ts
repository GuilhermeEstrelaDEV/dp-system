import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { CurrentPrincipal } from '../auth/auth.decorators';
import { RequireActiveCompany } from '../auth/route-access-policy';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@RequireActiveCompany()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('summary')
  summary(@CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return this.dashboard.summary(principal);
  }
}

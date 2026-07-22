import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedPrincipal, RequestWithContext } from '../../common/http/request-context';
import { CurrentPrincipal } from './auth.decorators';
import { LoginDto, SelectCompanyDto } from './auth.dto';
import { AuthService } from './auth.service';
import { AuditWriterService } from './audit-writer.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly audit: AuditWriterService,
  ) {}

  @Post('login')
  async login(@Body() dto: LoginDto, @Req() request: RequestWithContext) {
    const { actorId, sessionId, ...token } = await this.auth.login(dto.email, dto.password);
    await this.audit.append({
      principal: {
        actorId,
        activeCompanyId: null,
        traceId: request.correlationId ?? 'missing-trace-id',
        sessionId,
        ipAddress: request.ip || request.socket.remoteAddress || 'unknown',
        userAgent: request.header('user-agent') ?? null,
      },
      action: 'AUTH_LOGIN_SUCCEEDED',
      entityType: 'Session',
      entityId: sessionId,
    });
    return token;
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  me(@CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return principal;
  }

  @Get('companies')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  companies(@CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return this.auth.listCompanies(principal.actorId);
  }

  @Post('context')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async selectCompany(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Body() dto: SelectCompanyDto,
  ) {
    const token = await this.auth.selectCompany(principal, dto.companyId);
    await this.audit.append({
      principal: { ...principal, activeCompanyId: dto.companyId },
      action: 'AUTH_COMPANY_SELECTED',
      entityType: 'Company',
      entityId: dto.companyId,
    });
    return token;
  }
}

import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { AuthenticatedPrincipal, RequestWithContext } from '../../common/http/request-context';
import { CurrentPrincipal } from './auth.decorators';
import {
  AuthenticatedUserMinimalResponseDto,
  AuthTokenResponseDto,
  AvailableCompanyMinimalResponseDto,
  LoginDto,
  LogoutMinimalResponseDto,
  SelectCompanyDto,
} from './auth.dto';
import { AuthService } from './auth.service';
import { AuditWriterService } from './audit-writer.service';
import { AuthenticatedRoute, PublicRoute } from './route-access-policy';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly audit: AuditWriterService,
  ) {}

  @Post('login')
  @PublicRoute()
  @ApiCreatedResponse({ type: AuthTokenResponseDto })
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
      reasonCode: 'AUTHENTICATION_SUCCEEDED',
    });
    return token;
  }

  @Get('me')
  @AuthenticatedRoute()
  @ApiBearerAuth()
  @ApiOkResponse({ type: AuthenticatedUserMinimalResponseDto })
  @ApiUnauthorizedResponse()
  me(@CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return this.auth.currentUser(principal);
  }

  @Get('companies')
  @AuthenticatedRoute()
  @ApiBearerAuth()
  @ApiOkResponse({ type: AvailableCompanyMinimalResponseDto, isArray: true })
  @ApiUnauthorizedResponse()
  companies(@CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return this.auth.listCompanies(principal.actorId);
  }

  @Post('context')
  @AuthenticatedRoute()
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: AuthTokenResponseDto })
  @ApiUnauthorizedResponse()
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
      reasonCode: 'COMPANY_CONTEXT_SELECTED',
    });
    return token;
  }

  @Post('logout')
  @AuthenticatedRoute()
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: LogoutMinimalResponseDto })
  @ApiUnauthorizedResponse()
  async logout(@CurrentPrincipal() principal: AuthenticatedPrincipal) {
    const revoked = await this.auth.logout(principal);
    await this.audit.append({
      principal,
      action: 'AUTH_LOGOUT_SUCCEEDED',
      entityType: 'Session',
      entityId: principal.sessionId,
      reasonCode: 'SESSION_TERMINATED',
    });
    return { revoked };
  }
}

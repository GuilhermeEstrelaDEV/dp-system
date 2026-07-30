import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { IdentitySessionService } from './identity-session.service';
import { PasswordHasherService } from './password-hasher.service';
import { ActiveCompanyResolverService } from './active-company-resolver.service';

export interface AccessTokenPayload {
  sub: string;
  activeCompanyId?: string;
  sid: string;
  exp?: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly passwords: PasswordHasherService,
    private readonly sessions: IdentitySessionService,
    private readonly activeCompanies: ActiveCompanyResolverService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (!user || user.status !== 'ACTIVE' || !user.passwordHash) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    if (!(await this.passwords.verify(password, user.passwordHash))) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    const sessionId = randomUUID();
    const token = await this.issueToken(user.id, null, sessionId);
    const payload = await this.jwt.verifyAsync<AccessTokenPayload>(token.accessToken);
    if (!payload?.exp) throw new UnauthorizedException('Credenciais inválidas');
    await this.sessions.register(user.id, sessionId, new Date(payload.exp * 1000));
    return {
      ...token,
      actorId: user.id,
      sessionId,
    };
  }

  async listCompanies(actorId: string) {
    const now = new Date();
    const assignments = await this.prisma.userCompanyRole.findMany({
      where: {
        userId: actorId,
        status: 'ACTIVE',
        validFrom: { lte: now },
        OR: [{ validTo: null }, { validTo: { gt: now } }],
        company: { status: 'ACTIVE' },
      },
      select: { company: { select: { id: true, legalName: true, tradeName: true } } },
      orderBy: { company: { tradeName: 'asc' } },
    });
    return [...new Map(assignments.map(({ company }) => [company.id, company])).values()];
  }

  async selectCompany(principal: AuthenticatedPrincipal, companyId: string) {
    const context = await this.activeCompanies.resolve(principal, [
      { source: 'AUTH_CONTEXT_BODY', value: companyId },
    ]);
    return this.issueToken(principal.actorId, context.companyId, principal.sessionId);
  }

  async currentUser(principal: AuthenticatedPrincipal) {
    const now = new Date();
    const user = await this.prisma.user.findUnique({
      where: { id: principal.actorId },
      select: {
        email: true,
        displayName: true,
        companyRoles: {
          where: {
            companyId: principal.activeCompanyId ?? undefined,
            status: 'ACTIVE',
            validFrom: { lte: now },
            OR: [{ validTo: null }, { validTo: { gt: now } }],
          },
          select: { role: { select: { code: true } } },
        },
      },
    });
    if (!user) throw new UnauthorizedException('Identidade não encontrada');
    return {
      ...principal,
      email: user.email,
      displayName: user.displayName,
      roleCodes: [...new Set(user.companyRoles.map(({ role }) => role.code))],
    };
  }

  logout(principal: AuthenticatedPrincipal) {
    return this.sessions.revoke(principal.sessionId);
  }

  private async issueToken(actorId: string, activeCompanyId: string | null, sessionId: string) {
    const payload: AccessTokenPayload = {
      sub: actorId,
      sid: sessionId,
      ...(activeCompanyId ? { activeCompanyId } : {}),
    };
    return { accessToken: await this.jwt.signAsync(payload), tokenType: 'Bearer' as const };
  }
}

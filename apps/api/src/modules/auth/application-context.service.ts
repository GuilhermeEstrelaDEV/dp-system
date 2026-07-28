import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { IdentityAuthenticationException } from './identity-authentication.errors';
import { createAuthenticatedPrincipal, type TokenIdentity } from './identity-context';
import { IdentitySessionService } from './identity-session.service';

@Injectable()
export class ApplicationContextService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: IdentitySessionService,
  ) {}

  async resolve(
    identity: TokenIdentity,
    traceId: string,
    ipAddress = 'unknown',
    userAgent: string | null = null,
  ): Promise<AuthenticatedPrincipal> {
    const now = new Date();
    await this.sessions.assertActive(identity.actorId, identity.sessionId, now);
    const user = await this.prisma.user.findUnique({
      where: { id: identity.actorId },
      select: {
        status: true,
        roles: { select: { role: { select: { permissions: { select: { permission: true } } } } } },
        companyRoles: {
          where: {
            companyId: identity.activeCompanyId ?? '00000000-0000-0000-0000-000000000000',
            status: 'ACTIVE',
            validFrom: { lte: now },
            OR: [{ validTo: null }, { validTo: { gt: now } }],
            company: { status: 'ACTIVE' },
          },
          select: {
            role: { select: { permissions: { select: { permission: true } } } },
          },
        },
        substitutionsAsSubstitute: identity.activeCompanyId
          ? {
              where: {
                companyId: identity.activeCompanyId,
                status: 'ACTIVE',
                startsAt: { lte: now },
                expiresAt: { gt: now },
              },
              select: { id: true, capabilities: true },
            }
          : false,
        emergencyAccesses: identity.activeCompanyId
          ? {
              where: {
                companyId: identity.activeCompanyId,
                status: 'ACTIVE',
                startsAt: { lte: now },
                expiresAt: { gt: now },
              },
              select: { id: true, capabilities: true },
            }
          : false,
      },
    });
    if (!user) throw new IdentityAuthenticationException('USER_NOT_FOUND');
    if (user.status !== 'ACTIVE') throw new IdentityAuthenticationException('USER_INACTIVE');
    if (identity.activeCompanyId && user.companyRoles.length === 0) {
      throw new NotFoundException('Empresa não encontrada');
    }
    const globalPermissions = user.roles.flatMap(({ role }) =>
      role.permissions
        .map(({ permission }) => permission.code)
        .filter((code) => code.startsWith('platform.')),
    );
    const companyPermissions = user.companyRoles.flatMap(({ role }) =>
      role.permissions.map(({ permission }) => permission.code),
    );
    const accessGrants = [
      ...user.substitutionsAsSubstitute.map((grant) => ({
        id: grant.id,
        type: 'SUBSTITUTION' as const,
        capabilities: grant.capabilities,
      })),
      ...user.emergencyAccesses.map((grant) => ({
        id: grant.id,
        type: 'EMERGENCY' as const,
        capabilities: grant.capabilities,
      })),
    ];
    return createAuthenticatedPrincipal({
      actorId: identity.actorId,
      activeCompanyId: identity.activeCompanyId,
      permissions: [
        ...new Set([
          ...globalPermissions,
          ...companyPermissions,
          ...accessGrants.flatMap((grant) => grant.capabilities),
        ]),
      ].sort(),
      traceId,
      sessionId: identity.sessionId,
      ipAddress,
      userAgent,
      accessGrants,
    });
  }
}

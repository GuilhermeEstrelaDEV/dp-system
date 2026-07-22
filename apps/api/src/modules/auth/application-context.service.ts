import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';

interface TokenIdentity {
  actorId: string;
  activeCompanyId: string | null;
  sessionId: string;
}

@Injectable()
export class ApplicationContextService {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(
    identity: TokenIdentity,
    traceId: string,
    ipAddress = 'unknown',
    userAgent: string | null = null,
  ): Promise<AuthenticatedPrincipal> {
    const now = new Date();
    const user = await this.prisma.user.findFirst({
      where: { id: identity.actorId, status: 'ACTIVE' },
      select: {
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
    if (!user) throw new UnauthorizedException('Credenciais inválidas');
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
    return {
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
    };
  }
}

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

  async resolve(identity: TokenIdentity, traceId: string): Promise<AuthenticatedPrincipal> {
    const user = await this.prisma.user.findFirst({
      where: { id: identity.actorId, status: 'ACTIVE' },
      select: {
        roles: { select: { role: { select: { permissions: { select: { permission: true } } } } } },
        companyRoles: {
          where: {
            companyId: identity.activeCompanyId ?? '00000000-0000-0000-0000-000000000000',
            status: 'ACTIVE',
            validFrom: { lte: new Date() },
            OR: [{ validTo: null }, { validTo: { gt: new Date() } }],
            company: { status: 'ACTIVE' },
          },
          select: {
            role: { select: { permissions: { select: { permission: true } } } },
          },
        },
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
    return {
      actorId: identity.actorId,
      activeCompanyId: identity.activeCompanyId,
      permissions: [...new Set([...globalPermissions, ...companyPermissions])].sort(),
      traceId,
      sessionId: identity.sessionId,
    };
  }
}

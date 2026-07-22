import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { PasswordHasherService } from './password-hasher.service';

export interface AccessTokenPayload {
  sub: string;
  activeCompanyId?: string;
  sid: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly passwords: PasswordHasherService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || user.status !== 'ACTIVE' || !user.passwordHash) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    if (!(await this.passwords.verify(password, user.passwordHash))) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    const sessionId = randomUUID();
    return {
      ...(await this.issueToken(user.id, null, sessionId)),
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
    const companies = await this.listCompanies(principal.actorId);
    if (!companies.some((company) => company.id === companyId)) {
      throw new NotFoundException('Empresa não encontrada');
    }
    return this.issueToken(principal.actorId, companyId, principal.sessionId);
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

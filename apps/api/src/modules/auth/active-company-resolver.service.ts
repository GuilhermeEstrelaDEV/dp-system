import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedPrincipal } from './identity-context';
import {
  createActiveCompanyContext,
  type ActiveCompanyContext,
  type RequestedCompanyCandidate,
} from './active-company-context';
import { CompanySelectionService } from './company-selection.service';
@Injectable()
export class ActiveCompanyResolverService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly selections: CompanySelectionService,
  ) {}
  async resolve(
    principal: Pick<AuthenticatedPrincipal, 'actorId'> | null | undefined,
    candidates: readonly RequestedCompanyCandidate[],
    now = new Date(),
  ): Promise<ActiveCompanyContext> {
    if (!principal?.actorId)
      throw new UnauthorizedException({
        code: 'IDENTITY_REQUIRED',
        message: 'Identidade obrigatória',
      });
    const selection = this.selections.resolve(candidates);
    const assignments = await this.prisma.userCompanyRole.findMany({
      where: {
        userId: principal.actorId,
        companyId: selection.companyId,
        status: 'ACTIVE',
        validFrom: { lte: now },
        OR: [{ validTo: null }, { validTo: { gt: now } }],
        company: { status: 'ACTIVE' },
      },
      select: { id: true },
      orderBy: { id: 'asc' },
    });
    if (!assignments.length)
      throw new ForbiddenException({
        code: 'COMPANY_SELECTION_FORBIDDEN',
        message: 'Empresa não disponível para a identidade autenticada',
      });
    return createActiveCompanyContext({
      userId: principal.actorId,
      companyId: selection.companyId,
      assignmentIds: assignments.map(({ id }) => id),
      selectionSource: selection.selectionSource,
      resolvedAt: now.toISOString(),
    });
  }
}

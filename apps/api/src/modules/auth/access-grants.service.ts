import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Prisma } from '@prisma/client';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateSubstitutionDto, GrantEmergencyAccessDto } from './access-grants.dto';
import { AuditWriterService } from './audit-writer.service';
import { AuthorizationService } from './authorization.service';

const DELEGATION_CAPABILITY = 'delegation.manage';
const EMERGENCY_CAPABILITY = 'emergency_access.manage';

@Injectable()
export class AccessGrantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditWriterService,
    private readonly authorization: AuthorizationService,
    private readonly config: ConfigService,
  ) {}

  async listSubstitutions(principal: AuthenticatedPrincipal) {
    const companyId = this.requireCompany(principal, DELEGATION_CAPABILITY);
    await this.expireSubstitutions(principal, companyId);
    return this.prisma.temporarySubstitution.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createSubstitution(principal: AuthenticatedPrincipal, dto: CreateSubstitutionDto) {
    const companyId = this.requireCompany(principal, DELEGATION_CAPABILITY);
    if (dto.holderUserId === dto.substituteUserId) {
      throw new BadRequestException('Titular e substituto devem ser diferentes');
    }
    if (dto.expiresAt <= dto.startsAt) throw new BadRequestException('Vigência inválida');
    const permitted = await this.resolveUserCapabilities(dto.holderUserId, companyId);
    if (dto.capabilities.some((capability) => !permitted.has(capability))) {
      throw new BadRequestException('Substituição contém capability não pertencente ao titular');
    }
    return this.audit.transaction(async (tx) => {
      const created = await tx.temporarySubstitution.create({
        data: {
          companyId,
          holderUserId: dto.holderUserId,
          substituteUserId: dto.substituteUserId,
          grantedByUserId: principal.actorId,
          capabilities: [...new Set(dto.capabilities)].sort(),
          startsAt: dto.startsAt,
          expiresAt: dto.expiresAt,
          reason: dto.reason,
        },
      });
      await this.audit.append(
        {
          principal,
          action: 'SUBSTITUTION_CREATED',
          entityType: 'TemporarySubstitution',
          entityId: created.id,
          nextState: this.snapshot(created),
          reason: dto.reason,
          metadata: {
            capabilities: created.capabilities,
            startsAt: created.startsAt.toISOString(),
            expiresAt: created.expiresAt.toISOString(),
            grantType: 'SUBSTITUTION',
          },
        },
        tx,
      );
      return created;
    });
  }

  async revokeSubstitution(principal: AuthenticatedPrincipal, id: string, reason: string) {
    const companyId = this.requireCompany(principal, DELEGATION_CAPABILITY);
    return this.audit.transaction(async (tx) => {
      const current = await tx.temporarySubstitution.findFirst({
        where: { id, companyId, status: 'ACTIVE' },
      });
      if (!current) throw new NotFoundException('Concessão não encontrada');
      const next = await tx.temporarySubstitution.update({
        where: { id },
        data: {
          status: 'REVOKED',
          revokedAt: new Date(),
          revokedByUserId: principal.actorId,
          revocationReason: reason,
        },
      });
      await this.audit.append(
        {
          principal,
          action: 'SUBSTITUTION_REVOKED',
          entityType: 'TemporarySubstitution',
          entityId: id,
          previousState: this.snapshot(current),
          nextState: this.snapshot(next),
          reason,
        },
        tx,
      );
      return next;
    });
  }

  async listEmergencyAccesses(principal: AuthenticatedPrincipal) {
    const companyId = this.requireCompany(principal, EMERGENCY_CAPABILITY);
    await this.expireEmergencyAccesses(principal, companyId);
    return this.prisma.emergencyAccess.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async grantEmergencyAccess(principal: AuthenticatedPrincipal, dto: GrantEmergencyAccessDto) {
    const companyId = this.requireCompany(principal, EMERGENCY_CAPABILITY);
    if (dto.beneficiaryUserId === principal.actorId) {
      throw new BadRequestException('Auto concessão emergencial não é permitida');
    }
    const now = new Date();
    const maxMs = this.config.getOrThrow<number>('app.emergencyAccessMaxHours') * 3_600_000;
    if (dto.expiresAt <= now || dto.expiresAt.getTime() - now.getTime() > maxMs) {
      throw new BadRequestException('Duração do acesso emergencial inválida');
    }
    if (dto.capabilities.includes(EMERGENCY_CAPABILITY)) {
      throw new BadRequestException(
        'Acesso emergencial não pode delegar sua própria administração',
      );
    }
    await this.assertKnownCapabilities(dto.capabilities);
    return this.audit.transaction(async (tx) => {
      const created = await tx.emergencyAccess.create({
        data: {
          companyId,
          beneficiaryUserId: dto.beneficiaryUserId,
          grantedByUserId: principal.actorId,
          capabilities: [...new Set(dto.capabilities)].sort(),
          startsAt: now,
          expiresAt: dto.expiresAt,
          reason: dto.reason,
        },
      });
      await this.audit.append(
        {
          principal,
          action: 'EMERGENCY_ACCESS_GRANTED',
          entityType: 'EmergencyAccess',
          entityId: created.id,
          nextState: this.snapshot(created),
          reason: dto.reason,
          metadata: {
            capabilities: created.capabilities,
            startsAt: created.startsAt.toISOString(),
            expiresAt: created.expiresAt.toISOString(),
            grantType: 'EMERGENCY',
          },
        },
        tx,
      );
      return created;
    });
  }

  async revokeEmergencyAccess(principal: AuthenticatedPrincipal, id: string, reason: string) {
    const companyId = this.requireCompany(principal, EMERGENCY_CAPABILITY);
    return this.audit.transaction(async (tx) => {
      const current = await tx.emergencyAccess.findFirst({
        where: { id, companyId, status: 'ACTIVE' },
      });
      if (!current) throw new NotFoundException('Concessão não encontrada');
      const next = await tx.emergencyAccess.update({
        where: { id },
        data: {
          status: 'REVOKED',
          revokedAt: new Date(),
          revokedByUserId: principal.actorId,
          revocationReason: reason,
        },
      });
      await this.audit.append(
        {
          principal,
          action: 'EMERGENCY_ACCESS_REVOKED',
          entityType: 'EmergencyAccess',
          entityId: id,
          previousState: this.snapshot(current),
          nextState: this.snapshot(next),
          reason,
        },
        tx,
      );
      return next;
    });
  }

  private requireCompany(principal: AuthenticatedPrincipal, capability: string): string {
    this.authorization.requireCapability(principal, capability);
    if (!principal.activeCompanyId) throw new NotFoundException('Empresa não encontrada');
    return principal.activeCompanyId;
  }

  private async resolveUserCapabilities(userId: string, companyId: string): Promise<Set<string>> {
    const assignments = await this.prisma.userCompanyRole.findMany({
      where: {
        userId,
        companyId,
        status: 'ACTIVE',
        validFrom: { lte: new Date() },
        OR: [{ validTo: null }, { validTo: { gt: new Date() } }],
      },
      select: {
        role: { select: { permissions: { select: { permission: { select: { code: true } } } } } },
      },
    });
    if (!assignments.length) throw new NotFoundException('Usuário não encontrado');
    return new Set(
      assignments.flatMap(({ role }) => role.permissions.map(({ permission }) => permission.code)),
    );
  }

  private async assertKnownCapabilities(capabilities: string[]): Promise<void> {
    const count = await this.prisma.permission.count({
      where: { code: { in: [...new Set(capabilities)] } },
    });
    if (count !== new Set(capabilities).size)
      throw new BadRequestException('Capability desconhecida');
  }

  private async expireSubstitutions(principal: AuthenticatedPrincipal, companyId: string) {
    await this.audit.transaction(async (tx) => {
      const expired = await tx.temporarySubstitution.findMany({
        where: { companyId, status: 'ACTIVE', expiresAt: { lte: new Date() } },
      });
      for (const grant of expired) {
        const next = await tx.temporarySubstitution.update({
          where: { id: grant.id },
          data: { status: 'EXPIRED' },
        });
        await this.audit.append(
          {
            principal,
            action: 'SUBSTITUTION_EXPIRED',
            entityType: 'TemporarySubstitution',
            entityId: grant.id,
            previousState: this.snapshot(grant),
            nextState: this.snapshot(next),
          },
          tx,
        );
      }
    });
  }

  private async expireEmergencyAccesses(principal: AuthenticatedPrincipal, companyId: string) {
    await this.audit.transaction(async (tx) => {
      const expired = await tx.emergencyAccess.findMany({
        where: { companyId, status: 'ACTIVE', expiresAt: { lte: new Date() } },
      });
      for (const grant of expired) {
        const next = await tx.emergencyAccess.update({
          where: { id: grant.id },
          data: { status: 'EXPIRED' },
        });
        await this.audit.append(
          {
            principal,
            action: 'EMERGENCY_ACCESS_EXPIRED',
            entityType: 'EmergencyAccess',
            entityId: grant.id,
            previousState: this.snapshot(grant),
            nextState: this.snapshot(next),
          },
          tx,
        );
      }
    });
  }

  private snapshot(value: object): Prisma.InputJsonObject {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonObject;
  }
}

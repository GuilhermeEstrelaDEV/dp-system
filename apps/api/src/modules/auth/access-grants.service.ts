import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Prisma } from '@prisma/client';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import type { CreateSubstitutionDto, GrantEmergencyAccessDto } from './access-grants.dto';
import { AccessGrantsRepository } from './access-grants.repository';
import { AuditWriterService } from './audit-writer.service';
import { AuthorizationService } from './authorization.service';
import type { EnterpriseScope } from './enterprise-scope';

const DELEGATION_CAPABILITY = 'delegation.manage';
const EMERGENCY_CAPABILITY = 'emergency_access.manage';

@Injectable()
export class AccessGrantsService {
  constructor(
    private readonly repository: AccessGrantsRepository,
    private readonly audit: AuditWriterService,
    private readonly authorization: AuthorizationService,
    private readonly config: ConfigService,
  ) {}

  async listSubstitutions(scope: EnterpriseScope, principal: AuthenticatedPrincipal) {
    this.requireScope(scope, principal, DELEGATION_CAPABILITY);
    await this.expireSubstitutions(scope, principal);
    return this.repository.listSubstitutions(scope);
  }

  async createSubstitution(
    scope: EnterpriseScope,
    principal: AuthenticatedPrincipal,
    dto: CreateSubstitutionDto,
  ) {
    this.requireScope(scope, principal, DELEGATION_CAPABILITY);
    if (dto.holderUserId === dto.substituteUserId) {
      throw new BadRequestException('Titular e substituto devem ser diferentes');
    }
    if (dto.expiresAt <= dto.startsAt) throw new BadRequestException('Vigência inválida');
    return this.audit.transaction(async (tx) => {
      const now = new Date();
      const members = await this.repository.activeMembershipUserIds(
        scope,
        [dto.holderUserId, dto.substituteUserId],
        now,
        tx,
      );
      if (!members.has(dto.holderUserId) || !members.has(dto.substituteUserId)) {
        throw new NotFoundException('Usuário não encontrado');
      }
      const permitted = await this.repository.resolveUserCapabilities(
        scope,
        dto.holderUserId,
        now,
        tx,
      );
      if (dto.capabilities.some((capability) => !permitted.has(capability))) {
        throw new BadRequestException('Substituição contém capability não pertencente ao titular');
      }
      const created = await this.repository.createSubstitution(
        scope,
        {
          holderUserId: dto.holderUserId,
          substituteUserId: dto.substituteUserId,
          grantedByUserId: principal.actorId,
          capabilities: [...new Set(dto.capabilities)].sort(),
          startsAt: dto.startsAt,
          expiresAt: dto.expiresAt,
          reason: dto.reason,
        },
        tx,
      );
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

  async revokeSubstitution(
    scope: EnterpriseScope,
    principal: AuthenticatedPrincipal,
    id: string,
    reason: string,
  ) {
    this.requireScope(scope, principal, DELEGATION_CAPABILITY);
    return this.audit.transaction(async (tx) => {
      const current = await this.repository.findActiveSubstitution(scope, id, tx);
      if (!current) throw new NotFoundException('Concessão não encontrada');
      const next = await this.repository.revokeSubstitution(
        scope,
        id,
        {
          status: 'REVOKED',
          revokedAt: new Date(),
          revokedByUserId: principal.actorId,
          revocationReason: reason,
        },
        tx,
      );
      if (!next) throw new NotFoundException('Concessão não encontrada');
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

  async listEmergencyAccesses(scope: EnterpriseScope, principal: AuthenticatedPrincipal) {
    this.requireScope(scope, principal, EMERGENCY_CAPABILITY);
    await this.expireEmergencyAccesses(scope, principal);
    return this.repository.listEmergencyAccesses(scope);
  }

  async grantEmergencyAccess(
    scope: EnterpriseScope,
    principal: AuthenticatedPrincipal,
    dto: GrantEmergencyAccessDto,
  ) {
    this.requireScope(scope, principal, EMERGENCY_CAPABILITY);
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
    return this.audit.transaction(async (tx) => {
      const members = await this.repository.activeMembershipUserIds(
        scope,
        [dto.beneficiaryUserId],
        now,
        tx,
      );
      if (!members.has(dto.beneficiaryUserId)) {
        throw new NotFoundException('Usuário não encontrado');
      }
      await this.assertKnownCapabilities(dto.capabilities, tx);
      const created = await this.repository.createEmergencyAccess(
        scope,
        {
          beneficiaryUserId: dto.beneficiaryUserId,
          grantedByUserId: principal.actorId,
          capabilities: [...new Set(dto.capabilities)].sort(),
          startsAt: now,
          expiresAt: dto.expiresAt,
          reason: dto.reason,
        },
        tx,
      );
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

  async revokeEmergencyAccess(
    scope: EnterpriseScope,
    principal: AuthenticatedPrincipal,
    id: string,
    reason: string,
  ) {
    this.requireScope(scope, principal, EMERGENCY_CAPABILITY);
    return this.audit.transaction(async (tx) => {
      const current = await this.repository.findActiveEmergencyAccess(scope, id, tx);
      if (!current) throw new NotFoundException('Concessão não encontrada');
      const next = await this.repository.revokeEmergencyAccess(
        scope,
        id,
        {
          status: 'REVOKED',
          revokedAt: new Date(),
          revokedByUserId: principal.actorId,
          revocationReason: reason,
        },
        tx,
      );
      if (!next) throw new NotFoundException('Concessão não encontrada');
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

  private requireScope(
    scope: EnterpriseScope,
    principal: AuthenticatedPrincipal,
    capability: string,
  ): void {
    this.authorization.requireCapability(principal, capability);
    if (
      !principal.activeCompanyId ||
      principal.activeCompanyId !== scope.companyId ||
      principal.actorId !== scope.actorId
    ) {
      throw new NotFoundException('Empresa não encontrada');
    }
  }

  private async assertKnownCapabilities(
    capabilities: string[],
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const count = await this.repository.countActiveCompanyCapabilities(capabilities, tx);
    if (count !== new Set(capabilities).size)
      throw new BadRequestException('Capability desconhecida');
  }

  private async expireSubstitutions(scope: EnterpriseScope, principal: AuthenticatedPrincipal) {
    await this.audit.transaction(async (tx) => {
      const expired = await this.repository.findExpiredSubstitutions(scope, new Date(), tx);
      for (const grant of expired) {
        const next = await this.repository.expireSubstitution(scope, grant.id, tx);
        if (!next) continue;
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

  private async expireEmergencyAccesses(scope: EnterpriseScope, principal: AuthenticatedPrincipal) {
    await this.audit.transaction(async (tx) => {
      const expired = await this.repository.findExpiredEmergencyAccesses(scope, new Date(), tx);
      for (const grant of expired) {
        const next = await this.repository.expireEmergencyAccess(scope, grant.id, tx);
        if (!next) continue;
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

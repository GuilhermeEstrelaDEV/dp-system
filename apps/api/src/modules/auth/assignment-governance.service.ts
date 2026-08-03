import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AssignmentSourceType, Prisma } from '@prisma/client';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { AuditWriterService } from './audit-writer.service';
import type { EnterpriseScope } from './enterprise-scope';

interface AssignmentProvenance {
  sourceType: AssignmentSourceType;
  sourceId?: string;
  reason: string;
  importBatchId?: string;
  approvedByUserId?: string;
  approvalReference?: string;
  validFrom: Date;
  validTo?: Date;
}

export interface CreateRolePermissionAssignment extends AssignmentProvenance {
  roleId: string;
  permissionId: string;
}

export interface CreateUserCompanyRoleAssignment extends AssignmentProvenance {
  userId: string;
  roleId: string;
}

@Injectable()
export class AssignmentGovernanceService {
  constructor(private readonly audit: AuditWriterService) {}

  createRolePermission(input: CreateRolePermissionAssignment, principal: AuthenticatedPrincipal) {
    this.assertInput(input);
    return this.runTransaction(async (tx) => {
      await this.assertRolePermissionTargets(tx, input);
      const assignment = await tx.rolePermission.create({
        data: { ...input, correlationId: principal.traceId, assignedByUserId: principal.actorId },
      });
      await this.audit.append(
        {
          principal,
          action: 'ROLE_PERMISSION_ASSIGNED',
          entityType: 'RolePermission',
          entityId: assignment.id,
          nextState: this.snapshot(assignment),
          reason: input.reason,
          metadata: { source: input.sourceType },
        },
        tx,
      );
      return assignment;
    });
  }

  createUserCompanyRole(
    scope: EnterpriseScope,
    input: CreateUserCompanyRoleAssignment,
    principal: AuthenticatedPrincipal,
  ) {
    this.assertInput(input);
    this.assertScope(scope, principal);
    return this.runTransaction(async (tx) => {
      await this.assertUserCompanyRoleTargets(tx, scope, input);
      const assignment = await tx.userCompanyRole.create({
        data: {
          ...input,
          companyId: scope.companyId,
          correlationId: principal.traceId,
          assignedByUserId: principal.actorId,
        },
      });
      await this.audit.append(
        {
          principal,
          action: 'USER_COMPANY_ROLE_ASSIGNED',
          entityType: 'UserCompanyRole',
          entityId: assignment.id,
          nextState: this.snapshot(assignment),
          reason: input.reason,
          metadata: { source: input.sourceType },
        },
        tx,
      );
      return assignment;
    });
  }

  revokeRolePermission(
    id: string,
    reason: string,
    principal: AuthenticatedPrincipal,
    revokedAt = new Date(),
  ) {
    this.assertRevocationReason(reason);
    return this.runTransaction(async (tx) => {
      const current = await tx.rolePermission.findFirst({ where: { id, status: 'ACTIVE' } });
      if (!current) throw new NotFoundException('Assignment não encontrado');
      const assignment = await tx.rolePermission.update({
        where: { id },
        data: {
          status: 'REVOKED',
          revokedAt,
          revokedByUserId: principal.actorId,
          revokeReason: reason,
        },
      });
      await this.audit.append(
        {
          principal,
          action: 'ROLE_PERMISSION_REVOKED',
          entityType: 'RolePermission',
          entityId: id,
          previousState: this.snapshot(current),
          nextState: this.snapshot(assignment),
          reason,
        },
        tx,
      );
      return assignment;
    });
  }

  revokeUserCompanyRole(
    scope: EnterpriseScope,
    id: string,
    reason: string,
    principal: AuthenticatedPrincipal,
    revokedAt = new Date(),
  ) {
    this.assertRevocationReason(reason);
    this.assertScope(scope, principal);
    return this.runTransaction(async (tx) => {
      const current = await tx.userCompanyRole.findFirst({
        where: { id, companyId: scope.companyId, status: 'ACTIVE' },
      });
      if (!current) throw new NotFoundException('Assignment não encontrado');
      const affected = await tx.userCompanyRole.updateMany({
        where: { id, companyId: scope.companyId, status: 'ACTIVE' },
        data: {
          status: 'REVOKED',
          revokedAt,
          revokedByUserId: principal.actorId,
          revokeReason: reason,
        },
      });
      if (affected.count !== 1) throw new NotFoundException('Assignment não encontrado');
      const assignment = await tx.userCompanyRole.findFirst({
        where: { id, companyId: scope.companyId },
      });
      if (!assignment) throw new NotFoundException('Assignment não encontrado');
      await this.audit.append(
        {
          principal,
          action: 'USER_COMPANY_ROLE_REVOKED',
          entityType: 'UserCompanyRole',
          entityId: id,
          previousState: this.snapshot(current),
          nextState: this.snapshot(assignment),
          reason,
        },
        tx,
      );
      return assignment;
    });
  }

  private assertInput(input: AssignmentProvenance): void {
    if (!input.reason.trim()) {
      throw new BadRequestException('Proveniência do assignment é obrigatória');
    }
    if (input.sourceType === 'MIGRATION') {
      throw new BadRequestException('MIGRATION is reserved for controlled backfill');
    }
    if (input.sourceType === 'IMPORT' && !input.importBatchId?.trim()) {
      throw new BadRequestException('Import batch is required');
    }
    if (input.sourceType === 'SYSTEM' && !input.sourceId?.trim()) {
      throw new BadRequestException('System source is required');
    }
    if (input.validTo && input.validTo <= input.validFrom) {
      throw new BadRequestException('Vigência do assignment é inválida');
    }
  }

  private async assertRolePermissionTargets(
    tx: Prisma.TransactionClient,
    input: CreateRolePermissionAssignment,
  ): Promise<void> {
    const [role, permission, approver] = await Promise.all([
      tx.role.findUnique({ where: { id: input.roleId }, select: { id: true } }),
      tx.permission.findFirst({
        where: { id: input.permissionId, status: 'ACTIVE' },
        select: { id: true },
      }),
      input.approvedByUserId
        ? tx.user.findFirst({
            where: { id: input.approvedByUserId, status: 'ACTIVE' },
            select: { id: true },
          })
        : Promise.resolve({ id: 'not-required' }),
    ]);
    if (!role) throw new NotFoundException('Role not found');
    if (!permission) throw new NotFoundException('Active capability not found');
    if (!approver) throw new NotFoundException('Active approver not found');
  }

  private async assertUserCompanyRoleTargets(
    tx: Prisma.TransactionClient,
    scope: EnterpriseScope,
    input: CreateUserCompanyRoleAssignment,
  ): Promise<void> {
    const [user, company, role, approver] = await Promise.all([
      tx.user.findFirst({ where: { id: input.userId, status: 'ACTIVE' }, select: { id: true } }),
      tx.company.findFirst({
        where: { id: scope.companyId, status: 'ACTIVE' },
        select: { id: true },
      }),
      tx.role.findUnique({ where: { id: input.roleId }, select: { id: true } }),
      input.approvedByUserId
        ? tx.user.findFirst({
            where: { id: input.approvedByUserId, status: 'ACTIVE' },
            select: { id: true },
          })
        : Promise.resolve({ id: 'not-required' }),
    ]);
    if (!user) throw new NotFoundException('Active user not found');
    if (!company) throw new NotFoundException('Active company not found');
    if (!role) throw new NotFoundException('Role not found');
    if (!approver) throw new NotFoundException('Active approver not found');
  }

  private async runTransaction<T>(work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    try {
      return await this.audit.transaction(work, { isolationLevel: 'Serializable' });
    } catch (error: unknown) {
      if (this.isConcurrencyConflict(error)) {
        throw new ConflictException('Concurrent assignment conflict');
      }
      throw error;
    }
  }

  private isConcurrencyConflict(error: unknown): boolean {
    if (!error || typeof error !== 'object' || !('code' in error)) return false;
    const code = (error as { code?: unknown }).code;
    return code === 'P2002' || code === 'P2004' || code === 'P2034';
  }

  private assertRevocationReason(reason: string): void {
    if (!reason.trim()) throw new BadRequestException('Motivo da revogação é obrigatório');
  }

  private assertScope(scope: EnterpriseScope, principal: AuthenticatedPrincipal): void {
    if (
      !principal.activeCompanyId ||
      principal.activeCompanyId !== scope.companyId ||
      principal.actorId !== scope.actorId
    ) {
      throw new NotFoundException('Empresa não encontrada');
    }
  }

  private snapshot(value: object): Prisma.InputJsonObject {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonObject;
  }
}

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { AssignmentSourceType, Prisma } from '@prisma/client';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { AuditWriterService } from './audit-writer.service';

interface AssignmentProvenance {
  sourceType: AssignmentSourceType;
  sourceId?: string;
  reason: string;
  correlationId: string;
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
  companyId: string;
  roleId: string;
}

@Injectable()
export class AssignmentGovernanceService {
  constructor(private readonly audit: AuditWriterService) {}

  createRolePermission(input: CreateRolePermissionAssignment, principal: AuthenticatedPrincipal) {
    this.assertInput(input);
    return this.audit.transaction(async (tx) => {
      const assignment = await tx.rolePermission.create({
        data: { ...input, assignedByUserId: principal.actorId },
      });
      await this.audit.append(
        {
          principal,
          action: 'ROLE_PERMISSION_ASSIGNED',
          entityType: 'RolePermission',
          entityId: assignment.id,
          nextState: this.snapshot(assignment),
          reason: input.reason,
          metadata: { sourceType: input.sourceType },
        },
        tx,
      );
      return assignment;
    });
  }

  createUserCompanyRole(input: CreateUserCompanyRoleAssignment, principal: AuthenticatedPrincipal) {
    this.assertInput(input);
    return this.audit.transaction(async (tx) => {
      const assignment = await tx.userCompanyRole.create({
        data: { ...input, assignedByUserId: principal.actorId },
      });
      await this.audit.append(
        {
          principal: { ...principal, activeCompanyId: input.companyId },
          action: 'USER_COMPANY_ROLE_ASSIGNED',
          entityType: 'UserCompanyRole',
          entityId: assignment.id,
          nextState: this.snapshot(assignment),
          reason: input.reason,
          metadata: { sourceType: input.sourceType },
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
    return this.audit.transaction(async (tx) => {
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
    id: string,
    reason: string,
    principal: AuthenticatedPrincipal,
    revokedAt = new Date(),
  ) {
    this.assertRevocationReason(reason);
    return this.audit.transaction(async (tx) => {
      const current = await tx.userCompanyRole.findFirst({ where: { id, status: 'ACTIVE' } });
      if (!current) throw new NotFoundException('Assignment não encontrado');
      const assignment = await tx.userCompanyRole.update({
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
          principal: { ...principal, activeCompanyId: current.companyId },
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
    if (!input.reason.trim() || !input.correlationId.trim()) {
      throw new BadRequestException('Proveniência do assignment é obrigatória');
    }
    if (input.validTo && input.validTo <= input.validFrom) {
      throw new BadRequestException('Vigência do assignment é inválida');
    }
  }

  private assertRevocationReason(reason: string): void {
    if (!reason.trim()) throw new BadRequestException('Motivo da revogação é obrigatório');
  }

  private snapshot(value: object): Prisma.InputJsonObject {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonObject;
  }
}

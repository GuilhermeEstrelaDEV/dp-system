import type { AssignmentStatus, Prisma } from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service';
import type { DemoAccessAssignment, DemoAccessRepository } from './demo-access-tool';

export class PrismaDemoAccessRepository implements DemoAccessRepository {
  constructor(private readonly prisma: PrismaService) {}

  findRole(code: string) {
    return this.prisma.role.findUnique({ where: { code }, select: { id: true, code: true } });
  }

  findActiveActor(email: string) {
    return this.prisma.user.findFirst({
      where: { email, status: 'ACTIVE' },
      select: { id: true },
    });
  }

  findActivePermissions(codes: readonly string[]) {
    return this.prisma.permission.findMany({
      where: { code: { in: [...codes] }, status: 'ACTIVE' },
      select: { id: true, code: true },
      orderBy: { code: 'asc' },
    });
  }

  countCapabilityCatalog() {
    return this.prisma.permission.count();
  }

  findCurrentAssignments(input: {
    readonly roleId: string;
    readonly permissionIds: readonly string[];
    readonly sourceId: string;
    readonly at: Date;
  }) {
    return this.findAssignments({
      roleId: input.roleId,
      permissionId: { in: [...input.permissionIds] },
      sourceId: input.sourceId,
      status: 'ACTIVE',
      revokedAt: null,
      validFrom: { lte: input.at },
      validTo: { gt: input.at },
    });
  }

  findSourceAssignments(input: { readonly roleId: string; readonly sourceId: string }) {
    return this.findAssignments({ roleId: input.roleId, sourceId: input.sourceId });
  }

  private findAssignments(where: Prisma.RolePermissionWhereInput) {
    return this.prisma.rolePermission.findMany({
      where,
      select: {
        id: true,
        status: true,
        sourceType: true,
        validFrom: true,
        validTo: true,
        role: { select: { code: true } },
        permission: { select: { code: true } },
      },
      orderBy: [{ permission: { code: 'asc' } }, { createdAt: 'asc' }],
    }) as Promise<readonly (DemoAccessAssignment & { status: AssignmentStatus })[]>;
  }
}

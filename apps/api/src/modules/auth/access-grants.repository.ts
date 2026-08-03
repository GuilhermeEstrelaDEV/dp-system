import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { EnterpriseScope } from './enterprise-scope';

type TransactionClient = Prisma.TransactionClient;
type SubstitutionCreateData = Omit<Prisma.TemporarySubstitutionUncheckedCreateInput, 'companyId'>;
type EmergencyCreateData = Omit<Prisma.EmergencyAccessUncheckedCreateInput, 'companyId'>;

@Injectable()
export class AccessGrantsRepository {
  constructor(private readonly prisma: PrismaService) {}

  listSubstitutions(scope: EnterpriseScope) {
    return this.prisma.temporarySubstitution.findMany({
      where: { companyId: scope.companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  listEmergencyAccesses(scope: EnterpriseScope) {
    return this.prisma.emergencyAccess.findMany({
      where: { companyId: scope.companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  createSubstitution(
    scope: EnterpriseScope,
    data: SubstitutionCreateData,
    client: TransactionClient,
  ) {
    return client.temporarySubstitution.create({
      data: { ...data, companyId: scope.companyId },
    });
  }

  createEmergencyAccess(
    scope: EnterpriseScope,
    data: EmergencyCreateData,
    client: TransactionClient,
  ) {
    return client.emergencyAccess.create({
      data: { ...data, companyId: scope.companyId },
    });
  }

  findActiveSubstitution(scope: EnterpriseScope, id: string, client: TransactionClient) {
    return client.temporarySubstitution.findFirst({
      where: { id, companyId: scope.companyId, status: 'ACTIVE' },
    });
  }

  findActiveEmergencyAccess(scope: EnterpriseScope, id: string, client: TransactionClient) {
    return client.emergencyAccess.findFirst({
      where: { id, companyId: scope.companyId, status: 'ACTIVE' },
    });
  }

  async revokeSubstitution(
    scope: EnterpriseScope,
    id: string,
    data: Prisma.TemporarySubstitutionUncheckedUpdateManyInput,
    client: TransactionClient,
  ) {
    const affected = await client.temporarySubstitution.updateMany({
      where: { id, companyId: scope.companyId, status: 'ACTIVE' },
      data,
    });
    if (affected.count !== 1) return null;
    return client.temporarySubstitution.findFirst({ where: { id, companyId: scope.companyId } });
  }

  async revokeEmergencyAccess(
    scope: EnterpriseScope,
    id: string,
    data: Prisma.EmergencyAccessUncheckedUpdateManyInput,
    client: TransactionClient,
  ) {
    const affected = await client.emergencyAccess.updateMany({
      where: { id, companyId: scope.companyId, status: 'ACTIVE' },
      data,
    });
    if (affected.count !== 1) return null;
    return client.emergencyAccess.findFirst({ where: { id, companyId: scope.companyId } });
  }

  findExpiredSubstitutions(scope: EnterpriseScope, now: Date, client: TransactionClient) {
    return client.temporarySubstitution.findMany({
      where: { companyId: scope.companyId, status: 'ACTIVE', expiresAt: { lte: now } },
    });
  }

  findExpiredEmergencyAccesses(scope: EnterpriseScope, now: Date, client: TransactionClient) {
    return client.emergencyAccess.findMany({
      where: { companyId: scope.companyId, status: 'ACTIVE', expiresAt: { lte: now } },
    });
  }

  expireSubstitution(scope: EnterpriseScope, id: string, client: TransactionClient) {
    return this.revokeSubstitution(scope, id, { status: 'EXPIRED' }, client);
  }

  expireEmergencyAccess(scope: EnterpriseScope, id: string, client: TransactionClient) {
    return this.revokeEmergencyAccess(scope, id, { status: 'EXPIRED' }, client);
  }

  async activeMembershipUserIds(
    scope: EnterpriseScope,
    userIds: readonly string[],
    now: Date,
    client: TransactionClient,
  ): Promise<ReadonlySet<string>> {
    const assignments = await client.userCompanyRole.findMany({
      where: {
        companyId: scope.companyId,
        userId: { in: [...new Set(userIds)] },
        status: 'ACTIVE',
        validFrom: { lte: now },
        OR: [{ validTo: null }, { validTo: { gt: now } }],
        user: { status: 'ACTIVE' },
        company: { status: 'ACTIVE' },
      },
      select: { userId: true },
    });
    return new Set(assignments.map(({ userId }) => userId));
  }

  async resolveUserCapabilities(
    scope: EnterpriseScope,
    userId: string,
    now: Date,
    client: TransactionClient,
  ): Promise<ReadonlySet<string>> {
    const assignments = await client.userCompanyRole.findMany({
      where: {
        userId,
        companyId: scope.companyId,
        status: 'ACTIVE',
        validFrom: { lte: now },
        OR: [{ validTo: null }, { validTo: { gt: now } }],
        user: { status: 'ACTIVE' },
        company: { status: 'ACTIVE' },
      },
      select: {
        role: {
          select: {
            permissions: {
              where: {
                status: 'ACTIVE',
                validFrom: { lte: now },
                OR: [{ validTo: null }, { validTo: { gt: now } }],
                permission: { status: 'ACTIVE', scope: 'COMPANY' },
              },
              select: { permission: { select: { code: true } } },
            },
          },
        },
      },
    });
    return new Set(
      assignments.flatMap(({ role }) => role.permissions.map(({ permission }) => permission.code)),
    );
  }

  countActiveCompanyCapabilities(codes: readonly string[], client: TransactionClient) {
    return client.permission.count({
      where: {
        code: { in: [...new Set(codes)] },
        status: 'ACTIVE',
        scope: 'COMPANY',
      },
    });
  }
}

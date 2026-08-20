import { randomUUID } from 'node:crypto';
import type { AssignmentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../src/prisma/prisma.service';
import { AssignmentGovernanceService } from '../src/modules/auth/assignment-governance.service';
import { AuditWriterService } from '../src/modules/auth/audit-writer.service';
import {
  DEMO_ACCESS_SOURCE_ID,
  DemoAccessTool,
  assertDemoAccessEnvironment,
  type DemoAccessAssignment,
  type DemoAccessRepository,
} from '../src/demo-access/demo-access-tool';

const command = process.argv[2];

class PrismaDemoAccessRepository implements DemoAccessRepository {
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

function printGrant(results: Awaited<ReturnType<DemoAccessTool['grant']>>) {
  for (const result of results) {
    console.log(`${result.code}: ${result.result} (validTo=${result.validTo.toISOString()})`);
  }
  console.log(`Manual demo grants considered: ${results.length}`);
}

function printStatus(results: Awaited<ReturnType<DemoAccessTool['status']>>) {
  if (results.length === 0) {
    console.log('No ESSENTIAL-MVP-DEMO-ACCESS assignments found.');
    return;
  }
  console.table(
    results.map((result) => ({
      role: result.role,
      permissionCode: result.permissionCode,
      status: result.status,
      sourceType: result.sourceType,
      validFrom: result.validFrom.toISOString(),
      validTo: result.validTo?.toISOString() ?? 'none',
      expired: result.expired ? 'yes' : 'no',
    })),
  );
}

function printRevoke(results: Awaited<ReturnType<DemoAccessTool['revoke']>>) {
  for (const result of results) console.log(`${result.code}: ${result.result}`);
  console.log(`Source ${DEMO_ACCESS_SOURCE_ID} processed; history preserved.`);
}

async function main() {
  assertDemoAccessEnvironment(process.env);
  if (!['grant', 'status', 'revoke'].includes(command ?? '')) {
    throw new Error('Comando inválido. Use grant, status ou revoke.');
  }
  const prisma = new PrismaService();
  await prisma.$connect();
  try {
    const tool = new DemoAccessTool({
      repository: new PrismaDemoAccessRepository(prisma),
      governance: new AssignmentGovernanceService(new AuditWriterService(prisma)),
      now: () => new Date(),
      correlationId: randomUUID,
    });
    if (command === 'grant') printGrant(await tool.grant(process.env));
    if (command === 'status') printStatus(await tool.status(process.env));
    if (command === 'revoke') printRevoke(await tool.revoke(process.env));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Operação local-demo recusada');
  process.exitCode = 1;
});

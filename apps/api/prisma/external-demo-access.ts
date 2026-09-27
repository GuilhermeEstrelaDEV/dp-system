import { randomUUID } from 'node:crypto';
import { PrismaService } from '../src/prisma/prisma.service';
import { DemoAccessTool } from '../src/demo-access/demo-access-tool';
import { externalDemoAccessProfile } from '../src/demo-access/external-demo-access-profile';
import { assertExternalDemoEnvironment } from '../src/demo-access/external-demo-environment';
import { PrismaDemoAccessRepository } from '../src/demo-access/prisma-demo-access.repository';
import { AssignmentGovernanceService } from '../src/modules/auth/assignment-governance.service';
import { AuditWriterService } from '../src/modules/auth/audit-writer.service';

const command = process.argv[2];

function printGrant(results: Awaited<ReturnType<DemoAccessTool['grant']>>): void {
  for (const result of results) {
    console.log(`${result.code}: ${result.result} (validTo=${result.validTo.toISOString()})`);
  }
  console.log(`Manual external demo grants considered: ${results.length}`);
}

function printStatus(results: Awaited<ReturnType<DemoAccessTool['status']>>): void {
  if (results.length === 0) {
    console.log('No external demo reviewer assignments found.');
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

function printRevoke(results: Awaited<ReturnType<DemoAccessTool['revoke']>>): void {
  for (const result of results) console.log(`${result.code}: ${result.result}`);
  console.log('External demo reviewer access processed; assignment history preserved.');
}

async function main(): Promise<void> {
  assertExternalDemoEnvironment(process.env);
  if (!['grant', 'status', 'revoke'].includes(command ?? '')) {
    throw new Error('Comando inválido. Use grant, status ou revoke.');
  }
  const prisma = new PrismaService();
  await prisma.$connect();
  try {
    const tool = new DemoAccessTool(
      {
        repository: new PrismaDemoAccessRepository(prisma),
        governance: new AssignmentGovernanceService(new AuditWriterService(prisma)),
        now: () => new Date(),
        correlationId: randomUUID,
      },
      externalDemoAccessProfile(process.env),
    );
    if (command === 'grant') printGrant(await tool.grant(process.env));
    if (command === 'status') printStatus(await tool.status(process.env));
    if (command === 'revoke') printRevoke(await tool.revoke(process.env));
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Operação de acesso externo recusada');
  process.exitCode = 1;
});

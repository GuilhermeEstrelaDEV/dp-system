import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('external demo operational contract', () => {
  const rootPackage = readFileSync(resolve(__dirname, '../../../../../package.json'), 'utf8');
  const seedSource = readFileSync(resolve(__dirname, '../../../prisma/demo-seed.ts'), 'utf8');
  const reviewerSource = readFileSync(
    resolve(__dirname, '../../../prisma/external-demo-reviewer.ts'),
    'utf8',
  );
  const accessSource = readFileSync(
    resolve(__dirname, '../../../prisma/external-demo-access.ts'),
    'utf8',
  );

  it('keeps the external seed separate and explicitly gated', () => {
    expect(seedSource).toContain("process.argv.includes('--external-demo')");
    expect(seedSource).toContain('assertExternalDemoEnvironment');
    expect(seedSource).toContain('externalSeedActors');
    expect(seedSource).not.toContain('rolePermission.create');
    expect(seedSource).not.toContain('rolePermission.upsert');
    expect(rootPackage).toContain(
      'external-demo:gate && pnpm prisma:seed && pnpm --filter @dp-system/api prisma:seed:external-demo',
    );
  });

  it('provisions the reviewer without printing a password or hash', () => {
    expect(reviewerSource).toContain('requireExternalReviewerCredentials');
    expect(reviewerSource).toContain('passwords.hash(password)');
    expect(reviewerSource).toContain('senha não exibida');
    expect(reviewerSource).not.toMatch(/console\.(log|error)\([^\n]*(password|passwordHash)/u);
  });

  it('uses governed assignment operations for external access', () => {
    expect(accessSource).toContain('AssignmentGovernanceService');
    expect(accessSource).toContain('DemoAccessTool');
    expect(accessSource).not.toContain('rolePermission.create');
    expect(accessSource).not.toContain('platform.manage');
  });
});

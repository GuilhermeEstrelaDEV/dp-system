import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('local demo seed contract', () => {
  const source = readFileSync(resolve(__dirname, '../../../prisma/demo-seed.ts'), 'utf8');

  it('is gated to the explicit local demo environment', () => {
    expect(source).toContain("DEMO_ENV !== 'local-demo'");
    expect(source).toContain("DEMO_MODE !== 'true'");
    expect(source).toContain("DEMO_SEED_ENABLED !== 'true'");
    expect(source).toContain("NODE_ENV === 'production'");
    expect(source).toContain("database.pathname !== '/dp_system_demo'");
  });

  it('uses real password hashing and creates no permission grants', () => {
    expect(source).toContain('PasswordHasherService');
    expect(source).toContain('passwords.hash');
    expect(source).not.toContain('rolePermission.create');
    expect(source).not.toContain('rolePermission.upsert');
  });

  it('contains only the approved administrator and HR demo profiles', () => {
    expect(source).toContain("roleCode: 'ADMINISTRATOR'");
    expect(source).toContain("roleCode: 'HR'");
    expect(source).not.toContain("roleCode: 'MANAGER'");
    expect(source).toContain('userCompanyRole.create');
  });

  it('uses deterministic identifiers and never removes existing records', () => {
    expect(source).toContain("horizon: '10000000-0000-4000-8000-000000000001'");
    expect(source).toContain("admin: '20000000-0000-4000-8000-000000000001'");
    expect(source).toContain("referenceDate = new Date('2026-07-01T00:00:00.000Z')");
    expect(source).not.toMatch(/\.(delete|deleteMany)\(/u);
    expect(source).not.toContain('TRUNCATE');
  });

  it('creates dashboard records without assignments or hardcoded aggregates', () => {
    expect(source).toContain('payrollReviewCycle.upsert');
    expect(source).toContain('payrollReviewFinding.upsert');
    expect(source).toContain('payrollReviewEvent.createMany');
    expect(source).toContain('payrollPeriod.upsert');
    expect(source).not.toContain('rolePermission.create');
    expect(source).not.toContain('rolePermission.upsert');
  });
});

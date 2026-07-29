import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('local demo seed contract', () => {
  const source = readFileSync(resolve(__dirname, '../../../prisma/demo-seed.ts'), 'utf8');

  it('is gated to the explicit local demo environment', () => {
    expect(source).toContain("DEMO_ENV !== 'local-demo'");
    expect(source).toContain("DEMO_SEED_ENABLED !== 'true'");
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
});

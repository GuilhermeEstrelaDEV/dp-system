import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('ETP-015.3 migration contract', () => {
  const migration = readFileSync(
    resolve(
      __dirname,
      '../../../prisma/migrations/0016_capability_catalog_assignments/migration.sql',
    ),
    'utf8',
  );
  const seed = readFileSync(resolve(__dirname, '../../../prisma/seed.ts'), 'utf8');

  it('contains every approved capability once in the seed and explicit classification backfill', () => {
    const codes = [
      'platform.read',
      'platform.manage',
      'delegation.manage',
      'emergency_access.manage',
      'payroll.review.view',
      'payroll.review.create',
      'payroll.review.finding.create',
      'payroll.review.finding.resolve',
      'payroll.review.finding.reopen',
      'payroll.review.submit',
      'payroll.review.approve',
      'payroll.review.reject',
      'payroll.review.close',
      'payroll.review.reopen',
      'payroll.period.close.view',
      'payroll.period.close.readiness',
      'payroll.period.close.execute',
      'payroll.period.close.reopen',
      'payroll.period.close.history',
    ];
    expect(codes).toHaveLength(19);
    for (const code of codes) {
      expect(seed.match(new RegExp(`'${code.replaceAll('.', '\\.')}'`, 'g'))).toHaveLength(1);
      expect(migration).toContain(`('${code}',`);
    }
  });

  it('fails closed and creates no assignment or grant during migration and seed', () => {
    expect(migration).toContain('permission inventory differs from the 19 approved codes');
    expect(migration).toContain('role_permissions_no_temporal_overlap');
    expect(migration).toContain('user_company_roles_no_temporal_overlap');
    expect(migration).not.toMatch(/INSERT\s+INTO\s+"?(role_permissions|user_company_roles)"?/i);
    expect(seed).not.toMatch(/rolePermission\.(create|upsert)/);
    expect(seed).not.toMatch(/userCompanyRole\.(create|upsert)/);
  });
});

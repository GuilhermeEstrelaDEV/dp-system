import type { AssignmentSourceType } from '@prisma/client';
import {
  DEMO_ACCESS_CAPABILITIES,
  DEMO_ACCESS_DURATION_MS,
  DEMO_ACCESS_SOURCE_ID,
  DemoAccessTool,
  assertDemoAccessEnvironment,
  type DemoAccessAssignment,
  type DemoAccessDependencies,
  type DemoAccessRepository,
} from './demo-access-tool';

const now = new Date('2026-08-20T12:00:00.000Z');
const validEnvironment = {
  DEMO_ENV: 'local-demo',
  DEMO_MODE: 'true',
  DEMO_SEED_ENABLED: 'true',
  NODE_ENV: 'development',
  DATABASE_URL: 'postgresql://demo:demo@localhost:55432/dp_system_demo?schema=public',
};

function assignment(
  code: string,
  status: DemoAccessAssignment['status'] = 'ACTIVE',
  sourceType: AssignmentSourceType = 'MANUAL',
): DemoAccessAssignment {
  return {
    id: `assignment-${code}`,
    status,
    sourceType,
    validFrom: now,
    validTo: new Date(now.getTime() + DEMO_ACCESS_DURATION_MS),
    role: { code: 'ADMINISTRATOR' },
    permission: { code },
  };
}

function dependencies(overrides: Partial<DemoAccessRepository> = {}): DemoAccessDependencies & {
  governance: {
    createRolePermission: jest.Mock;
    revokeRolePermission: jest.Mock;
  };
  repository: DemoAccessRepository;
} {
  const permissions = DEMO_ACCESS_CAPABILITIES.map((code, index) => ({
    id: `permission-${index + 1}`,
    code,
  }));
  const repository: DemoAccessRepository = {
    findRole: jest.fn().mockResolvedValue({ id: 'role-admin', code: 'ADMINISTRATOR' }),
    findActiveActor: jest.fn().mockResolvedValue({ id: 'admin-user' }),
    findActivePermissions: jest.fn().mockResolvedValue(permissions),
    countCapabilityCatalog: jest.fn().mockResolvedValue(37),
    findCurrentAssignments: jest.fn().mockResolvedValue([]),
    findSourceAssignments: jest.fn().mockResolvedValue([]),
    ...overrides,
  };
  return {
    repository,
    governance: {
      createRolePermission: jest.fn().mockResolvedValue({ id: 'assignment' }),
      revokeRolePermission: jest.fn().mockResolvedValue({ status: 'REVOKED' }),
    },
    now: () => now,
    correlationId: () => '00000000-0000-4000-8000-000000000001',
  };
}

describe('DemoAccessTool local-only gate', () => {
  it('refuses execution outside the explicit local-demo mode', () => {
    expect(() => assertDemoAccessEnvironment({ ...validEnvironment, DEMO_MODE: 'false' })).toThrow(
      'modo local demonstrativo não confirmado',
    );
  });

  it('refuses production even when every demo flag is present', () => {
    expect(() =>
      assertDemoAccessEnvironment({ ...validEnvironment, NODE_ENV: 'production' }),
    ).toThrow('ambiente de produção');
  });

  it.each([
    'postgresql://demo:demo@localhost:55432/other_database',
    'postgresql://demo:demo@db.example.test:5432/dp_system_demo',
  ])('refuses a database outside the exact local dp_system_demo target', (databaseUrl) => {
    expect(() =>
      assertDemoAccessEnvironment({ ...validEnvironment, DATABASE_URL: databaseUrl }),
    ).toThrow('banco local dp_system_demo não confirmado');
  });
});

describe('DemoAccessTool grants', () => {
  it('creates exactly sixteen manual, temporary and approved RolePermission assignments', async () => {
    const deps = dependencies();
    const tool = new DemoAccessTool(deps);

    const results = await tool.grant(validEnvironment);

    expect(results).toHaveLength(24);
    expect(deps.governance.createRolePermission).toHaveBeenCalledTimes(24);
    for (const [input, principal] of deps.governance.createRolePermission.mock.calls as Array<
      [
        {
          sourceType: string;
          sourceId: string;
          validFrom: Date;
          validTo: Date;
          permissionId: string;
          roleId: string;
        },
        { actorId: string; activeCompanyId: string | null; permissions: readonly string[] },
      ]
    >) {
      expect(input).toMatchObject({
        sourceType: 'MANUAL',
        sourceId: DEMO_ACCESS_SOURCE_ID,
        roleId: 'role-admin',
      });
      expect(input.validTo.getTime() - input.validFrom.getTime()).toBe(DEMO_ACCESS_DURATION_MS);
      expect(principal).toMatchObject({
        actorId: 'admin-user',
        activeCompanyId: null,
        permissions: [],
      });
    }
  });

  it('reports already active without creating duplicates on a second execution', async () => {
    const deps = dependencies({
      findCurrentAssignments: jest
        .fn()
        .mockResolvedValue(DEMO_ACCESS_CAPABILITIES.map((code) => assignment(code))),
    });

    const results = await new DemoAccessTool(deps).grant(validEnvironment);

    expect(results).toHaveLength(24);
    expect(results.every(({ result }) => result === 'ALREADY ACTIVE')).toBe(true);
    expect(deps.governance.createRolePermission).not.toHaveBeenCalled();
  });

  it('fails closed when the capability catalog is not exactly the approved 37 entries', async () => {
    const deps = dependencies({ countCapabilityCatalog: jest.fn().mockResolvedValue(30) });

    await expect(new DemoAccessTool(deps).grant(validEnvironment)).rejects.toThrow(
      'catálogo esperado=37, encontrado=30',
    );
    expect(deps.governance.createRolePermission).not.toHaveBeenCalled();
  });
});

describe('DemoAccessTool status and revocation', () => {
  it('returns only non-sensitive status for the approved assignments', async () => {
    const deps = dependencies({
      findSourceAssignments: jest
        .fn()
        .mockResolvedValue(DEMO_ACCESS_CAPABILITIES.map((code) => assignment(code))),
    });

    const results = await new DemoAccessTool(deps).status(validEnvironment);

    expect(results).toHaveLength(24);
    expect(results[0]).toEqual(
      expect.objectContaining({
        role: 'ADMINISTRATOR',
        status: 'ACTIVE',
        sourceType: 'MANUAL',
        expired: false,
      }),
    );
    expect(Object.keys(results[0] ?? {})).toEqual([
      'role',
      'permissionCode',
      'status',
      'sourceType',
      'validFrom',
      'validTo',
      'expired',
    ]);
  });

  it('revokes only active approved-source capabilities and preserves rows through governance', async () => {
    const deps = dependencies({
      findSourceAssignments: jest
        .fn()
        .mockResolvedValue([
          ...DEMO_ACCESS_CAPABILITIES.map((code) => assignment(code)),
          assignment('platform.manage'),
          assignment('payroll.review.create', 'REVOKED'),
        ]),
    });

    const results = await new DemoAccessTool(deps).revoke(validEnvironment);

    expect(results).toHaveLength(24);
    expect(results.every(({ result }) => result === 'REVOKED')).toBe(true);
    expect(deps.governance.revokeRolePermission).toHaveBeenCalledTimes(24);
    expect(deps.governance.revokeRolePermission).not.toHaveBeenCalledWith(
      'assignment-platform.manage',
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );
    expect(deps.repository.findSourceAssignments).toHaveBeenCalledWith({
      roleId: 'role-admin',
      sourceId: DEMO_ACCESS_SOURCE_ID,
    });
  });
});

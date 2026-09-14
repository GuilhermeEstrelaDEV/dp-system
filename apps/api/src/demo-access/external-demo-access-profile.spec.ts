import {
  DEMO_ACCESS_CAPABILITIES,
  DEMO_ACCESS_DURATION_MS,
  DemoAccessTool,
} from './demo-access-tool';
import {
  EXTERNAL_DEMO_ACCESS_SOURCE_ID,
  externalDemoAccessProfile,
} from './external-demo-access-profile';

const now = new Date('2026-09-14T12:00:00.000Z');
const environment = {
  NODE_ENV: 'production',
  DEPLOYMENT_ENV: 'external-demo',
  EXTERNAL_DEMO_MODE: 'true',
  DEMO_ENV: 'external-demo',
  DEMO_MODE: 'true',
  DEMO_SEED_ENABLED: 'true',
  EXTERNAL_DEMO_CONFIRM_DATABASE: 'dp_system_external_demo',
  DATABASE_URL: 'postgresql://external_demo@private-db.example:5432/dp_system_external_demo',
  EXTERNAL_DEMO_REVIEWER_EMAIL: 'reviewer.demo@dp-system.local',
  EXTERNAL_DEMO_REVIEWER_PASSWORD: 'x'.repeat(20),
};

describe('external demo access profile', () => {
  it('creates only the approved manual and temporary grants', async () => {
    const createRolePermission = jest.fn().mockResolvedValue({ id: 'assignment' });
    const dependencies = {
      repository: {
        findRole: jest.fn().mockResolvedValue({ id: 'role-admin', code: 'ADMINISTRATOR' }),
        findActiveActor: jest.fn().mockResolvedValue({ id: 'reviewer-user' }),
        findActivePermissions: jest.fn().mockResolvedValue(
          DEMO_ACCESS_CAPABILITIES.map((code, index) => ({
            id: `permission-${index + 1}`,
            code,
          })),
        ),
        countCapabilityCatalog: jest.fn().mockResolvedValue(48),
        findCurrentAssignments: jest.fn().mockResolvedValue([]),
        findSourceAssignments: jest.fn().mockResolvedValue([]),
      },
      governance: {
        createRolePermission,
        revokeRolePermission: jest.fn(),
      },
      now: () => now,
      correlationId: () => '00000000-0000-4000-8000-000000000099',
    };

    const results = await new DemoAccessTool(
      dependencies,
      externalDemoAccessProfile(environment),
    ).grant(environment);

    expect(results).toHaveLength(35);
    expect(createRolePermission).toHaveBeenCalledTimes(35);
    for (const [input] of createRolePermission.mock.calls as Array<
      [{ sourceType: string; sourceId: string; validFrom: Date; validTo: Date }]
    >) {
      expect(input.sourceType).toBe('MANUAL');
      expect(input.sourceId).toBe(EXTERNAL_DEMO_ACCESS_SOURCE_ID);
      expect(input.validTo.getTime() - input.validFrom.getTime()).toBe(DEMO_ACCESS_DURATION_MS);
    }
  });
});

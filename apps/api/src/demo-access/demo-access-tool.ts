import type { AssignmentSourceType } from '@prisma/client';
import type { AuthenticatedPrincipal } from '../modules/auth/identity-context';
import type { CreateRolePermissionAssignment } from '../modules/auth/assignment-governance.service';

export const DEMO_ACCESS_ROLE = 'ADMINISTRATOR';
export const DEMO_ACCESS_SOURCE_ID = 'ESSENTIAL-MVP-DEMO-ACCESS';
export const DEMO_ACCESS_APPROVAL_REFERENCE = 'ESSENTIAL-MVP-DELIVERY-2026-08-20';
export const DEMO_ACCESS_REASON =
  'Acesso temporário e fictício autorizado exclusivamente para demonstração local do MVP essencial';
export const DEMO_ACCESS_REVOKE_REASON = 'Revogação do acesso temporário da demonstração MVP';
export const DEMO_ACCESS_DURATION_MS = 8 * 60 * 60 * 1_000;
export const DEMO_ACCESS_CAPABILITIES = Object.freeze([
  'payroll.review.view',
  'payroll.period.close.view',
  'payroll.period.close.readiness',
  'payroll.period.close.history',
  'payroll.period.close.execute',
  'payroll.period.close.reopen',
  'company.read',
  'company.manage',
  'employee.read',
  'employee.manage',
  'contract.read',
  'contract.manage',
  'payroll.parameter.read',
  'payroll.parameter.manage',
  'payroll.rubric.read',
  'payroll.rubric.manage',
  'organization.read',
  'organization.manage',
  'admission.read',
  'admission.manage',
  'leave.read',
  'leave.manage',
  'variable_compensation.read',
  'variable_compensation.manage',
  'time.read',
  'time.manage',
  'benefit.read',
  'benefit.manage',
  'vacation.read',
  'vacation.manage',
] as const);

const DEMO_ADMIN_EMAIL = 'admin.demo@dp-system.local';
const EXPECTED_CAPABILITY_CATALOG_SIZE = 43;

export interface DemoAccessEnvironment {
  readonly DEMO_ENV?: string;
  readonly DEMO_MODE?: string;
  readonly DEMO_SEED_ENABLED?: string;
  readonly NODE_ENV?: string;
  readonly DATABASE_URL?: string;
}

export interface DemoAccessRole {
  readonly id: string;
  readonly code: string;
}

export interface DemoAccessPermission {
  readonly id: string;
  readonly code: string;
}

export interface DemoAccessActor {
  readonly id: string;
}

export interface DemoAccessAssignment {
  readonly id: string;
  readonly status: 'ACTIVE' | 'INACTIVE' | 'REVOKED' | 'EXPIRED';
  readonly sourceType: AssignmentSourceType;
  readonly validFrom: Date;
  readonly validTo: Date | null;
  readonly role: { readonly code: string };
  readonly permission: { readonly code: string };
}

export interface DemoAccessRepository {
  findRole(code: string): Promise<DemoAccessRole | null>;
  findActiveActor(email: string): Promise<DemoAccessActor | null>;
  findActivePermissions(codes: readonly string[]): Promise<readonly DemoAccessPermission[]>;
  countCapabilityCatalog(): Promise<number>;
  findCurrentAssignments(input: {
    readonly roleId: string;
    readonly permissionIds: readonly string[];
    readonly sourceId: string;
    readonly at: Date;
  }): Promise<readonly DemoAccessAssignment[]>;
  findSourceAssignments(input: {
    readonly roleId: string;
    readonly sourceId: string;
  }): Promise<readonly DemoAccessAssignment[]>;
}

export interface DemoAssignmentGovernance {
  createRolePermission(
    input: CreateRolePermissionAssignment,
    principal: AuthenticatedPrincipal,
  ): Promise<unknown>;
  revokeRolePermission(
    id: string,
    reason: string,
    principal: AuthenticatedPrincipal,
    revokedAt?: Date,
  ): Promise<unknown>;
}

export interface DemoAccessDependencies {
  readonly repository: DemoAccessRepository;
  readonly governance: DemoAssignmentGovernance;
  readonly now: () => Date;
  readonly correlationId: () => string;
}

export interface DemoAccessGrantResult {
  readonly code: string;
  readonly result: 'CREATED' | 'ALREADY ACTIVE';
  readonly validTo: Date;
}

export interface DemoAccessStatusResult {
  readonly role: string;
  readonly permissionCode: string;
  readonly status: DemoAccessAssignment['status'];
  readonly sourceType: AssignmentSourceType;
  readonly validFrom: Date;
  readonly validTo: Date | null;
  readonly expired: boolean;
}

export interface DemoAccessRevokeResult {
  readonly code: string;
  readonly result: 'REVOKED' | 'NOT ACTIVE';
}

export function assertDemoAccessEnvironment(environment: DemoAccessEnvironment): void {
  if (
    environment.DEMO_ENV !== 'local-demo' ||
    environment.DEMO_MODE !== 'true' ||
    environment.DEMO_SEED_ENABLED !== 'true'
  ) {
    throw new Error('Acesso demo recusado: modo local demonstrativo não confirmado');
  }
  if (environment.NODE_ENV === 'production') {
    throw new Error('Acesso demo recusado: ambiente de produção');
  }
  if (!environment.DATABASE_URL) {
    throw new Error('Acesso demo recusado: DATABASE_URL ausente');
  }
  let database: URL;
  try {
    database = new URL(environment.DATABASE_URL);
  } catch {
    throw new Error('Acesso demo recusado: DATABASE_URL inválida');
  }
  if (
    !['localhost', '127.0.0.1'].includes(database.hostname) ||
    database.pathname !== '/dp_system_demo'
  ) {
    throw new Error('Acesso demo recusado: banco local dp_system_demo não confirmado');
  }
}

export class DemoAccessTool {
  constructor(private readonly dependencies: DemoAccessDependencies) {}

  async grant(environment: DemoAccessEnvironment): Promise<readonly DemoAccessGrantResult[]> {
    assertDemoAccessEnvironment(environment);
    const now = this.dependencies.now();
    const validTo = new Date(now.getTime() + DEMO_ACCESS_DURATION_MS);
    const { role, actor, permissions } = await this.resolveTargets();
    const active = await this.dependencies.repository.findCurrentAssignments({
      roleId: role.id,
      permissionIds: permissions.map(({ id }) => id),
      sourceId: DEMO_ACCESS_SOURCE_ID,
      at: now,
    });
    const activeCodes = new Set(active.map(({ permission }) => permission.code));
    const principal = this.principal(actor.id, this.dependencies.correlationId());
    const results: DemoAccessGrantResult[] = [];

    for (const permission of permissions) {
      if (activeCodes.has(permission.code)) {
        const assignment = active.find(
          ({ permission: current }) => current.code === permission.code,
        );
        if (!assignment?.validTo) {
          throw new Error(`Assignment temporário inválido para ${permission.code}`);
        }
        results.push({
          code: permission.code,
          result: 'ALREADY ACTIVE',
          validTo: assignment.validTo,
        });
        continue;
      }
      await this.dependencies.governance.createRolePermission(
        {
          roleId: role.id,
          permissionId: permission.id,
          sourceType: 'MANUAL',
          sourceId: DEMO_ACCESS_SOURCE_ID,
          reason: DEMO_ACCESS_REASON,
          approvedByUserId: actor.id,
          approvalReference: DEMO_ACCESS_APPROVAL_REFERENCE,
          validFrom: now,
          validTo,
        },
        principal,
      );
      results.push({ code: permission.code, result: 'CREATED', validTo });
    }
    return results;
  }

  async status(environment: DemoAccessEnvironment): Promise<readonly DemoAccessStatusResult[]> {
    assertDemoAccessEnvironment(environment);
    const role = await this.requireRole();
    await this.assertCatalog();
    const now = this.dependencies.now();
    const assignments = await this.dependencies.repository.findSourceAssignments({
      roleId: role.id,
      sourceId: DEMO_ACCESS_SOURCE_ID,
    });
    return assignments
      .filter(({ permission }) =>
        DEMO_ACCESS_CAPABILITIES.includes(
          permission.code as (typeof DEMO_ACCESS_CAPABILITIES)[number],
        ),
      )
      .map((assignment) => ({
        role: assignment.role.code,
        permissionCode: assignment.permission.code,
        status: assignment.status,
        sourceType: assignment.sourceType,
        validFrom: assignment.validFrom,
        validTo: assignment.validTo,
        expired: assignment.validTo !== null && assignment.validTo <= now,
      }));
  }

  async revoke(environment: DemoAccessEnvironment): Promise<readonly DemoAccessRevokeResult[]> {
    assertDemoAccessEnvironment(environment);
    const role = await this.requireRole();
    await this.assertCatalog();
    const assignments = await this.dependencies.repository.findSourceAssignments({
      roleId: role.id,
      sourceId: DEMO_ACCESS_SOURCE_ID,
    });
    const now = this.dependencies.now();
    const principal = this.principal(
      (await this.requireActor()).id,
      this.dependencies.correlationId(),
    );
    const results: DemoAccessRevokeResult[] = [];

    for (const capability of DEMO_ACCESS_CAPABILITIES) {
      const assignment = assignments.find(
        ({ permission, status }) => permission.code === capability && status === 'ACTIVE',
      );
      if (!assignment) {
        results.push({ code: capability, result: 'NOT ACTIVE' });
        continue;
      }
      await this.dependencies.governance.revokeRolePermission(
        assignment.id,
        DEMO_ACCESS_REVOKE_REASON,
        principal,
        now,
      );
      results.push({ code: capability, result: 'REVOKED' });
    }
    return results;
  }

  private async resolveTargets(): Promise<{
    role: DemoAccessRole;
    actor: DemoAccessActor;
    permissions: readonly DemoAccessPermission[];
  }> {
    const [role, actor, permissions] = await Promise.all([
      this.requireRole(),
      this.requireActor(),
      this.dependencies.repository.findActivePermissions(DEMO_ACCESS_CAPABILITIES),
      this.assertCatalog(),
    ]);
    const byCode = new Map(permissions.map((permission) => [permission.code, permission]));
    const ordered = DEMO_ACCESS_CAPABILITIES.map((code) => byCode.get(code));
    if (ordered.some((permission) => !permission)) {
      throw new Error('Acesso demo recusado: catálogo não contém as capabilities aprovadas');
    }
    return {
      role,
      actor,
      permissions: ordered as readonly DemoAccessPermission[],
    };
  }

  private async requireRole(): Promise<DemoAccessRole> {
    const role = await this.dependencies.repository.findRole(DEMO_ACCESS_ROLE);
    if (!role) throw new Error('Acesso demo recusado: papel ADMINISTRATOR não encontrado');
    return role;
  }

  private async requireActor(): Promise<DemoAccessActor> {
    const actor = await this.dependencies.repository.findActiveActor(DEMO_ADMIN_EMAIL);
    if (!actor) throw new Error('Acesso demo recusado: Administrador Demo ativo não encontrado');
    return actor;
  }

  private async assertCatalog(): Promise<void> {
    const count = await this.dependencies.repository.countCapabilityCatalog();
    if (count !== EXPECTED_CAPABILITY_CATALOG_SIZE) {
      throw new Error(
        `Acesso demo recusado: catálogo esperado=${EXPECTED_CAPABILITY_CATALOG_SIZE}, encontrado=${count}`,
      );
    }
  }

  private principal(actorId: string, correlationId: string): AuthenticatedPrincipal {
    return {
      actorId,
      activeCompanyId: null,
      sessionId: `local-demo-${correlationId}`,
      traceId: correlationId,
      ipAddress: '127.0.0.1',
      userAgent: 'dp-system-demo-access-tool',
      permissions: [],
      accessGrants: [],
    };
  }
}

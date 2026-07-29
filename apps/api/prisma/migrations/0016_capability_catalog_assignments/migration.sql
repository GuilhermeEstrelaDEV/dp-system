CREATE EXTENSION IF NOT EXISTS "btree_gist";

CREATE TYPE "AssignmentSourceType" AS ENUM ('MIGRATION', 'ADMINISTRATION', 'IMPORT', 'SYSTEM', 'MANUAL');
CREATE TYPE "AssignmentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'REVOKED', 'EXPIRED');
CREATE TYPE "PermissionScope" AS ENUM ('PLATFORM', 'COMPANY');
CREATE TYPE "PermissionRiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "PermissionSensitivity" AS ENUM ('STANDARD', 'SENSITIVE', 'RESTRICTED');
CREATE TYPE "PermissionStatus" AS ENUM ('ACTIVE', 'DEPRECATED', 'RETIRED');

-- PC-20/PC-21: upgrades fail closed before any catalog data is changed. A clean
-- database is allowed to remain empty until the approved seed is executed.
DO $$
DECLARE
  actual_codes TEXT[];
  approved_codes CONSTANT TEXT[] := ARRAY[
    'delegation.manage',
    'emergency_access.manage',
    'payroll.period.close.execute',
    'payroll.period.close.history',
    'payroll.period.close.readiness',
    'payroll.period.close.reopen',
    'payroll.period.close.view',
    'payroll.review.approve',
    'payroll.review.close',
    'payroll.review.create',
    'payroll.review.finding.create',
    'payroll.review.finding.reopen',
    'payroll.review.finding.resolve',
    'payroll.review.reject',
    'payroll.review.reopen',
    'payroll.review.submit',
    'payroll.review.view',
    'platform.manage',
    'platform.read'
  ]::TEXT[];
BEGIN
  SELECT COALESCE(array_agg(code ORDER BY code), ARRAY[]::TEXT[])
    INTO actual_codes
    FROM permissions;

  IF cardinality(actual_codes) > 0 AND actual_codes <> approved_codes THEN
    RAISE EXCEPTION USING
      MESSAGE = 'ETP-015.3 blocked: permission inventory differs from the 19 approved codes',
      DETAIL = format('actual=%s approved=%s', actual_codes, approved_codes),
      HINT = 'Classify and homologate every missing or additional code before retrying the migration.';
  END IF;

  IF EXISTS (SELECT 1 FROM permissions WHERE description IS NULL) THEN
    RAISE EXCEPTION 'ETP-015.3 blocked: approved permission has no description';
  END IF;
END $$;

ALTER TABLE "permissions"
  ADD COLUMN "name" VARCHAR(120),
  ADD COLUMN "resource" VARCHAR(80),
  ADD COLUMN "action" VARCHAR(50),
  ADD COLUMN "scope" "PermissionScope",
  ADD COLUMN "risk_level" "PermissionRiskLevel",
  ADD COLUMN "sensitivity" "PermissionSensitivity",
  ADD COLUMN "status" "PermissionStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "introduced_at" TIMESTAMPTZ(6),
  ADD COLUMN "deprecated_at" TIMESTAMPTZ(6),
  ADD COLUMN "retired_at" TIMESTAMPTZ(6),
  ADD COLUMN "replacement_capability_id" UUID,
  ADD COLUMN "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb;

WITH approved(code, resource, action, scope, risk_level, sensitivity) AS (
  VALUES
    ('platform.read', 'platform', 'read', 'PLATFORM', 'MEDIUM', 'SENSITIVE'),
    ('platform.manage', 'platform', 'manage', 'PLATFORM', 'CRITICAL', 'RESTRICTED'),
    ('delegation.manage', 'delegation', 'manage', 'COMPANY', 'CRITICAL', 'RESTRICTED'),
    ('emergency_access.manage', 'emergency_access', 'manage', 'COMPANY', 'CRITICAL', 'RESTRICTED'),
    ('payroll.review.view', 'payroll.review', 'view', 'COMPANY', 'MEDIUM', 'RESTRICTED'),
    ('payroll.review.create', 'payroll.review', 'create', 'COMPANY', 'HIGH', 'RESTRICTED'),
    ('payroll.review.finding.create', 'payroll.review.finding', 'create', 'COMPANY', 'HIGH', 'RESTRICTED'),
    ('payroll.review.finding.resolve', 'payroll.review.finding', 'resolve', 'COMPANY', 'HIGH', 'RESTRICTED'),
    ('payroll.review.finding.reopen', 'payroll.review.finding', 'reopen', 'COMPANY', 'HIGH', 'RESTRICTED'),
    ('payroll.review.submit', 'payroll.review', 'submit', 'COMPANY', 'HIGH', 'RESTRICTED'),
    ('payroll.review.approve', 'payroll.review', 'approve', 'COMPANY', 'CRITICAL', 'RESTRICTED'),
    ('payroll.review.reject', 'payroll.review', 'reject', 'COMPANY', 'HIGH', 'RESTRICTED'),
    ('payroll.review.close', 'payroll.review', 'close', 'COMPANY', 'CRITICAL', 'RESTRICTED'),
    ('payroll.review.reopen', 'payroll.review', 'reopen', 'COMPANY', 'CRITICAL', 'RESTRICTED'),
    ('payroll.period.close.view', 'payroll.period.close', 'view', 'COMPANY', 'MEDIUM', 'RESTRICTED'),
    ('payroll.period.close.readiness', 'payroll.period.close', 'readiness', 'COMPANY', 'MEDIUM', 'RESTRICTED'),
    ('payroll.period.close.execute', 'payroll.period.close', 'execute', 'COMPANY', 'CRITICAL', 'RESTRICTED'),
    ('payroll.period.close.reopen', 'payroll.period.close', 'reopen', 'COMPANY', 'CRITICAL', 'RESTRICTED'),
    ('payroll.period.close.history', 'payroll.period.close', 'history', 'COMPANY', 'MEDIUM', 'RESTRICTED')
)
UPDATE "permissions" AS permission
SET
  "name" = permission."code",
  "resource" = approved.resource,
  "action" = approved.action,
  "scope" = approved.scope::"PermissionScope",
  "risk_level" = approved.risk_level::"PermissionRiskLevel",
  "sensitivity" = approved.sensitivity::"PermissionSensitivity",
  "introduced_at" = permission."created_at"
FROM approved
WHERE permission."code" = approved.code;

ALTER TABLE "permissions"
  ALTER COLUMN "name" SET NOT NULL,
  ALTER COLUMN "description" TYPE VARCHAR(500),
  ALTER COLUMN "description" SET NOT NULL,
  ALTER COLUMN "resource" SET NOT NULL,
  ALTER COLUMN "action" SET NOT NULL,
  ALTER COLUMN "scope" SET NOT NULL,
  ALTER COLUMN "risk_level" SET NOT NULL,
  ALTER COLUMN "sensitivity" SET NOT NULL,
  ALTER COLUMN "introduced_at" SET NOT NULL,
  ALTER COLUMN "introduced_at" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "permissions"
  ADD CONSTRAINT "permissions_code_format_check" CHECK ("code" ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$'),
  ADD CONSTRAINT "permissions_lifecycle_check" CHECK (
    ("status" = 'ACTIVE' AND "deprecated_at" IS NULL AND "retired_at" IS NULL) OR
    ("status" = 'DEPRECATED' AND "deprecated_at" IS NOT NULL AND "retired_at" IS NULL) OR
    ("status" = 'RETIRED' AND "deprecated_at" IS NOT NULL AND "retired_at" IS NOT NULL AND "retired_at" >= "deprecated_at")
  ),
  ADD CONSTRAINT "permissions_replacement_not_self_check" CHECK ("replacement_capability_id" IS NULL OR "replacement_capability_id" <> "id"),
  ADD CONSTRAINT "permissions_replacement_capability_id_fkey" FOREIGN KEY ("replacement_capability_id") REFERENCES "permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "permissions_resource_action_status_idx" ON "permissions"("resource", "action", "status");
CREATE INDEX "permissions_scope_status_idx" ON "permissions"("scope", "status");
CREATE INDEX "permissions_risk_level_sensitivity_status_idx" ON "permissions"("risk_level", "sensitivity", "status");

ALTER TABLE "role_permissions"
  ADD COLUMN "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN "assigned_at" TIMESTAMPTZ(6),
  ADD COLUMN "assigned_by_user_id" UUID,
  ADD COLUMN "source_type" "AssignmentSourceType",
  ADD COLUMN "source_id" VARCHAR(160),
  ADD COLUMN "reason" VARCHAR(1000),
  ADD COLUMN "correlation_id" VARCHAR(100),
  ADD COLUMN "import_batch_id" VARCHAR(100),
  ADD COLUMN "approved_by_user_id" UUID,
  ADD COLUMN "approval_reference" VARCHAR(255),
  ADD COLUMN "valid_from" TIMESTAMPTZ(6),
  ADD COLUMN "valid_to" TIMESTAMPTZ(6),
  ADD COLUMN "status" "AssignmentStatus",
  ADD COLUMN "revoked_at" TIMESTAMPTZ(6),
  ADD COLUMN "revoked_by_user_id" UUID,
  ADD COLUMN "revoke_reason" VARCHAR(1000),
  ADD COLUMN "replacement_assignment_id" UUID;

UPDATE "role_permissions"
SET
  "assigned_at" = "created_at",
  "source_type" = 'MIGRATION',
  "source_id" = '0016_capability_catalog_assignments',
  "reason" = 'LEGACY_BACKFILL',
  "correlation_id" = '0016_capability_catalog_assignments',
  "valid_from" = "created_at",
  "status" = 'ACTIVE';

ALTER TABLE "role_permissions"
  ALTER COLUMN "assigned_at" SET NOT NULL,
  ALTER COLUMN "assigned_at" SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "source_type" SET NOT NULL,
  ALTER COLUMN "reason" SET NOT NULL,
  ALTER COLUMN "correlation_id" SET NOT NULL,
  ALTER COLUMN "valid_from" SET NOT NULL,
  ALTER COLUMN "valid_from" SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "status" SET NOT NULL,
  ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_pkey";
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id");
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_role_id_fkey";
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_permission_id_fkey";
ALTER TABLE "role_permissions"
  ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "role_permissions_assigned_by_user_id_fkey" FOREIGN KEY ("assigned_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "role_permissions_approved_by_user_id_fkey" FOREIGN KEY ("approved_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "role_permissions_revoked_by_user_id_fkey" FOREIGN KEY ("revoked_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "role_permissions_replacement_assignment_id_fkey" FOREIGN KEY ("replacement_assignment_id") REFERENCES "role_permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "role_permissions_validity_check" CHECK ("valid_to" IS NULL OR "valid_to" > "valid_from"),
  ADD CONSTRAINT "role_permissions_revocation_check" CHECK (
    ("status" = 'REVOKED' AND "revoked_at" IS NOT NULL AND "revoke_reason" IS NOT NULL) OR
    ("status" <> 'REVOKED' AND "revoked_at" IS NULL AND "revoked_by_user_id" IS NULL AND "revoke_reason" IS NULL)
  ),
  ADD CONSTRAINT "role_permissions_expiration_check" CHECK ("status" <> 'EXPIRED' OR "valid_to" IS NOT NULL),
  ADD CONSTRAINT "role_permissions_replacement_not_self_check" CHECK ("replacement_assignment_id" IS NULL OR "replacement_assignment_id" <> "id"),
  ADD CONSTRAINT "role_permissions_no_temporal_overlap" EXCLUDE USING gist (
    "role_id" WITH =,
    "permission_id" WITH =,
    tstzrange("valid_from", COALESCE("valid_to", 'infinity'::timestamptz), '[)') WITH &&
  ) WHERE ("status" = 'ACTIVE' AND "revoked_at" IS NULL);

CREATE INDEX "role_permissions_role_id_status_valid_from_valid_to_idx" ON "role_permissions"("role_id", "status", "valid_from", "valid_to");
CREATE INDEX "role_permissions_permission_id_status_valid_from_valid_to_idx" ON "role_permissions"("permission_id", "status", "valid_from", "valid_to");
CREATE INDEX "role_permissions_assigned_by_user_id_idx" ON "role_permissions"("assigned_by_user_id");
CREATE INDEX "role_permissions_approved_by_user_id_idx" ON "role_permissions"("approved_by_user_id");
CREATE INDEX "role_permissions_revoked_by_user_id_idx" ON "role_permissions"("revoked_by_user_id");

ALTER TABLE "user_company_roles"
  ADD COLUMN "assigned_at" TIMESTAMPTZ(6),
  ADD COLUMN "assigned_by_user_id" UUID,
  ADD COLUMN "source_type" "AssignmentSourceType",
  ADD COLUMN "source_id" VARCHAR(160),
  ADD COLUMN "reason" VARCHAR(1000),
  ADD COLUMN "correlation_id" VARCHAR(100),
  ADD COLUMN "import_batch_id" VARCHAR(100),
  ADD COLUMN "approved_by_user_id" UUID,
  ADD COLUMN "approval_reference" VARCHAR(255),
  ADD COLUMN "revoked_at" TIMESTAMPTZ(6),
  ADD COLUMN "revoked_by_user_id" UUID,
  ADD COLUMN "revoke_reason" VARCHAR(1000),
  ADD COLUMN "replacement_assignment_id" UUID;

DROP INDEX "user_company_roles_active_assignment_key";
ALTER TABLE "user_company_roles" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "user_company_roles"
  ALTER COLUMN "status" TYPE "AssignmentStatus" USING "status"::text::"AssignmentStatus";
ALTER TABLE "user_company_roles" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
DROP TYPE "UserCompanyRoleStatus";

UPDATE "user_company_roles"
SET
  "assigned_at" = "created_at",
  "source_type" = 'MIGRATION',
  "source_id" = '0016_capability_catalog_assignments',
  "reason" = 'LEGACY_BACKFILL',
  "correlation_id" = '0016_capability_catalog_assignments';

ALTER TABLE "user_company_roles"
  ALTER COLUMN "assigned_at" SET NOT NULL,
  ALTER COLUMN "assigned_at" SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "source_type" SET NOT NULL,
  ALTER COLUMN "reason" SET NOT NULL,
  ALTER COLUMN "correlation_id" SET NOT NULL;

ALTER TABLE "user_company_roles"
  ADD CONSTRAINT "user_company_roles_assigned_by_user_id_fkey" FOREIGN KEY ("assigned_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "user_company_roles_approved_by_user_id_fkey" FOREIGN KEY ("approved_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "user_company_roles_revoked_by_user_id_fkey" FOREIGN KEY ("revoked_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "user_company_roles_replacement_assignment_id_fkey" FOREIGN KEY ("replacement_assignment_id") REFERENCES "user_company_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "user_company_roles_revocation_check" CHECK (
    ("status" = 'REVOKED' AND "revoked_at" IS NOT NULL AND "revoke_reason" IS NOT NULL) OR
    ("status" <> 'REVOKED' AND "revoked_at" IS NULL AND "revoked_by_user_id" IS NULL AND "revoke_reason" IS NULL)
  ),
  ADD CONSTRAINT "user_company_roles_expiration_check" CHECK ("status" <> 'EXPIRED' OR "valid_to" IS NOT NULL),
  ADD CONSTRAINT "user_company_roles_replacement_not_self_check" CHECK ("replacement_assignment_id" IS NULL OR "replacement_assignment_id" <> "id"),
  ADD CONSTRAINT "user_company_roles_no_temporal_overlap" EXCLUDE USING gist (
    "user_id" WITH =,
    "company_id" WITH =,
    "role_id" WITH =,
    tstzrange("valid_from", COALESCE("valid_to", 'infinity'::timestamptz), '[)') WITH &&
  ) WHERE ("status" = 'ACTIVE' AND "revoked_at" IS NULL);

CREATE INDEX "user_company_roles_assigned_by_user_id_idx" ON "user_company_roles"("assigned_by_user_id");
CREATE INDEX "user_company_roles_approved_by_user_id_idx" ON "user_company_roles"("approved_by_user_id");
CREATE INDEX "user_company_roles_revoked_by_user_id_idx" ON "user_company_roles"("revoked_by_user_id");

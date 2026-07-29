-- Operational rollback rehearsal for ETP-015.3. Prisma does not execute this
-- file automatically. Run only in an approved maintenance window after the
-- preconditions below succeed.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM role_permissions GROUP BY role_id, permission_id HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Rollback blocked: role_permissions contains historical duplicate pairs';
  END IF;
  IF EXISTS (
    SELECT 1 FROM user_company_roles WHERE status::text IN ('REVOKED', 'EXPIRED')
  ) THEN
    RAISE EXCEPTION 'Rollback blocked: user_company_roles contains post-migration history';
  END IF;
  IF EXISTS (
    SELECT 1 FROM role_permissions
    WHERE source_type::text <> 'MIGRATION'
       OR source_id <> '0016_capability_catalog_assignments'
       OR reason <> 'LEGACY_BACKFILL'
  ) OR EXISTS (
    SELECT 1 FROM user_company_roles
    WHERE source_type::text <> 'MIGRATION'
       OR source_id <> '0016_capability_catalog_assignments'
       OR reason <> 'LEGACY_BACKFILL'
  ) THEN
    RAISE EXCEPTION 'Rollback blocked: assignments created or changed after migration would lose governance history';
  END IF;
END $$;

ALTER TABLE "user_company_roles" DROP CONSTRAINT "user_company_roles_no_temporal_overlap";
ALTER TABLE "user_company_roles" DROP CONSTRAINT "user_company_roles_replacement_not_self_check";
ALTER TABLE "user_company_roles" DROP CONSTRAINT "user_company_roles_expiration_check";
ALTER TABLE "user_company_roles" DROP CONSTRAINT "user_company_roles_revocation_check";
ALTER TABLE "user_company_roles" DROP CONSTRAINT "user_company_roles_replacement_assignment_id_fkey";
ALTER TABLE "user_company_roles" DROP CONSTRAINT "user_company_roles_revoked_by_user_id_fkey";
ALTER TABLE "user_company_roles" DROP CONSTRAINT "user_company_roles_approved_by_user_id_fkey";
ALTER TABLE "user_company_roles" DROP CONSTRAINT "user_company_roles_assigned_by_user_id_fkey";
DROP INDEX "user_company_roles_revoked_by_user_id_idx";
DROP INDEX "user_company_roles_approved_by_user_id_idx";
DROP INDEX "user_company_roles_assigned_by_user_id_idx";
ALTER TABLE "user_company_roles"
  DROP COLUMN "replacement_assignment_id",
  DROP COLUMN "revoke_reason",
  DROP COLUMN "revoked_by_user_id",
  DROP COLUMN "revoked_at",
  DROP COLUMN "approval_reference",
  DROP COLUMN "approved_by_user_id",
  DROP COLUMN "import_batch_id",
  DROP COLUMN "correlation_id",
  DROP COLUMN "reason",
  DROP COLUMN "source_id",
  DROP COLUMN "source_type",
  DROP COLUMN "assigned_by_user_id",
  DROP COLUMN "assigned_at";
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_no_temporal_overlap";
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_replacement_not_self_check";
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_expiration_check";
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_revocation_check";
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_validity_check";
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_replacement_assignment_id_fkey";
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_revoked_by_user_id_fkey";
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_approved_by_user_id_fkey";
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_assigned_by_user_id_fkey";
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_role_id_fkey";
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_permission_id_fkey";
DROP INDEX "role_permissions_revoked_by_user_id_idx";
DROP INDEX "role_permissions_approved_by_user_id_idx";
DROP INDEX "role_permissions_assigned_by_user_id_idx";
DROP INDEX "role_permissions_permission_id_status_valid_from_valid_to_idx";
DROP INDEX "role_permissions_role_id_status_valid_from_valid_to_idx";
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_pkey";
ALTER TABLE "role_permissions"
  DROP COLUMN "replacement_assignment_id",
  DROP COLUMN "revoke_reason",
  DROP COLUMN "revoked_by_user_id",
  DROP COLUMN "revoked_at",
  DROP COLUMN "status",
  DROP COLUMN "valid_to",
  DROP COLUMN "valid_from",
  DROP COLUMN "approval_reference",
  DROP COLUMN "approved_by_user_id",
  DROP COLUMN "import_batch_id",
  DROP COLUMN "correlation_id",
  DROP COLUMN "reason",
  DROP COLUMN "source_id",
  DROP COLUMN "source_type",
  DROP COLUMN "assigned_by_user_id",
  DROP COLUMN "assigned_at",
  DROP COLUMN "id";
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id", "permission_id");
ALTER TABLE "role_permissions"
  ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "permissions" DROP CONSTRAINT "permissions_replacement_capability_id_fkey";
ALTER TABLE "permissions" DROP CONSTRAINT "permissions_metadata_object_check";
ALTER TABLE "permissions" DROP CONSTRAINT "permissions_replacement_not_self_check";
ALTER TABLE "permissions" DROP CONSTRAINT "permissions_lifecycle_check";
ALTER TABLE "permissions" DROP CONSTRAINT "permissions_code_format_check";
DROP INDEX "permissions_risk_level_sensitivity_status_idx";
DROP INDEX "permissions_scope_status_idx";
DROP INDEX "permissions_resource_action_status_idx";
ALTER TABLE "permissions"
  ALTER COLUMN "description" DROP NOT NULL,
  ALTER COLUMN "description" TYPE VARCHAR(255),
  DROP COLUMN "metadata",
  DROP COLUMN "replacement_capability_id",
  DROP COLUMN "retired_at",
  DROP COLUMN "deprecated_at",
  DROP COLUMN "introduced_at",
  DROP COLUMN "status",
  DROP COLUMN "sensitivity",
  DROP COLUMN "risk_level",
  DROP COLUMN "scope",
  DROP COLUMN "action",
  DROP COLUMN "resource",
  DROP COLUMN "name";

ALTER TABLE "user_company_roles" ALTER COLUMN "status" DROP DEFAULT;
CREATE TYPE "UserCompanyRoleStatus" AS ENUM ('ACTIVE', 'INACTIVE');
ALTER TABLE "user_company_roles"
  ALTER COLUMN "status" TYPE "UserCompanyRoleStatus" USING "status"::text::"UserCompanyRoleStatus";
ALTER TABLE "user_company_roles" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
CREATE UNIQUE INDEX "user_company_roles_active_assignment_key"
  ON "user_company_roles"("user_id", "company_id", "role_id") WHERE "status" = 'ACTIVE';

DROP TYPE "PermissionStatus";
DROP TYPE "PermissionSensitivity";
DROP TYPE "PermissionRiskLevel";
DROP TYPE "PermissionScope";
DROP TYPE "AssignmentSourceType";
DROP TYPE "AssignmentStatus";

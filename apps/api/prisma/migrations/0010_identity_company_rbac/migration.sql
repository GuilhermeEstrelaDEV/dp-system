-- CreateEnum
CREATE TYPE "UserCompanyRoleStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN "company_id" UUID;

-- CreateTable
CREATE TABLE "user_company_roles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "status" "UserCompanyRoleStatus" NOT NULL DEFAULT 'ACTIVE',
    "valid_from" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_to" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_company_roles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "user_company_roles_validity_check" CHECK ("valid_to" IS NULL OR "valid_to" > "valid_from")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_company_roles_active_assignment_key" ON "user_company_roles"("user_id", "company_id", "role_id") WHERE "status" = 'ACTIVE';
CREATE INDEX "user_company_roles_user_id_company_id_status_idx" ON "user_company_roles"("user_id", "company_id", "status");
CREATE INDEX "user_company_roles_company_id_role_id_status_idx" ON "user_company_roles"("company_id", "role_id", "status");
CREATE INDEX "audit_logs_company_id_occurred_at_idx" ON "audit_logs"("company_id", "occurred_at");

-- AddForeignKey
ALTER TABLE "user_company_roles" ADD CONSTRAINT "user_company_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_company_roles" ADD CONSTRAINT "user_company_roles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_company_roles" ADD CONSTRAINT "user_company_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

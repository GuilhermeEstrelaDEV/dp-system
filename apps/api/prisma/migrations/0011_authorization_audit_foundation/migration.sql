CREATE TYPE "AccessGrantStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');

ALTER TABLE "audit_logs"
  ADD COLUMN "session_id" VARCHAR(100),
  ADD COLUMN "previous_state" JSONB,
  ADD COLUMN "next_state" JSONB,
  ADD COLUMN "reason" VARCHAR(1000),
  ADD COLUMN "ip_address" VARCHAR(64),
  ADD COLUMN "user_agent" VARCHAR(512);

CREATE TABLE "temporary_substitutions" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "holder_user_id" UUID NOT NULL,
  "substitute_user_id" UUID NOT NULL,
  "granted_by_user_id" UUID NOT NULL,
  "revoked_by_user_id" UUID,
  "capabilities" TEXT[] NOT NULL,
  "starts_at" TIMESTAMPTZ(6) NOT NULL,
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  "reason" VARCHAR(1000) NOT NULL,
  "status" "AccessGrantStatus" NOT NULL DEFAULT 'ACTIVE',
  "revoked_at" TIMESTAMPTZ(6),
  "revocation_reason" VARCHAR(1000),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "temporary_substitutions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "temporary_substitutions_distinct_users_check" CHECK ("holder_user_id" <> "substitute_user_id"),
  CONSTRAINT "temporary_substitutions_validity_check" CHECK ("expires_at" > "starts_at"),
  CONSTRAINT "temporary_substitutions_capabilities_check" CHECK (cardinality("capabilities") > 0)
);

CREATE TABLE "emergency_accesses" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "beneficiary_user_id" UUID NOT NULL,
  "granted_by_user_id" UUID NOT NULL,
  "revoked_by_user_id" UUID,
  "capabilities" TEXT[] NOT NULL,
  "starts_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  "reason" VARCHAR(1000) NOT NULL,
  "status" "AccessGrantStatus" NOT NULL DEFAULT 'ACTIVE',
  "revoked_at" TIMESTAMPTZ(6),
  "revocation_reason" VARCHAR(1000),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "emergency_accesses_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "emergency_accesses_distinct_users_check" CHECK ("beneficiary_user_id" <> "granted_by_user_id"),
  CONSTRAINT "emergency_accesses_validity_check" CHECK ("expires_at" > "starts_at"),
  CONSTRAINT "emergency_accesses_capabilities_check" CHECK (cardinality("capabilities") > 0)
);

CREATE INDEX "audit_logs_session_id_occurred_at_idx" ON "audit_logs"("session_id", "occurred_at");
CREATE INDEX "temporary_substitutions_company_substitute_validity_idx" ON "temporary_substitutions"("company_id", "substitute_user_id", "status", "starts_at", "expires_at");
CREATE INDEX "temporary_substitutions_company_holder_status_idx" ON "temporary_substitutions"("company_id", "holder_user_id", "status");
CREATE INDEX "emergency_accesses_company_beneficiary_validity_idx" ON "emergency_accesses"("company_id", "beneficiary_user_id", "status", "starts_at", "expires_at");

ALTER TABLE "temporary_substitutions" ADD CONSTRAINT "temporary_substitutions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "temporary_substitutions" ADD CONSTRAINT "temporary_substitutions_holder_user_id_fkey" FOREIGN KEY ("holder_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "temporary_substitutions" ADD CONSTRAINT "temporary_substitutions_substitute_user_id_fkey" FOREIGN KEY ("substitute_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "temporary_substitutions" ADD CONSTRAINT "temporary_substitutions_granted_by_user_id_fkey" FOREIGN KEY ("granted_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "temporary_substitutions" ADD CONSTRAINT "temporary_substitutions_revoked_by_user_id_fkey" FOREIGN KEY ("revoked_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "emergency_accesses" ADD CONSTRAINT "emergency_accesses_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "emergency_accesses" ADD CONSTRAINT "emergency_accesses_beneficiary_user_id_fkey" FOREIGN KEY ("beneficiary_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "emergency_accesses" ADD CONSTRAINT "emergency_accesses_granted_by_user_id_fkey" FOREIGN KEY ("granted_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "emergency_accesses" ADD CONSTRAINT "emergency_accesses_revoked_by_user_id_fkey" FOREIGN KEY ("revoked_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

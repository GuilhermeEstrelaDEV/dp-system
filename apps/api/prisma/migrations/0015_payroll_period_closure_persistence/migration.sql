CREATE TYPE "PayrollPeriodClosureStatus" AS ENUM ('OPEN', 'CLOSING', 'CLOSED', 'REOPENING');
CREATE TYPE "PayrollPeriodClosureEventType" AS ENUM (
  'PERIOD_READINESS_EVALUATED',
  'PERIOD_CLOSURE_STARTED',
  'PERIOD_CLOSED',
  'PERIOD_REOPENING_STARTED',
  'PERIOD_REOPENED',
  'CLOSURE_EVIDENCE_INVALIDATED',
  'VARIABLE_PAY_WARNING_ACKNOWLEDGED'
);
CREATE TYPE "PayrollPeriodClosureOperationType" AS ENUM ('CLOSE', 'REOPEN');
CREATE TYPE "PayrollPeriodClosureIdempotencyStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'FAILED');

CREATE TABLE "payroll_period_closure_versions" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "payroll_period_id" UUID NOT NULL,
  "version" INTEGER NOT NULL,
  "status" "PayrollPeriodClosureStatus" NOT NULL DEFAULT 'OPEN',
  "selected_payroll_run_id" UUID,
  "linked_review_cycle_id" UUID,
  "linked_review_round" INTEGER,
  "consistency_token" VARCHAR(100) NOT NULL,
  "optimistic_version" INTEGER NOT NULL DEFAULT 1,
  "previous_closure_version_id" UUID,
  "superseded_at" TIMESTAMPTZ(6),
  "created_by" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  "closed_at" TIMESTAMPTZ(6),
  "reopened_at" TIMESTAMPTZ(6),
  CONSTRAINT "payroll_period_closure_versions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payroll_period_closure_versions_version_check" CHECK ("version" > 0),
  CONSTRAINT "payroll_period_closure_versions_optimistic_check" CHECK ("optimistic_version" > 0),
  CONSTRAINT "payroll_period_closure_versions_review_round_check" CHECK ("linked_review_round" IS NULL OR "linked_review_round" > 0),
  CONSTRAINT "payroll_period_closure_versions_evidence_check" CHECK (
    ("selected_payroll_run_id" IS NULL AND "linked_review_cycle_id" IS NULL AND "linked_review_round" IS NULL)
    OR
    ("selected_payroll_run_id" IS NOT NULL AND "linked_review_cycle_id" IS NOT NULL AND "linked_review_round" IS NOT NULL)
  )
);

CREATE TABLE "payroll_period_closure_manifests" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "payroll_period_closure_id" UUID NOT NULL,
  "manifest_version" INTEGER NOT NULL,
  "payload" JSONB NOT NULL,
  "payload_hash" CHAR(64) NOT NULL,
  "hash_algorithm_version" VARCHAR(50) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by" UUID NOT NULL,
  "trace_id" VARCHAR(100) NOT NULL,
  "session_id" VARCHAR(100),
  "ip_address" VARCHAR(64),
  "user_agent" VARCHAR(512),
  CONSTRAINT "payroll_period_closure_manifests_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payroll_period_closure_manifests_version_check" CHECK ("manifest_version" > 0),
  CONSTRAINT "payroll_period_closure_manifests_hash_check" CHECK ("payload_hash" ~ '^[0-9a-f]{64}$')
);

CREATE TABLE "payroll_period_closure_events" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "payroll_period_closure_id" UUID NOT NULL,
  "event_type" "PayrollPeriodClosureEventType" NOT NULL,
  "payload" JSONB NOT NULL,
  "actor_user_id" UUID NOT NULL,
  "trace_id" VARCHAR(100) NOT NULL,
  "session_id" VARCHAR(100),
  "ip_address" VARCHAR(64),
  "user_agent" VARCHAR(512),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payroll_period_closure_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payroll_period_closure_warning_acknowledgements" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "payroll_period_closure_id" UUID NOT NULL,
  "warning_code" VARCHAR(100) NOT NULL,
  "acknowledgement_payload" JSONB NOT NULL,
  "acknowledged_by" UUID NOT NULL,
  "acknowledged_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "trace_id" VARCHAR(100) NOT NULL,
  "session_id" VARCHAR(100),
  "ip_address" VARCHAR(64),
  "user_agent" VARCHAR(512),
  CONSTRAINT "payroll_period_closure_warning_acknowledgements_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payroll_period_closure_warning_code_check" CHECK (length(trim("warning_code")) > 0)
);

CREATE TABLE "payroll_period_closure_idempotencies" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "payroll_period_id" UUID NOT NULL,
  "operation_type" "PayrollPeriodClosureOperationType" NOT NULL,
  "idempotency_key_hash" CHAR(64) NOT NULL,
  "request_fingerprint" CHAR(64) NOT NULL,
  "response_reference" VARCHAR(200),
  "status" "PayrollPeriodClosureIdempotencyStatus" NOT NULL DEFAULT 'IN_PROGRESS',
  "failure_code" VARCHAR(100),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMPTZ(6),
  CONSTRAINT "payroll_period_closure_idempotencies_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payroll_period_closure_idempotencies_key_hash_check" CHECK ("idempotency_key_hash" ~ '^[0-9a-f]{64}$'),
  CONSTRAINT "payroll_period_closure_idempotencies_fingerprint_check" CHECK ("request_fingerprint" ~ '^[0-9a-f]{64}$'),
  CONSTRAINT "payroll_period_closure_idempotencies_state_check" CHECK (
    ("status" = 'IN_PROGRESS' AND "response_reference" IS NULL AND "failure_code" IS NULL AND "completed_at" IS NULL)
    OR
    ("status" = 'COMPLETED' AND length(trim("response_reference")) > 0 AND "failure_code" IS NULL AND "completed_at" IS NOT NULL)
    OR
    ("status" = 'FAILED' AND "response_reference" IS NULL AND length(trim("failure_code")) > 0 AND "completed_at" IS NOT NULL)
  )
);

CREATE UNIQUE INDEX "payroll_period_closure_versions_company_period_version_key"
  ON "payroll_period_closure_versions"("company_id", "payroll_period_id", "version");
CREATE UNIQUE INDEX "payroll_period_closure_versions_active_key"
  ON "payroll_period_closure_versions"("company_id", "payroll_period_id") WHERE "superseded_at" IS NULL;
CREATE INDEX "payroll_period_closure_versions_company_status_idx"
  ON "payroll_period_closure_versions"("company_id", "status");
CREATE INDEX "payroll_period_closure_versions_period_created_idx"
  ON "payroll_period_closure_versions"("payroll_period_id", "created_at");
CREATE INDEX "payroll_period_closure_versions_run_idx"
  ON "payroll_period_closure_versions"("selected_payroll_run_id");
CREATE INDEX "payroll_period_closure_versions_review_idx"
  ON "payroll_period_closure_versions"("linked_review_cycle_id");
CREATE UNIQUE INDEX "payroll_period_closure_manifests_closure_version_key"
  ON "payroll_period_closure_manifests"("payroll_period_closure_id", "manifest_version");
CREATE INDEX "payroll_period_closure_manifests_company_created_idx"
  ON "payroll_period_closure_manifests"("company_id", "created_at");
CREATE INDEX "payroll_period_closure_manifests_hash_idx"
  ON "payroll_period_closure_manifests"("payload_hash");
CREATE INDEX "payroll_period_closure_events_company_created_idx"
  ON "payroll_period_closure_events"("company_id", "created_at");
CREATE INDEX "payroll_period_closure_events_closure_created_idx"
  ON "payroll_period_closure_events"("payroll_period_closure_id", "created_at");
CREATE INDEX "payroll_period_closure_events_trace_idx" ON "payroll_period_closure_events"("trace_id");
CREATE UNIQUE INDEX "payroll_period_closure_warning_closure_code_key"
  ON "payroll_period_closure_warning_acknowledgements"("payroll_period_closure_id", "warning_code");
CREATE INDEX "payroll_period_closure_warning_company_time_idx"
  ON "payroll_period_closure_warning_acknowledgements"("company_id", "acknowledged_at");
CREATE UNIQUE INDEX "payroll_period_closure_idempotency_scope_key"
  ON "payroll_period_closure_idempotencies"("company_id", "payroll_period_id", "operation_type", "idempotency_key_hash");
CREATE INDEX "payroll_period_closure_idempotency_company_status_idx"
  ON "payroll_period_closure_idempotencies"("company_id", "status", "created_at");

ALTER TABLE "payroll_period_closure_versions" ADD CONSTRAINT "payroll_period_closure_versions_company_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_period_closure_versions" ADD CONSTRAINT "payroll_period_closure_versions_period_fkey" FOREIGN KEY ("payroll_period_id") REFERENCES "payroll_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_period_closure_versions" ADD CONSTRAINT "payroll_period_closure_versions_run_fkey" FOREIGN KEY ("selected_payroll_run_id") REFERENCES "payroll_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_period_closure_versions" ADD CONSTRAINT "payroll_period_closure_versions_review_fkey" FOREIGN KEY ("linked_review_cycle_id") REFERENCES "payroll_review_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_period_closure_versions" ADD CONSTRAINT "payroll_period_closure_versions_previous_fkey" FOREIGN KEY ("previous_closure_version_id") REFERENCES "payroll_period_closure_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_period_closure_versions" ADD CONSTRAINT "payroll_period_closure_versions_creator_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "payroll_period_closure_manifests" ADD CONSTRAINT "payroll_period_closure_manifests_company_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_period_closure_manifests" ADD CONSTRAINT "payroll_period_closure_manifests_closure_fkey" FOREIGN KEY ("payroll_period_closure_id") REFERENCES "payroll_period_closure_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_period_closure_manifests" ADD CONSTRAINT "payroll_period_closure_manifests_creator_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_period_closure_events" ADD CONSTRAINT "payroll_period_closure_events_company_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_period_closure_events" ADD CONSTRAINT "payroll_period_closure_events_closure_fkey" FOREIGN KEY ("payroll_period_closure_id") REFERENCES "payroll_period_closure_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_period_closure_events" ADD CONSTRAINT "payroll_period_closure_events_actor_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_period_closure_warning_acknowledgements" ADD CONSTRAINT "payroll_period_closure_warning_company_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_period_closure_warning_acknowledgements" ADD CONSTRAINT "payroll_period_closure_warning_closure_fkey" FOREIGN KEY ("payroll_period_closure_id") REFERENCES "payroll_period_closure_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_period_closure_warning_acknowledgements" ADD CONSTRAINT "payroll_period_closure_warning_actor_fkey" FOREIGN KEY ("acknowledged_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_period_closure_idempotencies" ADD CONSTRAINT "payroll_period_closure_idempotencies_company_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_period_closure_idempotencies" ADD CONSTRAINT "payroll_period_closure_idempotencies_period_fkey" FOREIGN KEY ("payroll_period_id") REFERENCES "payroll_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE FUNCTION validate_payroll_period_closure_scope() RETURNS trigger AS $$
DECLARE
  period_company UUID;
  run_period UUID;
  review_company UUID;
  review_run UUID;
  previous_company UUID;
  previous_period UUID;
BEGIN
  SELECT "company_id" INTO period_company FROM "payroll_periods" WHERE "id" = NEW."payroll_period_id";
  IF period_company IS DISTINCT FROM NEW."company_id" THEN
    RAISE EXCEPTION 'payroll period closure company mismatch';
  END IF;

  IF NEW."selected_payroll_run_id" IS NOT NULL THEN
    SELECT "payroll_period_id" INTO run_period FROM "payroll_runs" WHERE "id" = NEW."selected_payroll_run_id";
    IF run_period IS DISTINCT FROM NEW."payroll_period_id" THEN
      RAISE EXCEPTION 'payroll period closure run mismatch';
    END IF;

    SELECT "company_id", "payroll_run_id" INTO review_company, review_run
      FROM "payroll_review_cycles" WHERE "id" = NEW."linked_review_cycle_id";
    IF review_company IS DISTINCT FROM NEW."company_id" OR review_run IS DISTINCT FROM NEW."selected_payroll_run_id" THEN
      RAISE EXCEPTION 'payroll period closure review mismatch';
    END IF;
  END IF;

  IF NEW."previous_closure_version_id" IS NOT NULL THEN
    SELECT "company_id", "payroll_period_id" INTO previous_company, previous_period
      FROM "payroll_period_closure_versions" WHERE "id" = NEW."previous_closure_version_id";
    IF previous_company IS DISTINCT FROM NEW."company_id" OR previous_period IS DISTINCT FROM NEW."payroll_period_id" THEN
      RAISE EXCEPTION 'payroll period closure predecessor mismatch';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "payroll_period_closure_scope_guard"
BEFORE INSERT OR UPDATE ON "payroll_period_closure_versions"
FOR EACH ROW EXECUTE FUNCTION validate_payroll_period_closure_scope();

CREATE FUNCTION validate_payroll_period_closure_evidence_scope() RETURNS trigger AS $$
DECLARE closure_company UUID;
BEGIN
  SELECT "company_id" INTO closure_company FROM "payroll_period_closure_versions"
    WHERE "id" = NEW."payroll_period_closure_id";
  IF closure_company IS DISTINCT FROM NEW."company_id" THEN
    RAISE EXCEPTION 'payroll period closure evidence company mismatch';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "payroll_period_closure_manifest_scope_guard"
BEFORE INSERT ON "payroll_period_closure_manifests"
FOR EACH ROW EXECUTE FUNCTION validate_payroll_period_closure_evidence_scope();
CREATE TRIGGER "payroll_period_closure_event_scope_guard"
BEFORE INSERT ON "payroll_period_closure_events"
FOR EACH ROW EXECUTE FUNCTION validate_payroll_period_closure_evidence_scope();
CREATE TRIGGER "payroll_period_closure_warning_scope_guard"
BEFORE INSERT ON "payroll_period_closure_warning_acknowledgements"
FOR EACH ROW EXECUTE FUNCTION validate_payroll_period_closure_evidence_scope();

CREATE FUNCTION validate_payroll_period_closure_idempotency_scope() RETURNS trigger AS $$
DECLARE period_company UUID;
BEGIN
  SELECT "company_id" INTO period_company FROM "payroll_periods" WHERE "id" = NEW."payroll_period_id";
  IF period_company IS DISTINCT FROM NEW."company_id" THEN
    RAISE EXCEPTION 'payroll period closure idempotency company mismatch';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "payroll_period_closure_idempotency_scope_guard"
BEFORE INSERT ON "payroll_period_closure_idempotencies"
FOR EACH ROW EXECUTE FUNCTION validate_payroll_period_closure_idempotency_scope();

CREATE FUNCTION prevent_payroll_period_closure_evidence_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'payroll period closure evidence is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "payroll_period_closure_manifests_append_only"
BEFORE UPDATE OR DELETE ON "payroll_period_closure_manifests"
FOR EACH ROW EXECUTE FUNCTION prevent_payroll_period_closure_evidence_mutation();
CREATE TRIGGER "payroll_period_closure_events_append_only"
BEFORE UPDATE OR DELETE ON "payroll_period_closure_events"
FOR EACH ROW EXECUTE FUNCTION prevent_payroll_period_closure_evidence_mutation();
CREATE TRIGGER "payroll_period_closure_warnings_append_only"
BEFORE UPDATE OR DELETE ON "payroll_period_closure_warning_acknowledgements"
FOR EACH ROW EXECUTE FUNCTION prevent_payroll_period_closure_evidence_mutation();

CREATE FUNCTION protect_payroll_period_closure_idempotency() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'payroll period closure idempotency records cannot be deleted';
  END IF;
  IF OLD."status" <> 'IN_PROGRESS' THEN
    RAISE EXCEPTION 'completed payroll period closure idempotency records are immutable';
  END IF;
  IF NEW."company_id" <> OLD."company_id"
    OR NEW."payroll_period_id" <> OLD."payroll_period_id"
    OR NEW."operation_type" <> OLD."operation_type"
    OR NEW."idempotency_key_hash" <> OLD."idempotency_key_hash"
    OR NEW."request_fingerprint" <> OLD."request_fingerprint"
    OR NEW."created_at" <> OLD."created_at" THEN
    RAISE EXCEPTION 'payroll period closure idempotency scope is immutable';
  END IF;
  IF NEW."status" = 'IN_PROGRESS' THEN
    RAISE EXCEPTION 'idempotency transition must complete or fail';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "payroll_period_closure_idempotency_protection"
BEFORE UPDATE OR DELETE ON "payroll_period_closure_idempotencies"
FOR EACH ROW EXECUTE FUNCTION protect_payroll_period_closure_idempotency();

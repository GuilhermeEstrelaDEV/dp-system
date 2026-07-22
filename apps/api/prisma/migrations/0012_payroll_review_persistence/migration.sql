CREATE TYPE "PayrollReviewCycleStatus" AS ENUM ('OPEN');
CREATE TYPE "PayrollReviewFindingSeverity" AS ENUM ('INFORMATIONAL', 'BLOCKING');
CREATE TYPE "PayrollReviewFindingStatus" AS ENUM ('OPEN', 'RESOLVED');
CREATE TYPE "PayrollReviewEventType" AS ENUM (
  'REVIEW_CYCLE_OPENED',
  'FINDING_OPENED',
  'FINDING_RESOLVED',
  'FINDING_REOPENED'
);

CREATE TABLE "payroll_review_cycles" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "payroll_run_id" UUID NOT NULL,
  "status" "PayrollReviewCycleStatus" NOT NULL DEFAULT 'OPEN',
  "created_by" UUID NOT NULL,
  "trace_id" VARCHAR(100) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payroll_review_cycles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payroll_review_findings" (
  "id" UUID NOT NULL,
  "review_cycle_id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "payroll_run_id" UUID NOT NULL,
  "payroll_calculation_item_id" UUID,
  "employment_contract_id" UUID,
  "severity" "PayrollReviewFindingSeverity" NOT NULL,
  "status" "PayrollReviewFindingStatus" NOT NULL DEFAULT 'OPEN',
  "code" VARCHAR(100) NOT NULL,
  "title" VARCHAR(200) NOT NULL,
  "description" VARCHAR(2000) NOT NULL,
  "created_by" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolved_by" UUID,
  "resolved_at" TIMESTAMPTZ(6),
  "resolution_reason" VARCHAR(1000),
  "trace_id" VARCHAR(100) NOT NULL,
  CONSTRAINT "payroll_review_findings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payroll_review_findings_resolution_check" CHECK (
    ("status" = 'OPEN' AND "resolved_by" IS NULL AND "resolved_at" IS NULL AND "resolution_reason" IS NULL)
    OR
    ("status" = 'RESOLVED' AND "resolved_by" IS NOT NULL AND "resolved_at" IS NOT NULL AND length(trim("resolution_reason")) > 0)
  )
);

CREATE TABLE "payroll_review_events" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "review_cycle_id" UUID NOT NULL,
  "finding_id" UUID,
  "actor_id" UUID NOT NULL,
  "trace_id" VARCHAR(100) NOT NULL,
  "event_type" "PayrollReviewEventType" NOT NULL,
  "reason" VARCHAR(1000),
  "previous_state" JSONB,
  "next_state" JSONB NOT NULL,
  "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB,
  CONSTRAINT "payroll_review_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payroll_review_events_finding_check" CHECK (
    ("event_type" = 'REVIEW_CYCLE_OPENED' AND "finding_id" IS NULL AND "reason" IS NULL)
    OR
    ("event_type" = 'FINDING_OPENED' AND "finding_id" IS NOT NULL AND "reason" IS NULL)
    OR
    ("event_type" IN ('FINDING_RESOLVED', 'FINDING_REOPENED') AND "finding_id" IS NOT NULL AND length(trim("reason")) > 0)
  )
);

CREATE UNIQUE INDEX "payroll_review_cycles_active_run_key" ON "payroll_review_cycles"("payroll_run_id") WHERE "status" = 'OPEN';
CREATE INDEX "payroll_review_cycles_company_status_idx" ON "payroll_review_cycles"("company_id", "status");
CREATE INDEX "payroll_review_cycles_run_status_idx" ON "payroll_review_cycles"("payroll_run_id", "status");
CREATE INDEX "payroll_review_findings_company_status_idx" ON "payroll_review_findings"("company_id", "status");
CREATE INDEX "payroll_review_findings_run_status_idx" ON "payroll_review_findings"("payroll_run_id", "status");
CREATE INDEX "payroll_review_findings_cycle_status_idx" ON "payroll_review_findings"("review_cycle_id", "status");
CREATE INDEX "payroll_review_findings_contract_idx" ON "payroll_review_findings"("employment_contract_id");
CREATE INDEX "payroll_review_findings_item_idx" ON "payroll_review_findings"("payroll_calculation_item_id");
CREATE INDEX "payroll_review_events_company_time_idx" ON "payroll_review_events"("company_id", "occurred_at");
CREATE INDEX "payroll_review_events_cycle_time_idx" ON "payroll_review_events"("review_cycle_id", "occurred_at");
CREATE INDEX "payroll_review_events_finding_time_idx" ON "payroll_review_events"("finding_id", "occurred_at");
CREATE INDEX "payroll_review_events_trace_idx" ON "payroll_review_events"("trace_id");

ALTER TABLE "payroll_review_cycles" ADD CONSTRAINT "payroll_review_cycles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_review_cycles" ADD CONSTRAINT "payroll_review_cycles_payroll_run_id_fkey" FOREIGN KEY ("payroll_run_id") REFERENCES "payroll_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_review_cycles" ADD CONSTRAINT "payroll_review_cycles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_review_findings" ADD CONSTRAINT "payroll_review_findings_cycle_id_fkey" FOREIGN KEY ("review_cycle_id") REFERENCES "payroll_review_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_review_findings" ADD CONSTRAINT "payroll_review_findings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_review_findings" ADD CONSTRAINT "payroll_review_findings_payroll_run_id_fkey" FOREIGN KEY ("payroll_run_id") REFERENCES "payroll_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_review_findings" ADD CONSTRAINT "payroll_review_findings_item_id_fkey" FOREIGN KEY ("payroll_calculation_item_id") REFERENCES "payroll_calculation_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_review_findings" ADD CONSTRAINT "payroll_review_findings_contract_id_fkey" FOREIGN KEY ("employment_contract_id") REFERENCES "employment_contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_review_findings" ADD CONSTRAINT "payroll_review_findings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_review_findings" ADD CONSTRAINT "payroll_review_findings_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_review_events" ADD CONSTRAINT "payroll_review_events_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_review_events" ADD CONSTRAINT "payroll_review_events_cycle_id_fkey" FOREIGN KEY ("review_cycle_id") REFERENCES "payroll_review_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_review_events" ADD CONSTRAINT "payroll_review_events_finding_id_fkey" FOREIGN KEY ("finding_id") REFERENCES "payroll_review_findings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_review_events" ADD CONSTRAINT "payroll_review_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE FUNCTION prevent_payroll_review_event_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'payroll review events are append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "payroll_review_events_append_only"
BEFORE UPDATE OR DELETE ON "payroll_review_events"
FOR EACH ROW EXECUTE FUNCTION prevent_payroll_review_event_mutation();

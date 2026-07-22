DROP INDEX "payroll_review_cycles_active_run_key";
ALTER TABLE "payroll_review_events" DROP CONSTRAINT "payroll_review_events_finding_check";

ALTER TYPE "PayrollReviewCycleStatus" RENAME TO "PayrollReviewCycleStatus_old";
CREATE TYPE "PayrollReviewCycleStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'SUBMITTED', 'APPROVED', 'REJECTED');
ALTER TABLE "payroll_review_cycles" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "payroll_review_cycles" ALTER COLUMN "status" TYPE "PayrollReviewCycleStatus" USING ("status"::text::"PayrollReviewCycleStatus");
ALTER TABLE "payroll_review_cycles" ALTER COLUMN "status" SET DEFAULT 'OPEN';
DROP TYPE "PayrollReviewCycleStatus_old";

ALTER TYPE "PayrollReviewEventType" RENAME TO "PayrollReviewEventType_old";
CREATE TYPE "PayrollReviewEventType" AS ENUM (
  'REVIEW_CYCLE_OPENED', 'FINDING_OPENED', 'FINDING_RESOLVED', 'FINDING_REOPENED',
  'REVIEW_STARTED', 'REVIEW_SUBMITTED', 'REVIEW_APPROVED', 'REVIEW_REJECTED',
  'FINDING_BLOCKED', 'FINDING_UNBLOCKED'
);
ALTER TABLE "payroll_review_events" ALTER COLUMN "event_type" TYPE "PayrollReviewEventType" USING ("event_type"::text::"PayrollReviewEventType");
DROP TYPE "PayrollReviewEventType_old";

ALTER TABLE "payroll_review_events" ADD CONSTRAINT "payroll_review_events_finding_check" CHECK (
  ("event_type" IN ('REVIEW_CYCLE_OPENED', 'REVIEW_STARTED', 'REVIEW_SUBMITTED', 'REVIEW_APPROVED') AND "finding_id" IS NULL)
  OR
  ("event_type" = 'REVIEW_REJECTED' AND "finding_id" IS NULL AND length(trim("reason")) > 0)
  OR
  ("event_type" IN ('FINDING_OPENED', 'FINDING_BLOCKED', 'FINDING_UNBLOCKED') AND "finding_id" IS NOT NULL)
  OR
  ("event_type" IN ('FINDING_RESOLVED', 'FINDING_REOPENED') AND "finding_id" IS NOT NULL AND length(trim("reason")) > 0)
);

CREATE TYPE "PayrollReviewDecisionType" AS ENUM ('APPROVED', 'REJECTED');

ALTER TABLE "payroll_review_cycles"
  ADD COLUMN "submission_number" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "current_approval_stage" INTEGER NOT NULL DEFAULT 0,
  ADD CONSTRAINT "payroll_review_cycles_submission_check" CHECK ("submission_number" >= 0),
  ADD CONSTRAINT "payroll_review_cycles_stage_check" CHECK ("current_approval_stage" >= 0);

CREATE UNIQUE INDEX "payroll_review_cycles_active_run_key"
  ON "payroll_review_cycles"("payroll_run_id")
  WHERE "status" <> 'APPROVED';

CREATE TABLE "payroll_review_approval_stages" (
  "id" UUID NOT NULL,
  "review_cycle_id" UUID NOT NULL,
  "sequence" INTEGER NOT NULL,
  "code" VARCHAR(100) NOT NULL,
  "required_capability" VARCHAR(100) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payroll_review_approval_stages_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payroll_review_approval_stages_sequence_check" CHECK ("sequence" > 0),
  CONSTRAINT "payroll_review_approval_stages_cycle_sequence_key" UNIQUE ("review_cycle_id", "sequence")
);

CREATE TABLE "payroll_review_decisions" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "review_cycle_id" UUID NOT NULL,
  "approval_stage_id" UUID NOT NULL,
  "submission_number" INTEGER NOT NULL,
  "decision" "PayrollReviewDecisionType" NOT NULL,
  "actor_id" UUID NOT NULL,
  "reason" VARCHAR(1000),
  "trace_id" VARCHAR(100) NOT NULL,
  "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payroll_review_decisions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payroll_review_decisions_submission_check" CHECK ("submission_number" > 0),
  CONSTRAINT "payroll_review_decisions_reason_check" CHECK ("decision" = 'APPROVED' OR length(trim("reason")) > 0),
  CONSTRAINT "payroll_review_decisions_cycle_submission_stage_key" UNIQUE ("review_cycle_id", "submission_number", "approval_stage_id")
);

CREATE INDEX "payroll_review_approval_stages_cycle_idx" ON "payroll_review_approval_stages"("review_cycle_id");
CREATE INDEX "payroll_review_decisions_company_time_idx" ON "payroll_review_decisions"("company_id", "occurred_at");
CREATE INDEX "payroll_review_decisions_cycle_submission_idx" ON "payroll_review_decisions"("review_cycle_id", "submission_number");

ALTER TABLE "payroll_review_approval_stages" ADD CONSTRAINT "payroll_review_approval_stages_cycle_id_fkey" FOREIGN KEY ("review_cycle_id") REFERENCES "payroll_review_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_review_decisions" ADD CONSTRAINT "payroll_review_decisions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_review_decisions" ADD CONSTRAINT "payroll_review_decisions_cycle_id_fkey" FOREIGN KEY ("review_cycle_id") REFERENCES "payroll_review_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_review_decisions" ADD CONSTRAINT "payroll_review_decisions_stage_id_fkey" FOREIGN KEY ("approval_stage_id") REFERENCES "payroll_review_approval_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_review_decisions" ADD CONSTRAINT "payroll_review_decisions_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE FUNCTION prevent_payroll_review_decision_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'payroll review decisions are append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "payroll_review_decisions_append_only"
BEFORE UPDATE OR DELETE ON "payroll_review_decisions"
FOR EACH ROW EXECUTE FUNCTION prevent_payroll_review_decision_mutation();

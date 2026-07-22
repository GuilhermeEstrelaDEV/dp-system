DROP INDEX "payroll_review_cycles_active_run_key";
ALTER TABLE "payroll_review_events" DROP CONSTRAINT "payroll_review_events_finding_check";

ALTER TYPE "PayrollReviewCycleStatus" RENAME TO "PayrollReviewCycleStatus_old";
CREATE TYPE "PayrollReviewCycleStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CLOSED');
ALTER TABLE "payroll_review_cycles" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "payroll_review_cycles" ALTER COLUMN "status" TYPE "PayrollReviewCycleStatus" USING ("status"::text::"PayrollReviewCycleStatus");
ALTER TABLE "payroll_review_cycles" ALTER COLUMN "status" SET DEFAULT 'OPEN';
DROP TYPE "PayrollReviewCycleStatus_old";

ALTER TYPE "PayrollReviewEventType" RENAME TO "PayrollReviewEventType_old";
CREATE TYPE "PayrollReviewEventType" AS ENUM (
  'REVIEW_CYCLE_OPENED', 'FINDING_OPENED', 'FINDING_RESOLVED', 'FINDING_REOPENED',
  'REVIEW_STARTED', 'REVIEW_SUBMITTED', 'REVIEW_APPROVED', 'REVIEW_REJECTED',
  'FINDING_BLOCKED', 'FINDING_UNBLOCKED', 'REVIEW_CLOSED', 'REVIEW_REOPENED',
  'APPROVALS_INVALIDATED'
);
ALTER TABLE "payroll_review_events" ALTER COLUMN "event_type" TYPE "PayrollReviewEventType" USING ("event_type"::text::"PayrollReviewEventType");
DROP TYPE "PayrollReviewEventType_old";

ALTER TABLE "payroll_review_events" ADD CONSTRAINT "payroll_review_events_finding_check" CHECK (
  ("event_type" IN ('REVIEW_CYCLE_OPENED', 'REVIEW_STARTED', 'REVIEW_SUBMITTED', 'REVIEW_APPROVED', 'REVIEW_CLOSED', 'REVIEW_REOPENED', 'APPROVALS_INVALIDATED') AND "finding_id" IS NULL)
  OR ("event_type" = 'REVIEW_REJECTED' AND "finding_id" IS NULL AND length(trim("reason")) > 0)
  OR ("event_type" IN ('FINDING_OPENED', 'FINDING_BLOCKED', 'FINDING_UNBLOCKED') AND "finding_id" IS NOT NULL)
  OR ("event_type" IN ('FINDING_RESOLVED', 'FINDING_REOPENED') AND "finding_id" IS NOT NULL AND length(trim("reason")) > 0)
);

ALTER TABLE "payroll_review_cycles" ADD COLUMN "review_round" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "payroll_review_cycles" ADD CONSTRAINT "payroll_review_cycles_round_check" CHECK ("review_round" > 0);
ALTER TABLE "payroll_review_decisions" ADD COLUMN "review_round" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "payroll_review_decisions" ADD CONSTRAINT "payroll_review_decisions_round_check" CHECK ("review_round" > 0);
CREATE INDEX "payroll_review_decisions_cycle_round_idx" ON "payroll_review_decisions"("review_cycle_id", "review_round");

CREATE UNIQUE INDEX "payroll_review_cycles_active_run_key" ON "payroll_review_cycles"("payroll_run_id") WHERE "status" <> 'CLOSED';

CREATE TABLE "payroll_review_decision_invalidations" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "review_cycle_id" UUID NOT NULL,
  "decision_id" UUID NOT NULL,
  "review_round" INTEGER NOT NULL,
  "invalidated_at" TIMESTAMPTZ(6) NOT NULL,
  "invalidated_by" UUID NOT NULL,
  "invalidation_reason" VARCHAR(1000) NOT NULL,
  "caused_by_event_id" UUID NOT NULL,
  CONSTRAINT "payroll_review_decision_invalidations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payroll_review_decision_invalidations_decision_key" UNIQUE ("decision_id"),
  CONSTRAINT "payroll_review_decision_invalidations_round_check" CHECK ("review_round" > 0),
  CONSTRAINT "payroll_review_decision_invalidations_reason_check" CHECK (length(trim("invalidation_reason")) > 0)
);
CREATE INDEX "payroll_review_invalidations_cycle_round_idx" ON "payroll_review_decision_invalidations"("review_cycle_id", "review_round");
CREATE INDEX "payroll_review_invalidations_company_time_idx" ON "payroll_review_decision_invalidations"("company_id", "invalidated_at");
ALTER TABLE "payroll_review_decision_invalidations" ADD CONSTRAINT "payroll_review_invalidations_company_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_review_decision_invalidations" ADD CONSTRAINT "payroll_review_invalidations_cycle_fkey" FOREIGN KEY ("review_cycle_id") REFERENCES "payroll_review_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_review_decision_invalidations" ADD CONSTRAINT "payroll_review_invalidations_decision_fkey" FOREIGN KEY ("decision_id") REFERENCES "payroll_review_decisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_review_decision_invalidations" ADD CONSTRAINT "payroll_review_invalidations_actor_fkey" FOREIGN KEY ("invalidated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_review_decision_invalidations" ADD CONSTRAINT "payroll_review_invalidations_event_fkey" FOREIGN KEY ("caused_by_event_id") REFERENCES "payroll_review_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE FUNCTION prevent_payroll_review_invalidation_mutation() RETURNS trigger AS $$ BEGIN RAISE EXCEPTION 'payroll review invalidations are append-only'; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER "payroll_review_invalidations_append_only" BEFORE UPDATE OR DELETE ON "payroll_review_decision_invalidations" FOR EACH ROW EXECUTE FUNCTION prevent_payroll_review_invalidation_mutation();

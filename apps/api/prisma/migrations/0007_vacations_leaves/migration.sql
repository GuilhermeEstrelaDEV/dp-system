CREATE TABLE "vacation_periods" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "employment_contract_id" UUID NOT NULL,
  "accrual_start" DATE NOT NULL,
  "accrual_end" DATE NOT NULL,
  "grant_start" DATE,
  "grant_end" DATE,
  "status" VARCHAR(20) NOT NULL DEFAULT 'OPEN',
  "notes" VARCHAR(1000),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "vacation_periods_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "collective_vacations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "company_id" UUID NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "start_date" DATE NOT NULL,
  "end_date" DATE NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  "notes" VARCHAR(1000),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "collective_vacations_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "vacation_requests" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "employment_contract_id" UUID NOT NULL,
  "vacation_period_id" UUID NOT NULL,
  "collective_vacation_id" UUID,
  "start_date" DATE NOT NULL,
  "end_date" DATE NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  "request_reason" VARCHAR(1000),
  "approval_reason" VARCHAR(1000),
  "approved_at" TIMESTAMPTZ(6),
  "cancelled_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "vacation_requests_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "vacation_request_history" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "vacation_request_id" UUID NOT NULL,
  "action" VARCHAR(30) NOT NULL,
  "reason" VARCHAR(1000),
  "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "vacation_request_history_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "vacation_alerts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "vacation_period_id" UUID NOT NULL,
  "kind" VARCHAR(50) NOT NULL,
  "due_date" DATE NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'OPEN',
  "message" VARCHAR(1000),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "vacation_alerts_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "leave_types" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "company_id" UUID NOT NULL,
  "code" VARCHAR(50) NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "requires_expected_return" BOOLEAN NOT NULL DEFAULT false,
  "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "leave_types_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "leave_cases" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "employment_contract_id" UUID NOT NULL,
  "leave_type_id" UUID NOT NULL,
  "start_date" DATE NOT NULL,
  "end_date" DATE,
  "expected_return_date" DATE,
  "actual_return_date" DATE,
  "status" VARCHAR(20) NOT NULL DEFAULT 'OPEN',
  "reason" VARCHAR(1000),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "leave_cases_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "leave_case_history" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "leave_case_id" UUID NOT NULL,
  "action" VARCHAR(30) NOT NULL,
  "reason" VARCHAR(1000),
  "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "leave_case_history_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "vacation_periods_contract_accrual_start_key" ON "vacation_periods"("employment_contract_id", "accrual_start");
CREATE INDEX "vacation_periods_contract_status_idx" ON "vacation_periods"("employment_contract_id", "status");
CREATE INDEX "collective_vacations_company_status_idx" ON "collective_vacations"("company_id", "status");
CREATE INDEX "vacation_requests_contract_status_idx" ON "vacation_requests"("employment_contract_id", "status");
CREATE INDEX "vacation_requests_period_start_idx" ON "vacation_requests"("vacation_period_id", "start_date");
CREATE INDEX "vacation_request_history_request_occurred_idx" ON "vacation_request_history"("vacation_request_id", "occurred_at");
CREATE INDEX "vacation_alerts_status_due_idx" ON "vacation_alerts"("status", "due_date");
CREATE UNIQUE INDEX "leave_types_company_code_key" ON "leave_types"("company_id", "code");
CREATE INDEX "leave_cases_contract_status_idx" ON "leave_cases"("employment_contract_id", "status");
CREATE INDEX "leave_cases_type_start_idx" ON "leave_cases"("leave_type_id", "start_date");
CREATE INDEX "leave_case_history_case_occurred_idx" ON "leave_case_history"("leave_case_id", "occurred_at");
ALTER TABLE "vacation_periods" ADD CONSTRAINT "vacation_periods_contract_fkey" FOREIGN KEY ("employment_contract_id") REFERENCES "employment_contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "collective_vacations" ADD CONSTRAINT "collective_vacations_company_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vacation_requests" ADD CONSTRAINT "vacation_requests_contract_fkey" FOREIGN KEY ("employment_contract_id") REFERENCES "employment_contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE, ADD CONSTRAINT "vacation_requests_period_fkey" FOREIGN KEY ("vacation_period_id") REFERENCES "vacation_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE, ADD CONSTRAINT "vacation_requests_collective_fkey" FOREIGN KEY ("collective_vacation_id") REFERENCES "collective_vacations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vacation_request_history" ADD CONSTRAINT "vacation_request_history_request_fkey" FOREIGN KEY ("vacation_request_id") REFERENCES "vacation_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vacation_alerts" ADD CONSTRAINT "vacation_alerts_period_fkey" FOREIGN KEY ("vacation_period_id") REFERENCES "vacation_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "leave_types" ADD CONSTRAINT "leave_types_company_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "leave_cases" ADD CONSTRAINT "leave_cases_contract_fkey" FOREIGN KEY ("employment_contract_id") REFERENCES "employment_contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE, ADD CONSTRAINT "leave_cases_type_fkey" FOREIGN KEY ("leave_type_id") REFERENCES "leave_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "leave_case_history" ADD CONSTRAINT "leave_case_history_case_fkey" FOREIGN KEY ("leave_case_id") REFERENCES "leave_cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

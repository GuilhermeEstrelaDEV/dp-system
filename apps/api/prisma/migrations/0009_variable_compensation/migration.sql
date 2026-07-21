CREATE TABLE "variable_compensation_events" (
  "id" UUID NOT NULL,
  "employment_contract_id" UUID NOT NULL,
  "reference_period" DATE NOT NULL,
  "type" VARCHAR(50) NOT NULL,
  "amount" DECIMAL(15,2) NOT NULL,
  "policy_reference" VARCHAR(500),
  "approval_status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "variable_compensation_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "variable_compensation_events_amount_check" CHECK ("amount" > 0),
  CONSTRAINT "variable_compensation_events_employment_contract_id_fkey" FOREIGN KEY ("employment_contract_id") REFERENCES "employment_contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "variable_compensation_events_employment_contract_id_reference_period_approval_status_idx" ON "variable_compensation_events"("employment_contract_id", "reference_period", "approval_status");

CREATE TABLE "salary_advances" (
  "id" UUID NOT NULL,
  "employment_contract_id" UUID NOT NULL,
  "reference_period" DATE NOT NULL,
  "amount" DECIMAL(15,2) NOT NULL,
  "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  "payment_date" DATE,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "salary_advances_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "salary_advances_amount_check" CHECK ("amount" > 0),
  CONSTRAINT "salary_advances_employment_contract_id_fkey" FOREIGN KEY ("employment_contract_id") REFERENCES "employment_contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "salary_advances_employment_contract_id_reference_period_idx" ON "salary_advances"("employment_contract_id", "reference_period");

CREATE TABLE "off_cycle_payments" (
  "id" UUID NOT NULL,
  "employment_contract_id" UUID NOT NULL,
  "reference_period" DATE NOT NULL,
  "amount" DECIMAL(15,2) NOT NULL,
  "reason" VARCHAR(1000) NOT NULL,
  "approval_status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  "paid_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "off_cycle_payments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "off_cycle_payments_amount_check" CHECK ("amount" > 0),
  CONSTRAINT "off_cycle_payments_employment_contract_id_fkey" FOREIGN KEY ("employment_contract_id") REFERENCES "employment_contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "off_cycle_payments_reference_period_approval_status_idx" ON "off_cycle_payments"("reference_period", "approval_status");
CREATE INDEX "off_cycle_payments_employment_contract_id_idx" ON "off_cycle_payments"("employment_contract_id");

CREATE TABLE "payroll_reconciliations" (
  "id" UUID NOT NULL,
  "payroll_run_id" UUID NOT NULL,
  "type" VARCHAR(50) NOT NULL,
  "status" VARCHAR(30) NOT NULL DEFAULT 'OPEN',
  "difference_amount" DECIMAL(15,2) NOT NULL,
  "notes" VARCHAR(1000),
  "resolved_by" UUID,
  "resolved_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "payroll_reconciliations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payroll_reconciliations_payroll_run_id_fkey" FOREIGN KEY ("payroll_run_id") REFERENCES "payroll_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "payroll_reconciliations_payroll_run_id_status_idx" ON "payroll_reconciliations"("payroll_run_id", "status");

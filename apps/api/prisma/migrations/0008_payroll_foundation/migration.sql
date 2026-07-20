-- CreateTable
CREATE TABLE "payroll_calendars" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "payroll_calendars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_periods" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "payroll_calendar_id" UUID NOT NULL,
    "reference_date" DATE NOT NULL,
    "type" VARCHAR(30) NOT NULL DEFAULT 'REGULAR',
    "status" VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    "engine_version" VARCHAR(50) NOT NULL DEFAULT 'foundation-1',
    "parameter_version" VARCHAR(50),
    "opened_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMPTZ(6),
    "reopened_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "payroll_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_rubric_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "nature" VARCHAR(30) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "payroll_rubric_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_rubrics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "payroll_rubric_category_id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "payroll_rubrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_rubric_versions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "payroll_rubric_id" UUID NOT NULL,
    "version" VARCHAR(50) NOT NULL,
    "valid_from" DATE NOT NULL,
    "valid_to" DATE,
    "calculation_base" JSONB,
    "incidence_configuration" JSONB,
    "configuration" JSONB,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payroll_rubric_versions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "payroll_rubric_versions_validity_check" CHECK ("valid_to" IS NULL OR "valid_to" >= "valid_from")
);

-- CreateTable
CREATE TABLE "payroll_parameters" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID,
    "code" VARCHAR(100) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "version" VARCHAR(50) NOT NULL,
    "valid_from" DATE NOT NULL,
    "valid_to" DATE,
    "definition" JSONB,
    "source_reference" VARCHAR(500),
    "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "payroll_parameters_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "payroll_parameters_validity_check" CHECK ("valid_to" IS NULL OR "valid_to" >= "valid_from")
);

-- CreateTable
CREATE TABLE "payroll_inputs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "payroll_period_id" UUID NOT NULL,
    "employment_contract_id" UUID NOT NULL,
    "payroll_rubric_id" UUID NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "quantity" DECIMAL(15,4),
    "source" VARCHAR(30) NOT NULL DEFAULT 'MANUAL',
    "source_key" VARCHAR(160),
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "payroll_inputs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_runs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "payroll_period_id" UUID NOT NULL,
    "sequence" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "engine_version" VARCHAR(50) NOT NULL,
    "parameter_version" VARCHAR(50),
    "parameter_snapshot" JSONB,
    "started_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payroll_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_run_employees" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "payroll_run_id" UUID NOT NULL,
    "employment_contract_id" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "gross_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "net_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "calculation_memory" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payroll_run_employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_calculation_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "payroll_run_employee_id" UUID NOT NULL,
    "payroll_rubric_id" UUID NOT NULL,
    "payroll_rubric_version_id" UUID,
    "base_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "calculation_memory" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payroll_calculation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_run_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "payroll_run_id" UUID NOT NULL,
    "severity" VARCHAR(30) NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "message" VARCHAR(1000) NOT NULL,
    "metadata" JSONB,
    "resolved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payroll_run_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_period_closures" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "payroll_period_id" UUID NOT NULL,
    "action" VARCHAR(30) NOT NULL,
    "reason" VARCHAR(1000),
    "engine_version" VARCHAR(50) NOT NULL,
    "parameter_version" VARCHAR(50),
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payroll_period_closures_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payroll_calendars_company_id_name_key" ON "payroll_calendars"("company_id", "name");
CREATE INDEX "payroll_calendars_company_id_status_idx" ON "payroll_calendars"("company_id", "status");
CREATE UNIQUE INDEX "payroll_periods_company_id_reference_date_type_key" ON "payroll_periods"("company_id", "reference_date", "type");
CREATE INDEX "payroll_periods_payroll_calendar_id_reference_date_idx" ON "payroll_periods"("payroll_calendar_id", "reference_date");
CREATE INDEX "payroll_periods_company_id_status_idx" ON "payroll_periods"("company_id", "status");
CREATE UNIQUE INDEX "payroll_rubric_categories_company_id_code_key" ON "payroll_rubric_categories"("company_id", "code");
CREATE INDEX "payroll_rubric_categories_company_id_status_idx" ON "payroll_rubric_categories"("company_id", "status");
CREATE UNIQUE INDEX "payroll_rubrics_company_id_code_key" ON "payroll_rubrics"("company_id", "code");
CREATE INDEX "payroll_rubrics_company_id_status_idx" ON "payroll_rubrics"("company_id", "status");
CREATE INDEX "payroll_rubrics_payroll_rubric_category_id_idx" ON "payroll_rubrics"("payroll_rubric_category_id");
CREATE UNIQUE INDEX "payroll_rubric_versions_payroll_rubric_id_version_key" ON "payroll_rubric_versions"("payroll_rubric_id", "version");
CREATE UNIQUE INDEX "payroll_rubric_versions_payroll_rubric_id_valid_from_key" ON "payroll_rubric_versions"("payroll_rubric_id", "valid_from");
CREATE INDEX "payroll_rubric_versions_payroll_rubric_id_valid_from_valid_to_idx" ON "payroll_rubric_versions"("payroll_rubric_id", "valid_from", "valid_to");
CREATE UNIQUE INDEX "payroll_parameters_company_id_code_valid_from_key" ON "payroll_parameters"("company_id", "code", "valid_from");
CREATE INDEX "payroll_parameters_code_valid_from_valid_to_idx" ON "payroll_parameters"("code", "valid_from", "valid_to");
CREATE INDEX "payroll_parameters_company_id_status_idx" ON "payroll_parameters"("company_id", "status");
CREATE UNIQUE INDEX "payroll_inputs_payroll_period_id_source_key_key" ON "payroll_inputs"("payroll_period_id", "source_key");
CREATE INDEX "payroll_inputs_employment_contract_id_payroll_period_id_idx" ON "payroll_inputs"("employment_contract_id", "payroll_period_id");
CREATE INDEX "payroll_inputs_payroll_period_id_status_idx" ON "payroll_inputs"("payroll_period_id", "status");
CREATE UNIQUE INDEX "payroll_runs_payroll_period_id_sequence_key" ON "payroll_runs"("payroll_period_id", "sequence");
CREATE INDEX "payroll_runs_payroll_period_id_status_idx" ON "payroll_runs"("payroll_period_id", "status");
CREATE UNIQUE INDEX "payroll_run_employees_payroll_run_id_employment_contract_id_key" ON "payroll_run_employees"("payroll_run_id", "employment_contract_id");
CREATE INDEX "payroll_run_employees_employment_contract_id_status_idx" ON "payroll_run_employees"("employment_contract_id", "status");
CREATE INDEX "payroll_calculation_items_payroll_run_employee_id_idx" ON "payroll_calculation_items"("payroll_run_employee_id");
CREATE INDEX "payroll_calculation_items_payroll_rubric_id_idx" ON "payroll_calculation_items"("payroll_rubric_id");
CREATE INDEX "payroll_run_messages_payroll_run_id_severity_idx" ON "payroll_run_messages"("payroll_run_id", "severity");
CREATE INDEX "payroll_period_closures_payroll_period_id_occurred_at_idx" ON "payroll_period_closures"("payroll_period_id", "occurred_at");

-- AddForeignKey
ALTER TABLE "payroll_calendars" ADD CONSTRAINT "payroll_calendars_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_periods" ADD CONSTRAINT "payroll_periods_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_periods" ADD CONSTRAINT "payroll_periods_payroll_calendar_id_fkey" FOREIGN KEY ("payroll_calendar_id") REFERENCES "payroll_calendars"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_rubric_categories" ADD CONSTRAINT "payroll_rubric_categories_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_rubrics" ADD CONSTRAINT "payroll_rubrics_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_rubrics" ADD CONSTRAINT "payroll_rubrics_payroll_rubric_category_id_fkey" FOREIGN KEY ("payroll_rubric_category_id") REFERENCES "payroll_rubric_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_rubric_versions" ADD CONSTRAINT "payroll_rubric_versions_payroll_rubric_id_fkey" FOREIGN KEY ("payroll_rubric_id") REFERENCES "payroll_rubrics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_parameters" ADD CONSTRAINT "payroll_parameters_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_inputs" ADD CONSTRAINT "payroll_inputs_payroll_period_id_fkey" FOREIGN KEY ("payroll_period_id") REFERENCES "payroll_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_inputs" ADD CONSTRAINT "payroll_inputs_employment_contract_id_fkey" FOREIGN KEY ("employment_contract_id") REFERENCES "employment_contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_inputs" ADD CONSTRAINT "payroll_inputs_payroll_rubric_id_fkey" FOREIGN KEY ("payroll_rubric_id") REFERENCES "payroll_rubrics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_payroll_period_id_fkey" FOREIGN KEY ("payroll_period_id") REFERENCES "payroll_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_run_employees" ADD CONSTRAINT "payroll_run_employees_payroll_run_id_fkey" FOREIGN KEY ("payroll_run_id") REFERENCES "payroll_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_run_employees" ADD CONSTRAINT "payroll_run_employees_employment_contract_id_fkey" FOREIGN KEY ("employment_contract_id") REFERENCES "employment_contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_calculation_items" ADD CONSTRAINT "payroll_calculation_items_payroll_run_employee_id_fkey" FOREIGN KEY ("payroll_run_employee_id") REFERENCES "payroll_run_employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_calculation_items" ADD CONSTRAINT "payroll_calculation_items_payroll_rubric_id_fkey" FOREIGN KEY ("payroll_rubric_id") REFERENCES "payroll_rubrics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_calculation_items" ADD CONSTRAINT "payroll_calculation_items_payroll_rubric_version_id_fkey" FOREIGN KEY ("payroll_rubric_version_id") REFERENCES "payroll_rubric_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_run_messages" ADD CONSTRAINT "payroll_run_messages_payroll_run_id_fkey" FOREIGN KEY ("payroll_run_id") REFERENCES "payroll_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_period_closures" ADD CONSTRAINT "payroll_period_closures_payroll_period_id_fkey" FOREIGN KEY ("payroll_period_id") REFERENCES "payroll_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

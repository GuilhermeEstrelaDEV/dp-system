CREATE TABLE "employees" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "legal_name" VARCHAR(160) NOT NULL,
  "preferred_name" VARCHAR(160),
  "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "employees_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "employees_status_check" CHECK ("status" IN ('ACTIVE', 'INACTIVE'))
);

CREATE TABLE "employee_contacts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "employee_id" UUID NOT NULL,
  "type" VARCHAR(20) NOT NULL,
  "value" VARCHAR(254) NOT NULL,
  "is_primary" BOOLEAN NOT NULL DEFAULT false,
  "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "employee_contacts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "employee_contacts_type_check" CHECK ("type" IN ('EMAIL', 'PHONE')),
  CONSTRAINT "employee_contacts_status_check" CHECK ("status" IN ('ACTIVE', 'INACTIVE'))
);

CREATE TABLE "employment_contracts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "employee_id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "branch_id" UUID,
  "department_id" UUID,
  "position_id" UUID NOT NULL,
  "cost_center_id" UUID,
  "registration_number" VARCHAR(50) NOT NULL,
  "contract_type" VARCHAR(50) NOT NULL,
  "employment_regime" VARCHAR(50) NOT NULL,
  "start_date" DATE NOT NULL,
  "end_date" DATE,
  "weekly_hours" INTEGER NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "employment_contracts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "employment_contracts_status_check" CHECK ("status" IN ('ACTIVE', 'INACTIVE')),
  CONSTRAINT "employment_contracts_hours_check" CHECK ("weekly_hours" > 0),
  CONSTRAINT "employment_contracts_dates_check" CHECK ("end_date" IS NULL OR "end_date" >= "start_date")
);

CREATE TABLE "contract_history" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "employment_contract_id" UUID NOT NULL,
  "action" VARCHAR(50) NOT NULL,
  "reason" VARCHAR(500),
  "snapshot" JSONB,
  "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "contract_history_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "employee_contacts_employee_id_type_value_key" ON "employee_contacts"("employee_id", "type", "value");
CREATE INDEX "employee_contacts_employee_id_status_idx" ON "employee_contacts"("employee_id", "status");
CREATE INDEX "employees_status_idx" ON "employees"("status");
CREATE INDEX "employees_legal_name_idx" ON "employees"("legal_name");
CREATE UNIQUE INDEX "employment_contracts_company_id_registration_number_key" ON "employment_contracts"("company_id", "registration_number");
CREATE INDEX "employment_contracts_employee_id_status_idx" ON "employment_contracts"("employee_id", "status");
CREATE INDEX "employment_contracts_company_id_status_idx" ON "employment_contracts"("company_id", "status");
CREATE INDEX "contract_history_employment_contract_id_occurred_at_idx" ON "contract_history"("employment_contract_id", "occurred_at");

ALTER TABLE "employee_contacts" ADD CONSTRAINT "employee_contacts_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "employment_contracts" ADD CONSTRAINT "employment_contracts_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "employment_contracts" ADD CONSTRAINT "employment_contracts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "employment_contracts" ADD CONSTRAINT "employment_contracts_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "employment_contracts" ADD CONSTRAINT "employment_contracts_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "employment_contracts" ADD CONSTRAINT "employment_contracts_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "positions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "employment_contracts" ADD CONSTRAINT "employment_contracts_cost_center_id_fkey" FOREIGN KEY ("cost_center_id") REFERENCES "cost_centers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "contract_history" ADD CONSTRAINT "contract_history_employment_contract_id_fkey" FOREIGN KEY ("employment_contract_id") REFERENCES "employment_contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

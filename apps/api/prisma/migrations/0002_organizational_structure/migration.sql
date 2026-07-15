CREATE TABLE "companies" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "legal_name" VARCHAR(160) NOT NULL,
  "trade_name" VARCHAR(160) NOT NULL,
  "tax_id" VARCHAR(20) NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "companies_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "companies_status_check" CHECK ("status" IN ('ACTIVE', 'INACTIVE'))
);

CREATE TABLE "branches" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "company_id" UUID NOT NULL,
  "code" VARCHAR(50) NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "tax_id" VARCHAR(20),
  "address" JSONB,
  "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "branches_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "branches_status_check" CHECK ("status" IN ('ACTIVE', 'INACTIVE'))
);

CREATE TABLE "departments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "company_id" UUID NOT NULL,
  "branch_id" UUID,
  "code" VARCHAR(50) NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "departments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "departments_status_check" CHECK ("status" IN ('ACTIVE', 'INACTIVE'))
);

CREATE TABLE "positions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "company_id" UUID NOT NULL,
  "code" VARCHAR(50) NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "description" VARCHAR(1000),
  "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "positions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "positions_status_check" CHECK ("status" IN ('ACTIVE', 'INACTIVE'))
);

CREATE TABLE "cost_centers" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "company_id" UUID NOT NULL,
  "code" VARCHAR(50) NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "cost_centers_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "cost_centers_status_check" CHECK ("status" IN ('ACTIVE', 'INACTIVE'))
);

CREATE UNIQUE INDEX "companies_tax_id_key" ON "companies"("tax_id");
CREATE INDEX "companies_status_idx" ON "companies"("status");
CREATE UNIQUE INDEX "branches_company_id_code_key" ON "branches"("company_id", "code");
CREATE UNIQUE INDEX "branches_company_id_tax_id_key" ON "branches"("company_id", "tax_id");
CREATE INDEX "branches_company_id_status_idx" ON "branches"("company_id", "status");
CREATE UNIQUE INDEX "departments_company_id_code_key" ON "departments"("company_id", "code");
CREATE INDEX "departments_company_id_status_idx" ON "departments"("company_id", "status");
CREATE INDEX "departments_branch_id_idx" ON "departments"("branch_id");
CREATE UNIQUE INDEX "positions_company_id_code_key" ON "positions"("company_id", "code");
CREATE INDEX "positions_company_id_status_idx" ON "positions"("company_id", "status");
CREATE UNIQUE INDEX "cost_centers_company_id_code_key" ON "cost_centers"("company_id", "code");
CREATE INDEX "cost_centers_company_id_status_idx" ON "cost_centers"("company_id", "status");

ALTER TABLE "branches" ADD CONSTRAINT "branches_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "departments" ADD CONSTRAINT "departments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "departments" ADD CONSTRAINT "departments_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "positions" ADD CONSTRAINT "positions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cost_centers" ADD CONSTRAINT "cost_centers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

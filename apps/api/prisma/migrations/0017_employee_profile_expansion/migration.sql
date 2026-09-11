CREATE TYPE "MaritalStatus" AS ENUM (
  'SINGLE',
  'MARRIED',
  'DIVORCED',
  'WIDOWED',
  'SEPARATED',
  'OTHER'
);

ALTER TABLE "employees"
  ADD COLUMN "cpf" VARCHAR(11),
  ADD COLUMN "birth_date" DATE,
  ADD COLUMN "marital_status" "MaritalStatus",
  ADD COLUMN "nationality" VARCHAR(80),
  ADD COLUMN "place_of_birth" VARCHAR(120);

ALTER TABLE "employees"
  ADD CONSTRAINT "employees_cpf_format_check"
  CHECK ("cpf" IS NULL OR "cpf" ~ '^[0-9]{11}$'),
  ADD CONSTRAINT "employees_birth_date_sanity_check"
  CHECK ("birth_date" IS NULL OR "birth_date" >= DATE '1900-01-01');

CREATE TABLE "employee_addresses" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "employee_id" UUID NOT NULL,
  "postal_code" VARCHAR(8),
  "street" VARCHAR(160),
  "number" VARCHAR(30),
  "complement" VARCHAR(120),
  "district" VARCHAR(120),
  "city" VARCHAR(120),
  "state" VARCHAR(2),
  "country" VARCHAR(80),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "employee_addresses_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "employee_addresses_employee_id_fkey"
    FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "employee_addresses_postal_code_format_check"
    CHECK ("postal_code" IS NULL OR "postal_code" ~ '^[0-9]{8}$'),
  CONSTRAINT "employee_addresses_state_format_check"
    CHECK ("state" IS NULL OR "state" ~ '^[A-Z]{2}$')
);

CREATE UNIQUE INDEX "employee_addresses_employee_id_key"
  ON "employee_addresses"("employee_id");

CREATE TABLE "employee_emergency_contacts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "employee_id" UUID NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "relationship" VARCHAR(80) NOT NULL,
  "phone" VARCHAR(30) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "employee_emergency_contacts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "employee_emergency_contacts_employee_id_fkey"
    FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "employee_emergency_contacts_employee_id_key"
  ON "employee_emergency_contacts"("employee_id");

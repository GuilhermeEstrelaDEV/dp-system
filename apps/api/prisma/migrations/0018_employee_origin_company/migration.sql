-- Preserve the active-company context of employee creation without changing
-- the employment-contract model. Existing employees remain scoped by their
-- contracts; new employees are immediately discoverable by their origin company.
ALTER TABLE "employees"
ADD COLUMN "origin_company_id" UUID;

CREATE INDEX "employees_origin_company_id_status_idx"
ON "employees"("origin_company_id", "status");

ALTER TABLE "employees"
ADD CONSTRAINT "employees_origin_company_id_fkey"
FOREIGN KEY ("origin_company_id") REFERENCES "companies"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

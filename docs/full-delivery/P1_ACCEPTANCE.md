# Full Delivery P1 Acceptance

## Status

`FULL DELIVERY P1 — READY TO MERGE`

Baseline: `75aa22c391bdf849a73a4076e6bb628ae4ad0913`.

The authoritative source inspection found exactly 33 P1 handlers: Company 6, Employee 12,
Employment Contract 7, Payroll Parameter 4 and Payroll Rubric 4. All now use
`CAPABILITY_PROTECTED`, active-company context and deny-by-default authorization. Company is the
controlled global-administration exception: the active company establishes the authorization and
audit context, while `company.read` or `company.manage` explicitly grants administrative access to
independent company records.

## Projection catalog

| Projection        | Explicit fields                                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Company           | `id`, `legalName`, `tradeName`, `taxId`, `status`, timestamps                                                                  |
| Employee          | `id`, `legalName`, `preferredName`, `status`, timestamps; detail adds contacts and contracts restricted to the active company  |
| Employee contact  | `id`, `employeeId`, `type`, `value`, `isPrimary`, `status`, timestamps                                                         |
| Contract          | operational identifiers, registration, type/regime, dates, weekly hours and status; related records expose only ID/name/status |
| Payroll parameter | identifiers, company, code/name/category/version, validity, configurable definition/source, status and timestamps              |
| Payroll rubric    | identifiers, company/category, code/name/status, timestamps and explicit version configuration                                 |

No handler returns an unrestricted Prisma model. Fields blocked by pending legal/privacy decisions
are not newly exposed. Existing screen-required identifiers remain visible; audit metadata never
contains names, tax IDs, addresses, salary, raw bodies or responses.

## Authoritative handler inventory

Abbreviations: `C` = company predicate derived from `principal.activeCompanyId`; `G` = controlled
global Company administration; `P` = explicit projection above. Errors always include `401`
without identity and `403` without the listed capability; `C` details and mutations return `404`
for foreign/missing resources. List query DTOs include existing pagination/filter/sort fields.

|   # | Controller.method                          | Verb and route                                                | Operation / capability             | DTO / response                                | Service and Prisma                                                              | Scope / frontend             | Audit / specific errors                                       |
| --: | ------------------------------------------ | ------------------------------------------------------------- | ---------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------- |
|   1 | `CompaniesController.list`                 | `GET /companies`                                              | READ / `company.read`              | `CompanyListQueryDto` / Company P             | `CompaniesService.list`; `Company.findMany/count`                               | G / Empresas                 | none                                                          |
|   2 | `CompaniesController.find`                 | `GET /companies/:id`                                          | READ / `company.read`              | path UUID / Company P                         | `CompaniesService.find`; `Company.findUnique`                                   | G / Empresa detail           | none; `404` missing                                           |
|   3 | `CompaniesController.create`               | `POST /companies`                                             | WRITE / `company.manage`           | `CreateCompanyDto` / Company P                | `CompaniesService.create`; `Company.create`                                     | G / Empresa form             | `COMPANY_CREATED`; `409` duplicate                            |
|   4 | `CompaniesController.update`               | `PATCH /companies/:id`                                        | WRITE / `company.manage`           | `UpdateCompanyDto` / Company P                | `CompaniesService.update`; `Company.update`                                     | G / Empresa form             | `COMPANY_UPDATED`; `404`, `409`                               |
|   5 | `CompaniesController.activate`             | `PATCH /companies/:id/activate`                               | ACTION / `company.manage`          | path UUID / Company P                         | `CompaniesService.setStatus`; `Company.update`                                  | G / Empresa detail           | `COMPANY_ACTIVATED`; `404`                                    |
|   6 | `CompaniesController.inactivate`           | `PATCH /companies/:id/inactivate`                             | ACTION / `company.manage`          | path UUID / Company P                         | `CompaniesService.setStatus`; dependency counts + update                        | G / Empresa detail           | `COMPANY_INACTIVATED`; `404`, `409` active dependencies       |
|   7 | `EmployeesController.list`                 | `GET /employees`                                              | READ / `employee.read`             | `EmployeeListQueryDto` / Employee P           | `EmployeesService.list`; `Employee.findMany/count`                              | C / Colaboradores            | none                                                          |
|   8 | `EmployeesController.create`               | `POST /employees`                                             | WRITE / `employee.manage`          | `CreateEmployeeDto` / Employee P              | `EmployeesService.create`; `Employee.create`                                    | C / Novo colaborador         | `EMPLOYEE_CREATED`; create is followed by company contract    |
|   9 | `EmployeesController.find`                 | `GET /employees/:id`                                          | READ / `employee.read`             | path UUID / Employee detail P                 | `EmployeesService.find`; `Employee.findFirst`                                   | C / Colaborador detail       | none; `404` foreign/missing                                   |
|  10 | `EmployeesController.update`               | `PATCH /employees/:id`                                        | WRITE / `employee.manage`          | `UpdateEmployeeDto` / Employee P              | `EmployeesService.update`; `Employee.update`                                    | C / Colaborador detail       | `EMPLOYEE_UPDATED`; `404`, `409` shared-company mutation      |
|  11 | `EmployeesController.activate`             | `PATCH /employees/:id/activate`                               | ACTION / `employee.manage`         | path UUID / Employee P                        | `EmployeesService.setStatus`; `Employee.update`                                 | C / Colaborador detail       | `EMPLOYEE_STATUS_CHANGED`; `404`, `409`                       |
|  12 | `EmployeesController.inactivate`           | `PATCH /employees/:id/inactivate`                             | ACTION / `employee.manage`         | path UUID / Employee P                        | `EmployeesService.setStatus`; contract count + update                           | C / Colaborador detail       | `EMPLOYEE_STATUS_CHANGED`; `404`, `409` active contract       |
|  13 | `EmployeesController.listContracts`        | `GET /employees/:employeeId/contracts`                        | READ / `employee.read`             | path UUID / Contract P                        | `EmployeesService.listContracts`; `EmploymentContract.findMany`                 | C / Contratos do colaborador | none; `404` foreign employee                                  |
|  14 | `EmployeesController.listContacts`         | `GET /employees/:employeeId/contacts`                         | READ / `employee.read`             | path UUID / Contact P                         | `EmployeesService.listContacts`; `EmployeeContact.findMany`                     | C / Contatos                 | none; `404` foreign employee                                  |
|  15 | `EmployeesController.createContact`        | `POST /employees/:employeeId/contacts`                        | WRITE / `employee.manage`          | `CreateEmployeeContactDto` / Contact P        | `EmployeesService.createContact`; contact updateMany/create                     | C / Contatos                 | `EMPLOYEE_UPDATED`; `400` invalid, `409` duplicate/shared     |
|  16 | `EmployeesController.updateContact`        | `PATCH /employees/:employeeId/contacts/:contactId`            | WRITE / `employee.manage`          | `UpdateEmployeeContactDto` / Contact P        | `EmployeesService.updateContact`; contact updateMany/update                     | C / Contatos                 | `EMPLOYEE_UPDATED`; `400`, `404`, `409`                       |
|  17 | `EmployeesController.activateContact`      | `PATCH /employees/:employeeId/contacts/:contactId/activate`   | ACTION / `employee.manage`         | path UUIDs / Contact P                        | `EmployeesService.setContactStatus`; contact update                             | C / Contatos                 | `EMPLOYEE_UPDATED`; `404`, `409`                              |
|  18 | `EmployeesController.inactivateContact`    | `PATCH /employees/:employeeId/contacts/:contactId/inactivate` | ACTION / `employee.manage`         | path UUIDs / Contact P                        | `EmployeesService.setContactStatus`; contact update                             | C / Contatos                 | `EMPLOYEE_UPDATED`; `404`, `409`                              |
|  19 | `EmploymentContractsController.list`       | `GET /employment-contracts`                                   | READ / `contract.read`             | `EmploymentContractListQueryDto` / Contract P | `EmploymentContractsService.list`; contract findMany/count                      | C / Contratos                | none                                                          |
|  20 | `EmploymentContractsController.create`     | `POST /employment-contracts`                                  | WRITE / `contract.manage`          | `CreateEmploymentContractDto` / Contract P    | `EmploymentContractsService.create`; relation lookups + contract/history create | C / Contrato form            | `CONTRACT_CREATED`; `404` relation, `409` foreign/duplicate   |
|  21 | `EmploymentContractsController.find`       | `GET /employment-contracts/:id`                               | READ / `contract.read`             | path UUID / related Contract P                | `EmploymentContractsService.find`; contract findFirst                           | C / Contrato detail          | none; `404` foreign/missing                                   |
|  22 | `EmploymentContractsController.update`     | `PATCH /employment-contracts/:id`                             | WRITE / `contract.manage`          | `UpdateEmploymentContractDto` / Contract P    | `EmploymentContractsService.update`; relation lookup + contract/history update  | C / Contrato form            | `CONTRACT_UPDATED`; `404`, `409`; company/employee immutable  |
|  23 | `EmploymentContractsController.history`    | `GET /employment-contracts/:id/history`                       | READ / `contract.read`             | path UUID / history P                         | `EmploymentContractsService.history`; contract + history select                 | C / Histórico                | none; `404` foreign/missing                                   |
|  24 | `EmploymentContractsController.activate`   | `PATCH /employment-contracts/:id/activate`                    | ACTION / `contract.manage`         | `ContractStatusDto` / Contract P              | `EmploymentContractsService.setStatus`; contract/history update                 | C / Contrato detail          | `CONTRACT_STATUS_CHANGED`; `404`, `409`                       |
|  25 | `EmploymentContractsController.inactivate` | `PATCH /employment-contracts/:id/inactivate`                  | ACTION / `contract.manage`         | `ContractStatusDto` / Contract P              | `EmploymentContractsService.setStatus`; contract/history update                 | C / Contrato detail          | `CONTRACT_STATUS_CHANGED`; `404`, `409`                       |
|  26 | `PayrollParametersController.list`         | `GET /payroll-parameters`                                     | READ / `payroll.parameter.read`    | `PayrollParameterQueryDto` / Parameter P      | `PayrollParametersService.list`; parameter findMany/count                       | C / Parâmetros               | none                                                          |
|  27 | `PayrollParametersController.find`         | `GET /payroll-parameters/:id`                                 | READ / `payroll.parameter.read`    | path UUID / Parameter P                       | `PayrollParametersService.find`; parameter findFirst                            | C / Parâmetro detail         | none; `404` foreign/missing                                   |
|  28 | `PayrollParametersController.create`       | `POST /payroll-parameters`                                    | WRITE / `payroll.parameter.manage` | `CreatePayrollParameterDto` / Parameter P     | `PayrollParametersService.create`; overlap lookup + create                      | C / Parâmetro form           | `PAYROLL_PARAMETER_CREATED`; `409` overlap                    |
|  29 | `PayrollParametersController.update`       | `PATCH /payroll-parameters/:id`                               | WRITE / `payroll.parameter.manage` | `UpdatePayrollParameterDto` / Parameter P     | `PayrollParametersService.update`; use lookup + update                          | C / Parâmetro form           | `PAYROLL_PARAMETER_UPDATED`; `404`, `409` historical use      |
|  30 | `PayrollRubricsController.list`            | `GET /payroll-rubrics`                                        | READ / `payroll.rubric.read`       | `PayrollRubricQueryDto` / Rubric P            | `PayrollRubricsService.list`; rubric findMany/count                             | C / Rubricas                 | none                                                          |
|  31 | `PayrollRubricsController.find`            | `GET /payroll-rubrics/:id`                                    | READ / `payroll.rubric.read`       | path UUID / Rubric P                          | `PayrollRubricsService.find`; rubric findFirst                                  | C / Rubrica detail           | none; `404` foreign/missing                                   |
|  32 | `PayrollRubricsController.create`          | `POST /payroll-rubrics`                                       | WRITE / `payroll.rubric.manage`    | `CreatePayrollRubricDto` / Rubric P           | `PayrollRubricsService.create`; category lookup + rubric/version create         | C / Rubrica form             | `PAYROLL_RUBRIC_CREATED`; `404` category, `409` validity/code |
|  33 | `PayrollRubricsController.update`          | `PATCH /payroll-rubrics/:id`                                  | WRITE / `payroll.rubric.manage`    | `UpdatePayrollRubricDto` / Rubric P           | `PayrollRubricsService.update`; use lookup + update                             | C / Rubrica form             | `PAYROLL_RUBRIC_UPDATED`; `404`, `409` historical use         |

## Capabilities and assignments

Ten company-scoped capabilities were added to the catalog: `company.read`, `company.manage`,
`employee.read`, `employee.manage`, `contract.read`, `contract.manage`,
`payroll.parameter.read`, `payroll.parameter.manage`, `payroll.rubric.read` and
`payroll.rubric.manage`. The catalog therefore contains 29 entries.

The canonical seed creates **zero assignments**. The local-demo grant tool adds the ten P1 entries
to the six previously approved essential capabilities only for the fictitious administrator, using
`MANUAL` provenance, an expiry of at most eight hours, idempotent grant/revoke behavior and audit.
The HR demo account remains the negative control.

## Audit catalog

Fourteen produced event types were added: `COMPANY_CREATED`, `COMPANY_UPDATED`,
`COMPANY_ACTIVATED`, `COMPANY_INACTIVATED`, `EMPLOYEE_CREATED`, `EMPLOYEE_UPDATED`,
`EMPLOYEE_STATUS_CHANGED`, `CONTRACT_CREATED`, `CONTRACT_UPDATED`, `CONTRACT_STATUS_CHANGED`,
`PAYROLL_PARAMETER_CREATED`, `PAYROLL_PARAMETER_UPDATED`, `PAYROLL_RUBRIC_CREATED` and
`PAYROLL_RUBRIC_UPDATED`. All are transaction-required and company-context-required. The runtime
catalog contains 41 event types.

## Tests and acceptance evidence

- static route metadata proves exactly 33 handlers and their explicit capabilities;
- service tests cover validation, company predicates, cross-company relations, safe projections,
  historical immutability and fail-closed audit transactions;
- frontend tests cover restricted navigation and the functional P1 screens;
- `demo:smoke:p1` executes all 33 handlers, plus `401`, HR `403`, cross-company `404`, audit events
  and zero unexpected `5xx`;
- `demo:smoke:essential` must remain `17/17 PASS`;
- PostgreSQL 16 clean setup must apply all 16 existing migrations and the deterministic demo seed.

Final validation evidence on 2026-08-20: `pnpm check` passed; API 82 suites/395 tests (28 skipped),
web 22 files/81 tests, Essential MVP smoke 17/17 and P1 smoke 33/33. Coverage was API 74.84%
lines/72.07% branches and web 78.77% lines/73.30% branches. PostgreSQL 16 applied 16/16
migrations, the catalog contained 29 capabilities and 41 audit event types, and automatic
assignments remained zero.

## Migrations and limitations

Migrations added by P1: **zero**. The existing schema supports the approved behavior.

- BDP-012 remains open; companies are independent and no economic-group authority is inferred.
- `Employee` is a global record in the current schema. Visibility is derived from its contracts;
  mutation is rejected when a record is shared with another company. Creation is completed by
  immediately creating the first company contract.
- Payroll parameter/rubric configuration remains demonstrative. No legal rate, formula or policy was
  introduced.
- P2, P3 and P0-RESIDUAL remain outside this PR.

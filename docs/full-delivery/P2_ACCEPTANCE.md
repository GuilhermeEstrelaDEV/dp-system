# Full Delivery P2 Acceptance

## Scope and outcome

Wave P2 migrates exactly 56 handlers from `LEGACY_DEFERRED` to
`CAPABILITY_PROTECTED`: Organization 24, Admission 19, Leave 5 and Variable Compensation 8. The
delivery is limited to the existing company-local model and does not start P3 or P0-RESIDUAL.

**Status:** `FULL DELIVERY P2 — POST-MERGE VERIFIED`.

- baseline: `develop@ad099b8cf0d223533e5b17d2d69324ce2e562b21`;
- database: 16 existing migrations, zero new migrations;
- routes: 165 total, 4 public, 5 authenticated-only, 120 capability-protected, 36 deferred and
  zero unclassified;
- capabilities: 29 before, 8 added, 37 after;
- audit events: 41 before, 19 produced events added, 60 after;
- automatic assignments: zero.

## Authoritative handler inventory

Legend: all rows were `LEGACY_DEFERRED` before P2 and are now capability-protected. `R`, `W` and
`A` mean read, write and action. `AC` means the authenticated active company. Responses are explicit
minimum projections; no row returns an unrestricted Prisma object. Each family is covered by its
controller/service tests and by `full-delivery-p2-smoke.mjs`.

### Organization — 24/24

All four resources use the shared `OrganizationResourceService`, their resource DTO, the matching
Prisma model, the organization screens and `organization-resource.service.spec.ts`.

|   # | Controller.method        | Verb and route                       | Kind / DTO                 | Projection / model                                                | Company / capability                              | Audit for write                        |
| --: | ------------------------ | ------------------------------------ | -------------------------- | ----------------------------------------------------------------- | ------------------------------------------------- | -------------------------------------- |
|   1 | `Branches.list`          | `GET /branches`                      | R / `OrganizationQueryDto` | page of branch identity, hierarchy and status / `Branch`          | AC filter / `organization.read`                   | —                                      |
|   2 | `Branches.find`          | `GET /branches/:id`                  | R / path                   | branch minimum / `Branch`                                         | AC predicate; foreign = 404 / `organization.read` | —                                      |
|   3 | `Branches.create`        | `POST /branches`                     | W / `CreateBranchDto`      | branch minimum / `Branch`                                         | company derived from AC / `organization.manage`   | `ORGANIZATION_RESOURCE_CREATED`        |
|   4 | `Branches.update`        | `PATCH /branches/:id`                | W / `UpdateBranchDto`      | branch minimum / `Branch`                                         | immutable company / `organization.manage`         | `ORGANIZATION_RESOURCE_UPDATED`        |
|   5 | `Branches.activate`      | `PATCH /branches/:id/activate`       | A / path                   | branch minimum / `Branch`                                         | AC predicate / `organization.manage`              | `ORGANIZATION_RESOURCE_STATUS_CHANGED` |
|   6 | `Branches.inactivate`    | `PATCH /branches/:id/inactivate`     | A / path                   | branch minimum / `Branch`                                         | AC predicate / `organization.manage`              | `ORGANIZATION_RESOURCE_STATUS_CHANGED` |
|   7 | `Departments.list`       | `GET /departments`                   | R / `OrganizationQueryDto` | page of department identity, hierarchy and status / `Department`  | AC filter / `organization.read`                   | —                                      |
|   8 | `Departments.find`       | `GET /departments/:id`               | R / path                   | department minimum / `Department`                                 | AC predicate; foreign = 404 / `organization.read` | —                                      |
|   9 | `Departments.create`     | `POST /departments`                  | W / `CreateDepartmentDto`  | department minimum / `Department`                                 | company derived from AC / `organization.manage`   | `ORGANIZATION_RESOURCE_CREATED`        |
|  10 | `Departments.update`     | `PATCH /departments/:id`             | W / `UpdateDepartmentDto`  | department minimum / `Department`                                 | immutable company / `organization.manage`         | `ORGANIZATION_RESOURCE_UPDATED`        |
|  11 | `Departments.activate`   | `PATCH /departments/:id/activate`    | A / path                   | department minimum / `Department`                                 | AC predicate / `organization.manage`              | `ORGANIZATION_RESOURCE_STATUS_CHANGED` |
|  12 | `Departments.inactivate` | `PATCH /departments/:id/inactivate`  | A / path                   | department minimum / `Department`                                 | AC predicate / `organization.manage`              | `ORGANIZATION_RESOURCE_STATUS_CHANGED` |
|  13 | `Positions.list`         | `GET /positions`                     | R / `OrganizationQueryDto` | page of position identity, hierarchy and status / `Position`      | AC filter / `organization.read`                   | —                                      |
|  14 | `Positions.find`         | `GET /positions/:id`                 | R / path                   | position minimum / `Position`                                     | AC predicate; foreign = 404 / `organization.read` | —                                      |
|  15 | `Positions.create`       | `POST /positions`                    | W / `CreatePositionDto`    | position minimum / `Position`                                     | company derived from AC / `organization.manage`   | `ORGANIZATION_RESOURCE_CREATED`        |
|  16 | `Positions.update`       | `PATCH /positions/:id`               | W / `UpdatePositionDto`    | position minimum / `Position`                                     | immutable company / `organization.manage`         | `ORGANIZATION_RESOURCE_UPDATED`        |
|  17 | `Positions.activate`     | `PATCH /positions/:id/activate`      | A / path                   | position minimum / `Position`                                     | AC predicate / `organization.manage`              | `ORGANIZATION_RESOURCE_STATUS_CHANGED` |
|  18 | `Positions.inactivate`   | `PATCH /positions/:id/inactivate`    | A / path                   | position minimum / `Position`                                     | AC predicate / `organization.manage`              | `ORGANIZATION_RESOURCE_STATUS_CHANGED` |
|  19 | `CostCenters.list`       | `GET /cost-centers`                  | R / `OrganizationQueryDto` | page of cost-center identity, hierarchy and status / `CostCenter` | AC filter / `organization.read`                   | —                                      |
|  20 | `CostCenters.find`       | `GET /cost-centers/:id`              | R / path                   | cost-center minimum / `CostCenter`                                | AC predicate; foreign = 404 / `organization.read` | —                                      |
|  21 | `CostCenters.create`     | `POST /cost-centers`                 | W / `CreateCostCenterDto`  | cost-center minimum / `CostCenter`                                | company derived from AC / `organization.manage`   | `ORGANIZATION_RESOURCE_CREATED`        |
|  22 | `CostCenters.update`     | `PATCH /cost-centers/:id`            | W / `UpdateCostCenterDto`  | cost-center minimum / `CostCenter`                                | immutable company / `organization.manage`         | `ORGANIZATION_RESOURCE_UPDATED`        |
|  23 | `CostCenters.activate`   | `PATCH /cost-centers/:id/activate`   | A / path                   | cost-center minimum / `CostCenter`                                | AC predicate / `organization.manage`              | `ORGANIZATION_RESOURCE_STATUS_CHANGED` |
|  24 | `CostCenters.inactivate` | `PATCH /cost-centers/:id/inactivate` | A / path                   | cost-center minimum / `CostCenter`                                | AC predicate / `organization.manage`              | `ORGANIZATION_RESOURCE_STATUS_CHANGED` |

The optional legacy `companyId` query is compatibility-only and must equal the active company. A
create never trusts a client-supplied company. The implementation is explicitly classified as
**DELIVERY FUNCTIONAL SCOPE — EXISTING COMPANY-LOCAL ORGANIZATIONAL MODEL**; it does not resolve
BDP-002, BDP-012 or BDP-013.

### Admission — 19/19

The frontend consumers are `/admissoes`, admission detail/edit/checklist/documents and checklist
template pages. Tests reside beside each service and exercise explicit projections, foreign-company
404, relationships, audit and transaction rollback.

|   # | Controller.method                  | Verb and route                                          | Kind / DTO                            | Projection / model                                          | Company / capability                            | Audit for write                               |
| --: | ---------------------------------- | ------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------- | --------------------------------------------- |
|   1 | `AdmissionProcesses.list`          | `GET /admission-processes`                              | R / query                             | operational process list / `AdmissionProcess`               | AC contract/employee filter / `admission.read`  | —                                             |
|   2 | `AdmissionProcesses.create`        | `POST /admission-processes`                             | W / `CreateAdmissionProcessDto`       | operational process / `AdmissionProcess`                    | related employee in AC / `admission.manage`     | `ADMISSION_PROCESS_CREATED`                   |
|   3 | `AdmissionProcesses.find`          | `GET /admission-processes/:id`                          | R / path                              | process detail minimum / `AdmissionProcess`                 | AC predicate / `admission.read`                 | —                                             |
|   4 | `AdmissionProcesses.update`        | `PATCH /admission-processes/:id`                        | W / `UpdateAdmissionProcessDto`       | process detail minimum / `AdmissionProcess`                 | AC predicate / `admission.manage`               | `ADMISSION_PROCESS_UPDATED`                   |
|   5 | `AdmissionProcesses.complete`      | `POST /admission-processes/:id/complete`                | A / path                              | process state / `AdmissionProcessHistory`                   | AC predicate / `admission.manage`               | `ADMISSION_PROCESS_STATUS_CHANGED`            |
|   6 | `AdmissionProcesses.cancel`        | `POST /admission-processes/:id/cancel`                  | A / `CancelAdmissionProcessDto`       | process state / `AdmissionProcessHistory`                   | AC predicate / `admission.manage`               | `ADMISSION_PROCESS_STATUS_CHANGED`            |
|   7 | `AdmissionChecklists.get`          | `GET /admission-processes/:id/checklist`                | R / path                              | checklist/item state / `AdmissionChecklistInstance`         | process in AC / `admission.read`                | —                                             |
|   8 | `AdmissionChecklists.fromTemplate` | `POST /admission-processes/:id/checklist/from-template` | W / path                              | checklist/item state / checklist models                     | process and template in AC / `admission.manage` | `ADMISSION_CHECKLIST_CREATED`                 |
|   9 | `AdmissionChecklists.set`          | `PATCH /admission-checklist-items/:id`                  | W / `UpdateAdmissionChecklistItemDto` | item state / `AdmissionChecklistInstanceItem`               | item process in AC / `admission.manage`         | `ADMISSION_CHECKLIST_ITEM_UPDATED`            |
|  10 | `AdmissionDocuments.list`          | `GET /admission-processes/:id/documents`                | R / path                              | logical requirement/status / `AdmissionDocumentRequirement` | process in AC / `admission.read`                | —                                             |
|  11 | `AdmissionDocuments.create`        | `POST /admission-processes/:id/documents`               | W / `CreateAdmissionDocumentDto`      | logical requirement/status / document model                 | process in AC / `admission.manage`              | `ADMISSION_DOCUMENT_CREATED`                  |
|  12 | `AdmissionDocuments.update`        | `PATCH /admission-documents/:id`                        | W / `UpdateAdmissionDocumentDto`      | logical requirement/status / document model                 | process in AC / `admission.manage`              | `ADMISSION_DOCUMENT_UPDATED`                  |
|  13 | `AdmissionDocuments.received`      | `POST /admission-documents/:id/mark-received`           | A / `AdmissionDocumentObservationDto` | logical status / document model                             | process in AC / `admission.manage`              | `ADMISSION_DOCUMENT_UPDATED`                  |
|  14 | `AdmissionDocuments.reviewed`      | `POST /admission-documents/:id/mark-reviewed`           | A / `AdmissionDocumentObservationDto` | logical status / document model                             | process in AC / `admission.manage`              | `ADMISSION_DOCUMENT_UPDATED`                  |
|  15 | `ChecklistTemplates.list`          | `GET /checklist-templates`                              | R / none                              | template/item minimum / `AdmissionChecklistTemplate`        | AC filter / `admission.read`                    | —                                             |
|  16 | `ChecklistTemplates.create`        | `POST /checklist-templates`                             | W / `CreateChecklistTemplateDto`      | template/item minimum / template models                     | company derived from AC / `admission.manage`    | `ADMISSION_CHECKLIST_TEMPLATE_CREATED`        |
|  17 | `ChecklistTemplates.find`          | `GET /checklist-templates/:id`                          | R / path                              | template/item minimum / template models                     | AC predicate / `admission.read`                 | —                                             |
|  18 | `ChecklistTemplates.activate`      | `PATCH /checklist-templates/:id/activate`               | A / path                              | template state / template model                             | AC predicate / `admission.manage`               | `ADMISSION_CHECKLIST_TEMPLATE_STATUS_CHANGED` |
|  19 | `ChecklistTemplates.inactivate`    | `PATCH /checklist-templates/:id/inactivate`             | A / path                              | template state / template model                             | AC predicate / `admission.manage`               | `ADMISSION_CHECKLIST_TEMPLATE_STATUS_CHANGED` |

Notes/free text and raw DTOs never enter audit metadata. BDP-001 and BDP-011 remain pending; the
delivery does not add real documents or broaden personal-data exposure.

### Leave — 5/5

The consumer is `/movimentacoes/afastamentos`, implemented with the shared table standard. The seven
vacation handlers in the same controller remain deferred for P3.

|   # | Controller.method                 | Verb and route                 | Kind / DTO                         | Projection / model                                      | Company / capability                     | Audit for write       |
| --: | --------------------------------- | ------------------------------ | ---------------------------------- | ------------------------------------------------------- | ---------------------------------------- | --------------------- |
|   1 | `VacationsLeaves.listTypes`       | `GET /leave-types`             | R / optional compatibility company | code, name, return requirement and status / `LeaveType` | AC filter / `leave.read`                 | —                     |
|   2 | `VacationsLeaves.createType`      | `POST /leave-types`            | W / `CreateLeaveTypeDto`           | type minimum / `LeaveType`                              | company derived from AC / `leave.manage` | `LEAVE_TYPE_CREATED`  |
|   3 | `VacationsLeaves.listCases`       | `GET /leave-cases`             | R / optional contract              | dates, state and operational relation / `LeaveCase`     | AC contract filter / `leave.read`        | —                     |
|   4 | `VacationsLeaves.createCase`      | `POST /leave-cases`            | W / `CreateLeaveCaseDto`           | case minimum / `LeaveCase`                              | contract and type in AC / `leave.manage` | `LEAVE_CASE_CREATED`  |
|   5 | `VacationsLeaves.returnFromLeave` | `POST /leave-cases/:id/return` | A / `ReturnFromLeaveDto`           | returned case minimum / `LeaveCase`                     | AC predicate / `leave.manage`            | `LEAVE_CASE_RETURNED` |

Medical reason, diagnosis and classification are omitted from responses and audit. BDP-011 remains
pending.

### Variable Compensation — 8/8

The consumer is `/folha/remuneracao-variavel`; it exposes only the modeled administrative records
and performs no calculation.

|   # | Controller.method                           | Verb and route                                   | Kind / DTO                               | Projection / model                                           | Company / capability                               | Audit for write                       |
| --: | ------------------------------------------- | ------------------------------------------------ | ---------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------- | ------------------------------------- |
|   1 | `VariableCompensation.listEvents`           | `GET /variable-compensation/events`              | R / contract query                       | event operational minimum / `VariableCompensationEvent`      | contract in AC / `variable_compensation.read`      | —                                     |
|   2 | `VariableCompensation.createEvent`          | `POST /variable-compensation/events`             | W / `CreateVariableCompensationEventDto` | event operational minimum / same                             | contract in AC / `variable_compensation.manage`    | `VARIABLE_COMPENSATION_EVENT_CREATED` |
|   3 | `VariableCompensation.listAdvances`         | `GET /variable-compensation/advances`            | R / contract query                       | advance operational minimum / `SalaryAdvance`                | contract in AC / `variable_compensation.read`      | —                                     |
|   4 | `VariableCompensation.createAdvance`        | `POST /variable-compensation/advances`           | W / `CreateSalaryAdvanceDto`             | advance operational minimum / same                           | contract in AC / `variable_compensation.manage`    | `SALARY_ADVANCE_CREATED`              |
|   5 | `VariableCompensation.listOffCycle`         | `GET /variable-compensation/off-cycle-payments`  | R / contract query                       | payment operational minimum / `OffCyclePayment`              | contract in AC / `variable_compensation.read`      | —                                     |
|   6 | `VariableCompensation.createOffCycle`       | `POST /variable-compensation/off-cycle-payments` | W / `CreateOffCyclePaymentDto`           | payment operational minimum / same                           | contract in AC / `variable_compensation.manage`    | `OFF_CYCLE_PAYMENT_CREATED`           |
|   7 | `VariableCompensation.listReconciliations`  | `GET /variable-compensation/reconciliations`     | R / payroll-run query                    | reconciliation operational minimum / `PayrollReconciliation` | payroll run in AC / `variable_compensation.read`   | —                                     |
|   8 | `VariableCompensation.createReconciliation` | `POST /variable-compensation/reconciliations`    | W / `CreatePayrollReconciliationDto`     | reconciliation operational minimum / same                    | payroll run in AC / `variable_compensation.manage` | `PAYROLL_RECONCILIATION_CREATED`      |

BDP-006 and BDP-011 remain pending. No commission rule, percentage, incidence, formula or legal
policy was introduced.

## Capabilities and assignments

The existing naming convention supports one read/manage pair per coherent family; per-endpoint or
per-organization-resource capabilities would add complexity without a different security boundary.

| Capability                     | Scope   | Purpose                                                              |
| ------------------------------ | ------- | -------------------------------------------------------------------- |
| `organization.read`            | company | Read company-local branches, departments, positions and cost centers |
| `organization.manage`          | company | Create, edit and change status for those resources                   |
| `admission.read`               | company | Read admission workflow, logical documents and checklists            |
| `admission.manage`             | company | Operate admission workflow, logical documents and checklists         |
| `leave.read`                   | company | Read leave types and cases                                           |
| `leave.manage`                 | company | Create leave records and register return                             |
| `variable_compensation.read`   | company | Read modeled variable-compensation records                           |
| `variable_compensation.manage` | company | Create modeled variable-compensation records                         |

No capability is assigned by the canonical seed. `demo:access:grant` adds the P2 capabilities only
to the fictitious `ADMINISTRATOR`, with `MANUAL` source, at most eight hours, audit, idempotency and
revocation. The fictitious `HR` user is the negative control.

## Projection, audit and transaction guarantees

All P2 reads use explicit selections and active-company predicates. Writes authorize again in the
application service and record `actorId`, `companyId`, `traceId`, event type and identifier-only
metadata in the same transaction as the business mutation. The 19 new event types have real
producers, catalog/verifier tests and deny-by-default metadata. Names, email, tax/document numbers,
amount details, medical reason, notes, request bodies, response bodies and raw DTOs are not stored in
audit metadata.

## Frontend and PR #94 table standard

- Organization reuses `ResourcePage`, `DataTable`, `DataTableActions` and `DataTableStatus`, with a
  shared organization navigation and cache keys isolated by active company.
- Admission, Leave and Variable Compensation use the same shared table primitives whenever the
  surface is tabular.
- Every P2 table keeps `ui-table-scroll`, regular cell/header spacing, controlled long-text wrapping,
  compact identifier/date/status columns, row separation and action containers with gap/wrap.
- Detail remains visible with read capability; create/edit/status/action controls require the manage
  capability. P3 vacation controls remain unavailable.
- Structural and visual comparison targets are Companies, Employees, Contracts, Payroll Parameters
  and Payroll Rubrics; no P2 table duplicates table CSS.

## Acceptance evidence

| Evidence                                 | Result     |
| ---------------------------------------- | ---------- |
| Organization handlers                    | 24/24      |
| Admission handlers                       | 19/19      |
| Leave handlers                           | 5/5        |
| Variable Compensation handlers           | 8/8        |
| Essential smoke                          | 17/17 PASS |
| P1 smoke                                 | 33/33 PASS |
| P2 smoke                                 | 56/56 PASS |
| HR negative / 401 / 403                  | PASS       |
| Horizon versus Atlas / cross-company 404 | PASS       |
| Projection / audit / rollback            | PASS       |
| Unexpected 5xx                           | zero       |
| Frontend tests, typecheck and build      | PASS       |
| PR #94 table standard                    | PASS       |
| PostgreSQL 16 clean setup and seed       | PASS       |
| New migrations                           | zero       |

## Remaining scope and risks

P3 retains 21 handlers and P0-RESIDUAL retains 15. BDP-001, BDP-002, BDP-006, BDP-011, BDP-012
and BDP-013 are not resolved by P2. The delivery therefore supports the existing local demonstrative
model only; production, cloud, legal policy expansion and later waves remain unauthorized.

# Full Delivery P3 Acceptance

## Scope and outcome

Wave P3 migrates exactly 21 handlers from `LEGACY_DEFERRED` to
`CAPABILITY_PROTECTED`: Time 8, Benefit 6 and Vacation 7. It reuses the existing operational model
without defining working-time, benefit, vacation or legal policy. P0-RESIDUAL was outside this
wave's baseline and is now post-merge verified in its own acceptance record.

**Status:** `FULL DELIVERY P3 — POST-MERGE VERIFIED`.

- baseline: `develop@627ebce4e11b1ad06d434c0fe1dde9da00c043dc`;
- database: 16 existing migrations, zero new migrations;
- routes: 165 total, 4 public, 5 authenticated-only, 141 capability-protected, 15 deferred and
  zero unclassified;
- capabilities: 37 before, 6 added, 43 after;
- audit events: 60 before, 14 produced events added, 74 after;
- automatic assignments: zero.

## Authoritative handler inventory

Legend: all rows were `LEGACY_DEFERRED` before P3 and are now capability-protected. `R`, `W` and
`A` mean read, write and action. `AC` means the authenticated active company. Responses use
explicit projections and no row returns an unrestricted Prisma record. Controller, service,
authorization, frontend and smoke tests cover each family.

### Time — 8/8

The consumer is `/jornada`. Existing schedule, assignment, holiday, entry, balance and closing
models are reused; no time calculation, overtime policy or legal rule is introduced.

|   # | Controller.method               | Verb and route                                  | Kind / DTO               | Projection / model                            | Company / capability                        | Audit for write          |
| --: | ------------------------------- | ----------------------------------------------- | ------------------------ | --------------------------------------------- | ------------------------------------------- | ------------------------ |
|   1 | `TimeManagement.schedules`      | `GET /work-schedules`                           | R / compatibility query  | schedule and periods / `WorkSchedule`         | AC filter / `time.read`                     | —                        |
|   2 | `TimeManagement.createSchedule` | `POST /work-schedules`                          | W / `CreateScheduleDto`  | schedule and periods / `WorkSchedule`         | company derived from AC / `time.manage`     | `WORK_SCHEDULE_CREATED`  |
|   3 | `TimeManagement.assign`         | `POST /employment-contracts/:id/work-schedules` | W / `AssignScheduleDto`  | assignment minimum / `WorkScheduleAssignment` | contract in AC / `time.manage`              | `WORK_SCHEDULE_ASSIGNED` |
|   4 | `TimeManagement.holiday`        | `POST /holidays`                                | W / `CreateHolidayDto`   | holiday minimum / `Holiday`                   | company derived from AC / `time.manage`     | `HOLIDAY_CREATED`        |
|   5 | `TimeManagement.entries`        | `GET /time-entries`                             | R / optional contract    | timestamps and source / `TimeEntry`           | AC contract filter / `time.read`            | —                        |
|   6 | `TimeManagement.entry`          | `POST /time-entries`                            | W / `CreateTimeEntryDto` | entry minimum / `TimeEntry`                   | contract in AC / `time.manage`              | `TIME_ENTRY_CREATED`     |
|   7 | `TimeManagement.balance`        | `GET /employment-contracts/:id/time-balance`    | R / path                 | balance entries / `TimeBalanceEntry`          | contract in AC; foreign = 404 / `time.read` | —                        |
|   8 | `TimeManagement.close`          | `POST /time-balance-closings`                   | W / `CloseBalanceDto`    | closing minimum / `TimeBalanceClosing`        | company derived from AC / `time.manage`     | `TIME_BALANCE_CLOSED`    |

The optional legacy company identifier is compatibility-only and must match the active company.
Closing preserves the existing competency and balance rules and does not create a new formula.

### Benefit — 6/6

The consumer is `/beneficios`. The delivery manages only the benefit, plan and enrollment records
already modeled. It does not define eligibility, taxation, payroll incidence or contribution rules.

|   # | Controller.method                 | Verb and route                                    | Kind / DTO                      | Projection / model                                    | Company / capability                           | Audit for write                     |
| --: | --------------------------------- | ------------------------------------------------- | ------------------------------- | ----------------------------------------------------- | ---------------------------------------------- | ----------------------------------- |
|   1 | `Benefits.list`                   | `GET /benefits`                                   | R / `BenefitsQueryDto`          | benefit and active plans / `Benefit`                  | AC filter / `benefit.read`                     | —                                   |
|   2 | `Benefits.listEnrollments`        | `GET /benefits/enrollments/:employmentContractId` | R / path                        | enrollment, benefit and history / `BenefitEnrollment` | contract in AC; foreign = 404 / `benefit.read` | —                                   |
|   3 | `Benefits.create`                 | `POST /benefits`                                  | W / `CreateBenefitDto`          | benefit minimum / `Benefit`                           | company derived from AC / `benefit.manage`     | `BENEFIT_CREATED`                   |
|   4 | `Benefits.plan`                   | `POST /benefits/plans`                            | W / `CreatePlanDto`             | plan minimum / `BenefitPlan`                          | benefit in AC / `benefit.manage`               | `BENEFIT_PLAN_CREATED`              |
|   5 | `Benefits.enroll`                 | `POST /benefits/enrollments`                      | W / `CreateEnrollmentDto`       | enrollment minimum / `BenefitEnrollment`              | contract and benefit in AC / `benefit.manage`  | `BENEFIT_ENROLLMENT_CREATED`        |
|   6 | `Benefits.changeEnrollmentStatus` | `PATCH /benefits/enrollments/:id`                 | A / `ChangeEnrollmentStatusDto` | enrollment minimum / `BenefitEnrollment`              | enrollment in AC / `benefit.manage`            | `BENEFIT_ENROLLMENT_STATUS_CHANGED` |

Free-text reasons are not returned in projections or copied to audit metadata. Existing effective
date and overlap validations remain unchanged.

### Vacation — 7/7

The consumer is `/ferias`. The five Leave handlers delivered in P2 remain protected by
`leave.read/manage`; this inventory covers only the seven Vacation handlers formerly deferred.

|   # | Controller.method                  | Verb and route                        | Kind / DTO                        | Projection / model                                 | Company / capability                          | Audit for write               |
| --: | ---------------------------------- | ------------------------------------- | --------------------------------- | -------------------------------------------------- | --------------------------------------------- | ----------------------------- |
|   1 | `VacationsLeaves.listPeriods`      | `GET /vacation-periods`               | R / optional contract             | period operational minimum / `VacationPeriod`      | AC contract filter / `vacation.read`          | —                             |
|   2 | `VacationsLeaves.createPeriod`     | `POST /vacation-periods`              | W / `CreateVacationPeriodDto`     | period minimum / `VacationPeriod`                  | contract in AC / `vacation.manage`            | `VACATION_PERIOD_CREATED`     |
|   3 | `VacationsLeaves.listRequests`     | `GET /vacation-requests`              | R / optional contract             | request, period and history / `VacationRequest`    | AC contract filter / `vacation.read`          | —                             |
|   4 | `VacationsLeaves.createRequest`    | `POST /vacation-requests`             | W / `CreateVacationRequestDto`    | request minimum / `VacationRequest`                | period and contract in AC / `vacation.manage` | `VACATION_REQUEST_CREATED`    |
|   5 | `VacationsLeaves.approve`          | `POST /vacation-requests/:id/approve` | A / `DecisionDto`                 | request minimum / `VacationRequest`                | request in AC / `vacation.manage`             | `VACATION_REQUEST_APPROVED`   |
|   6 | `VacationsLeaves.cancel`           | `POST /vacation-requests/:id/cancel`  | A / `DecisionDto`                 | request minimum / `VacationRequest`                | request in AC / `vacation.manage`             | `VACATION_REQUEST_CANCELLED`  |
|   7 | `VacationsLeaves.createCollective` | `POST /collective-vacations`          | W / `CreateCollectiveVacationDto` | collective vacation minimum / `CollectiveVacation` | company derived from AC / `vacation.manage`   | `COLLECTIVE_VACATION_CREATED` |

Request reason, cancellation reason and notes remain outside response and audit projections. The
delivery preserves current domain validations and does not infer accrual, notice, payment or legal
policy.

## Capabilities and assignments

| Capability        | Scope   | Purpose                                                      |
| ----------------- | ------- | ------------------------------------------------------------ |
| `time.read`       | company | Read schedules, entries and balances in the active company   |
| `time.manage`     | company | Manage schedules, entries, holidays and balance closings     |
| `benefit.read`    | company | Read benefit catalog, plans and enrollments                  |
| `benefit.manage`  | company | Manage benefits, plans, enrollments and enrollment status    |
| `vacation.read`   | company | Read vacation periods and requests                           |
| `vacation.manage` | company | Manage periods, requests, decisions and collective vacations |

No capability is assigned by the canonical seed. `demo:access:grant` grants all 30 approved demo
capabilities only to the fictitious `ADMINISTRATOR`, with `MANUAL` source, at most eight hours,
audit, idempotency and revocation. The fictitious `HR` user receives none of these assignments and
remains the negative control.

## Projection, isolation, audit and transaction guarantees

All P3 lookups include the active-company predicate before resource resolution. Related contracts,
benefits, periods and requests must belong to that company; a foreign resource is indistinguishable
from a missing one and returns `404`. Missing or invalid identity returns `401`; missing capability
returns `403` before the service executes.

All responses are selected through explicit Prisma projections. Critical writes record `actorId`,
`companyId`, `traceId`, event type and identifier-only metadata in `AuditLog` in the same transaction
as the business mutation. Failure to append audit evidence rolls back the mutation. Names, document
numbers, amounts, notes, reasons, DTOs and response bodies are excluded from audit metadata.

## Frontend and PR #94 table standard

- Time, Benefit and Vacation use `DataTable`, `DataTableActions` and `DataTableStatus` for tabular
  surfaces, preserving horizontal overflow, cell/header spacing, row separation and readable wrap.
- Small identifiers, dates and statuses remain compact; long text can wrap without squeezing action
  cells. Actions use the shared flex container with gap and wrap.
- Read surfaces require the family read capability; create and action controls are visible only with
  the family manage capability. The backend remains the authorization authority.
- Cache keys include the active company. The implementation was compared with Companies, Employees,
  Contracts, Payroll Parameters and Payroll Rubrics and introduces no independent table CSS.

## Acceptance evidence

| Evidence                                 | Required result |
| ---------------------------------------- | --------------- |
| Time handlers                            | 8/8             |
| Benefit handlers                         | 6/6             |
| Vacation handlers                        | 7/7             |
| Essential smoke                          | 17/17 PASS      |
| P1 smoke                                 | 33/33 PASS      |
| P2 smoke                                 | 56/56 PASS      |
| P3 smoke                                 | 21/21 PASS      |
| HR negative / 401 / 403                  | PASS            |
| Horizon versus Atlas / cross-company 404 | PASS            |
| Projection / audit / rollback            | PASS            |
| Unexpected 5xx                           | zero            |
| Frontend tests, typecheck and build      | PASS            |
| PR #94 table standard                    | PASS            |
| PostgreSQL 16 clean setup and seed       | PASS            |
| New migrations                           | zero            |

## Remaining scope and risks

P0-RESIDUAL retains fifteen handlers. Pending business decisions remain pending, including working
time, benefit, vacation, privacy and payroll policies already recorded by the project. P3 implements
only the existing company-local demonstrative model; it does not authorize production, cloud,
external deployment, new legal rules, expanded masking, new integrations or legacy removal.

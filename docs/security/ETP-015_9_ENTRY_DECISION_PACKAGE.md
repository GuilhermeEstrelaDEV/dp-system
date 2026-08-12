# ETP-015.9 — Entry Decision Package

**Status:** `ENTRY DECISIONS RECORDED — FUNCTIONAL IMPLEMENTATION NOT AUTHORIZED`

**Resulting governance state:** `ETP-015.9 ENTRY DECISIONS RECORDED — FUNCTIONAL IMPLEMENTATION NOT AUTHORIZED`

**Implementation state:** `NOT STARTED — NOT AUTHORIZED`

**Baseline:** `origin/develop@68238b6830f293da8ac86066e53bf1b1dc2edc6e`

**Preparation date:** 2026-08-12

**Decision date:** 2026-08-12

**Decision authority:** responsible for ETP-015.9 entry decisions

## Purpose and binding limits

This package converts the [entry readiness assessment](ETP-015_9_ENTRY_READINESS.md) into six
explicit human decisions. The decisions were recorded by the responsible authority on 2026-08-12.
They do not approve a candidate capability, appoint an owner, resolve a pending BDP, authorize a
functional rollout, start Gate D, or change runtime.

The following remain binding:

- ETP-015.8 is `COMPLETED — POST-MERGE VERIFIED`;
- Gate B and Gate C are `APPROVED`;
- ETP-015.9 and ETP-015.10 are `NOT STARTED — NOT AUTHORIZED`;
- Gate D is `NOT STARTED — NOT APPROVED`;
- production, cloud, deploy, global enforcement, and legacy removal are `NOT AUTHORIZED`.

## Authoritative inventory

| Invariant            | Value |
| -------------------- | ----: |
| Runtime handlers     |   165 |
| Public               |     4 |
| Authenticated        |     5 |
| Capability protected |    31 |
| Legacy deferred      |   125 |
| Blocked unclassified |     0 |
| Capability catalog   |    19 |
| Audit event catalog  |    27 |
| Migrations           |    16 |

The historical inventory has 163 handlers. The two later runtime handlers are
`AuthController#logout` (`POST /auth/logout`) and `DashboardController#summary`
(`GET /dashboard/summary`). They are authenticated transversal/projection surfaces explicitly
classified by ETP-015.4. They are not rollout proof handlers and must not be silently assigned to a
legacy family. No runtime change is required to reconcile this historical difference.

The 125 deferred handlers remain decomposed as P1 33, P2 56, P3 21, and residual P0 15. P4 is only
a preservation/reconciliation proposal without runtime work.

## Decision register

| ID    | Decision                                                   | Evidence                                                         | Status                                                  |
| ----- | ---------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------- |
| ED-01 | allocate the 15 residual P0 handlers                       | residual inventory below                                         | `APPROVED — PRESERVE / DEFER`                           |
| ED-02 | approve capabilities and operation classes per family      | [capability matrix](ETP-015_9_CAPABILITY_DECISION_MATRIX.md)     | `APPROVED — NO CAPABILITY EXPANSION`                    |
| ED-03 | approve data projection, sensitivity, and audit per family | [data/audit matrix](ETP-015_9_DATA_AND_AUDIT_DECISION_MATRIX.md) | `APPROVED — PRESERVE CURRENT DATA/AUDIT POLICY`         |
| ED-04 | assign owners and required approvers                       | [owner matrix](ETP-015_9_OWNER_AND_APPROVER_MATRIX.md)           | `APPROVED — ROLE REQUIREMENTS DEFINED / OWNERS PENDING` |
| ED-05 | select the first rollout and its evidence gate             | [first-wave options](ETP-015_9_FIRST_WAVE_OPTIONS.md)            | `APPROVED — COMPANY AS FIRST CANDIDATE ONLY`            |
| ED-06 | confirm P4 as preservation/reconciliation only             | P4 decision below                                                | `APPROVED — PRESERVATION / RECONCILIATION ONLY`         |

Approval in this register records the governance boundary. It does not authorize functional
implementation, approve a candidate capability, resolve a pending BDP, or start Gate D.

## ED-01 — Residual P0 allocation

All entries remain `LEGACY_DEFERRED`. Candidate capability names originate in the historical
inventory and are not approved catalog codes.

| Controller#method                   | Verb and route                       | Current classification | Canonical overlap                                                               | Known consumer                       | Parallel-rule risk                                    | BDP dependency                                           | Potential related capability                                                  | Existing audit decision                                    | Proposed destination options                                    | Human decision     |
| ----------------------------------- | ------------------------------------ | ---------------------- | ------------------------------------------------------------------------------- | ------------------------------------ | ----------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------- | ------------------ |
| `PayrollPeriodsController#list`     | `GET /payroll-periods`               | `LEGACY_DEFERRED`      | canonical period aggregate/history exists, but this list contract is legacy     | `/folha/competencias`                | medium: unsafe global/company query                   | BDP-014 approved; BDP-011 limits fields                  | `payroll.period.close.view` exists; `payroll.period.view` is only a candidate | closure history policy does not approve this read          | A: existing wave; B: governed P0.1; C: preserve/defer; D: block | `PRESERVE / DEFER` |
| `PayrollPeriodsController#create`   | `POST /payroll-periods`              | `LEGACY_DEFERRED`      | `PayrollPeriod` is canonical, but creation is outside closure commands          | `/folha/competencias`                | high: mutation outside approved closure orchestration | BDP-014 approved; calendar/type policy not approved here | `payroll.period.manage` candidate only                                        | no approved create event                                   | A/B/C/D                                                         | `PRESERVE / DEFER` |
| `PayrollPeriodsController#find`     | `GET /payroll-periods/:id`           | `LEGACY_DEFERRED`      | canonical aggregate exists; safe general detail projection not approved         | `/folha/competencias`                | medium: lookup/enumeration before company scope       | BDP-014 approved; BDP-011 limits fields                  | existing closure view/history may not authorize general detail                | closure read policy is narrower                            | A/B/C/D                                                         | `PRESERVE / DEFER` |
| `PayrollPeriodsController#update`   | `PATCH /payroll-periods/:id`         | `LEGACY_DEFERRED`      | canonical close/reopen exists; general update is separate                       | `/folha/competencias`                | critical: can conflict with immutable closed state    | BDP-014 approved                                         | `payroll.period.manage` candidate only                                        | no approved update event                                   | A/B/C/D                                                         | `PRESERVE / DEFER` |
| `PayrollPeriodsController#open`     | `POST /payroll-periods/:id/open`     | `LEGACY_DEFERRED`      | controlled reopen is canonical only for `CLOSED -> OPEN`                        | `/folha/competencias`                | critical: may bypass controlled reopen evidence       | BDP-014 approved and binding                             | `payroll.period.close.reopen` exists only for controlled reopen               | `PAYROLL_PERIOD_REOPENED` applies only to canonical reopen | A/B/C/D                                                         | `PRESERVE / DEFER` |
| `PayrollPeriodsController#validate` | `POST /payroll-periods/:id/validate` | `LEGACY_DEFERRED`      | closure readiness is canonical, but legacy validate semantics differ            | `/folha/competencias`                | high: competing readiness/validation rule             | BDP-014 approved                                         | `payroll.period.close.readiness` exists; reuse is not approved                | no separate approved validation event                      | A/B/C/D                                                         | `PRESERVE / DEFER` |
| `PayrollInputsController#list`      | `GET /payroll-inputs`                | `LEGACY_DEFERRED`      | inputs feed canonical run/closure but no canonical authorization wrapper exists | `/folha/lancamentos`                 | high: financial data and client company filters       | BDP-001/004/005/006/011 material                         | `payroll.input.view` candidate only                                           | sensitive-read classification absent                       | A/B/C/D                                                         | `PRESERVE / DEFER` |
| `PayrollInputsController#create`    | `POST /payroll-inputs`               | `LEGACY_DEFERRED`      | canonical closure immutability constrains writes                                | `/folha/lancamentos`                 | critical: write can affect payroll totals             | BDP-004/005/006 material                                 | `payroll.input.manage` candidate only                                         | critical-write event absent                                | A/B/C/D                                                         | `PRESERVE / DEFER` |
| `PayrollInputsController#find`      | `GET /payroll-inputs/:id`            | `LEGACY_DEFERRED`      | no approved canonical read projection                                           | `/folha/lancamentos`                 | high: financial resource enumeration                  | BDP-001/004/005/011 material                             | `payroll.input.view` candidate only                                           | sensitive-read classification absent                       | A/B/C/D                                                         | `PRESERVE / DEFER` |
| `PayrollInputsController#update`    | `PATCH /payroll-inputs/:id`          | `LEGACY_DEFERRED`      | must preserve closed-period immutability                                        | `/folha/lancamentos`                 | critical: mutation/parallel close rule                | BDP-004/005/006 material                                 | `payroll.input.manage` candidate only                                         | critical-write event absent                                | A/B/C/D                                                         | `PRESERVE / DEFER` |
| `PayrollRunsController#list`        | `GET /payroll-runs`                  | `LEGACY_DEFERRED`      | runs are referenced by canonical closure/history                                | `/folha/execucoes` and review flows  | high: totals/version metadata                         | BDP-004/005/006/011 material                             | `payroll.run.view` candidate only                                             | sensitive-read classification absent                       | A/B/C/D                                                         | `PRESERVE / DEFER` |
| `PayrollRunsController#start`       | `POST /payroll-runs`                 | `LEGACY_DEFERRED`      | canonical closure consumes run but does not authorize run creation              | `/folha/execucoes`                   | critical: starts technical payroll execution          | BDP-004/005/006 material                                 | `payroll.run.manage` candidate only                                           | critical-write event absent                                | A/B/C/D                                                         | `PRESERVE / DEFER` |
| `PayrollRunsController#find`        | `GET /payroll-runs/:id`              | `LEGACY_DEFERRED`      | canonical history exposes only a minimal run reference                          | `/folha/execucoes` and review detail | high: totals and technical evidence                   | BDP-001/004/005/011 material                             | `payroll.run.view` candidate only                                             | sensitive-read classification absent                       | A/B/C/D                                                         | `PRESERVE / DEFER` |
| `PayrollRunsController#messages`    | `GET /payroll-runs/:id/messages`     | `LEGACY_DEFERRED`      | closure readiness consumes blockers/warnings internally                         | `/folha/execucoes`                   | high: operational/free-text content                   | BDP-006/011 material                                     | `payroll.run.view` candidate only                                             | sensitive-read classification absent                       | A/B/C/D                                                         | `PRESERVE / DEFER` |
| `PayrollRunsController#addMessage`  | `POST /payroll-runs/:id/messages`    | `LEGACY_DEFERRED`      | canonical readiness reads messages but does not own their authoring             | `/folha/execucoes`                   | critical: may affect blocker outcome                  | BDP-006 and audit policy material                        | `payroll.run.manage` candidate only                                           | critical-write event absent                                | A/B/C/D                                                         | `PRESERVE / DEFER` |

Allowed human options for each handler are: A, move to an existing approved wave; B, approve a
separate governed Residual-P0/P0.1 sub-scope; C, `PRESERVE / DEFER`; or D, `BLOCKED` pending a
specific decision. This package does not select an option or create an official wave.

The human decision applies option C, `PRESERVE / DEFER`, to all 15 handlers in this inventory. No
handler is authorized for functional rollout. A future allocation requires a separately governed
scope with approved capability, audit, projection, BDP dependencies, and canonical-overlap proof.

**ED-01 status:** `APPROVED — PRESERVE / DEFER`.

## ED-02 — Capability and operation classification

The [capability decision matrix](ETP-015_9_CAPABILITY_DECISION_MATRIX.md) inventories read, write,
action, reuse, segregation, and escalation questions for every family. Its candidate names are
non-binding. The existing catalog remains unchanged at 19 codes.

No new domain capability is approved. The 19 existing codes remain unchanged, all candidate names
remain `NON-BINDING CANDIDATE NAME`, and `payroll.period.close.*`, `platform.read`, and
`platform.manage` must not be semantically expanded beyond their approved contracts. Each family
requires a later material-dependency and segregation review.

**ED-02 status:** `APPROVED — NO CAPABILITY EXPANSION`.

## ED-03 — Sensitive data, projection, and audit classification

The [data and audit matrix](ETP-015_9_DATA_AND_AUDIT_DECISION_MATRIX.md) records current DTO/contract
categories without real data. It preserves the ETP-015.6 minimum projections and the limits of
BDP-001/011. It does not decide masking, retention, export, DLP, or final privacy classification.

No data exposure, masking, retention, export, DLP, legal classification, or audit-event expansion is
approved. Existing projections and omissions remain binding, fields dependent on pending BDPs
remain omitted or blocked, and the audit catalog remains at 27 events. Every future functional
family requires an explicit data and audit classification before rollout.

**ED-03 status:** `APPROVED — PRESERVE CURRENT DATA/AUDIT POLICY`.

## ED-04 — Owners and approvers

The [owner and approver matrix](ETP-015_9_OWNER_AND_APPROVER_MATRIX.md) contains roles only. Every
accountable and engineering owner remains `PENDING HUMAN ASSIGNMENT`; no person is inferred.

Accountable owners remain `PENDING HUMAN ASSIGNMENT`. Every future functional rollout requires
Engineering, Security, Product, and the family's operational owner. DP is mandatory for employment,
payroll, remuneration, benefit, time, vacation, admission, leave, or functional-data scope.
Jurídico/DPO is mandatory when a material legal, privacy, or sensitive-data decision remains to be
homologated.

**ED-04 status:** `APPROVED — ROLE REQUIREMENTS DEFINED / OWNERS PENDING`.

## ED-05 — First rollout family and evidence gate

The [first-wave options](ETP-015_9_FIRST_WAVE_OPTIONS.md) rank four non-binding possibilities.
Company is recorded only as `FIRST FUNCTIONAL CANDIDATE — NOT AUTHORIZED`. Its entry requires an
approved BDP-012 resolution or delimitation, global-versus-active-company scope, capability and data
projection, audit events, accountable owner, consumer inventory, evidenced Definition of Ready,
rollback, and evidence gate. Until then, `NO FUNCTIONAL ROLLOUT AUTHORIZED`.

**ED-05 status:** `APPROVED — COMPANY AS FIRST CANDIDATE ONLY`.

## ED-06 — P4 preservation/reconciliation

**Decision:** preserve the explicitly approved public routes, authenticated surfaces, and already
capability-protected families; reconcile runtime inventory, OpenAPI, and documentation. P4 must not
change runtime, capability, grants, assignments, projection, audit events, company rules, or routes.

**Status:** `APPROVED — PRESERVATION / RECONCILIATION ONLY`.

P4 is not an implemented rollout and cannot satisfy a Gate D checkbox by itself.

## BDP dependencies

The [BDP dependency matrix](ETP-015_9_BDP_DEPENDENCY_MATRIX.md) is binding for this package's
blocker analysis. BDP-009, BDP-014, and BDP-AUTH-LEGACY are approved. BDP-001–008 and BDP-010–013
remain pending. An approved transversal BDP does not approve a family capability or expose a field
blocked by a pending material BDP.

## Human decision record

### ED-01 Residual P0

Decision: all 15 handlers remain `PRESERVE / DEFER`; no functional rollout authorized.

Approver role: responsible for ETP-015.9 entry decisions.

Date: 2026-08-12.

Conditions: separately governed future scope with approved capability, audit, projection, BDP
dependencies, and canonical-overlap proof.

### ED-02 Capabilities

Decision per family: no new capability; 19 existing codes unchanged; candidate names remain
non-binding; no semantic expansion of existing codes.

Approver role: responsible for ETP-015.9 entry decisions.

Date: 2026-08-12.

Conditions: family-specific material-dependency and segregation review before any approval.

### ED-03 Data/Audit

Decision per family: preserve current projections, omissions, and audit policy; no exposure or
catalog expansion.

Approver roles: responsible for ETP-015.9 entry decisions; future family reviews follow ED-04.

Date: 2026-08-12.

Conditions: pending-BDP fields remain omitted or blocked; explicit family classification required.

### ED-04 Owners

Owner per family: `PENDING HUMAN ASSIGNMENT`.

Required approvers: Engineering, Security, Product, and operational owner; DP and Jurídico/DPO when
the documented applicability conditions are met.

Date: 2026-08-12.

### ED-05 First rollout

Selected family/scope: `COMPANY — FIRST FUNCTIONAL CANDIDATE — NOT AUTHORIZED`.

Entry authorization: `NO FUNCTIONAL ROLLOUT AUTHORIZED`.

Evidence gate: all nine prerequisites documented in ED-05.

Rollback boundary: must be defined before entry authorization.

Approvers: to be assigned under ED-04.

Date: 2026-08-12.

### ED-06 P4

Decision: approve preservation/reconciliation only, with zero functional rollout.

Date: 2026-08-12.

## Exit condition

The entry decisions are recorded, but owners, family-level capability/data/audit approvals, first
scope evidence, and rollback remain prerequisites for any separately reviewed authorization. Until
that happens:

- ETP-015.9: `ENTRY DECISIONS RECORDED — FUNCTIONAL IMPLEMENTATION NOT AUTHORIZED`;
- Gate D: `NOT STARTED — NOT APPROVED`;
- ETP-015.10: `NOT STARTED — NOT AUTHORIZED`;
- production, cloud, deploy, and legacy removal: `NOT AUTHORIZED`.

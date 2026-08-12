# ETP-015.9 — Entry Decision Package

**Status:** `AWAITING HUMAN DECISIONS`

**Resulting governance state:** `ETP-015.9 ENTRY DECISION PACKAGE READY FOR HUMAN REVIEW`

**Implementation state:** `NOT STARTED — NOT AUTHORIZED`

**Baseline:** `origin/develop@68238b6830f293da8ac86066e53bf1b1dc2edc6e`

**Preparation date:** 2026-08-12

## Purpose and binding limits

This package converts the [entry readiness assessment](ETP-015_9_ENTRY_READINESS.md) into six
explicit human decisions. It does not approve a candidate capability, appoint an owner, resolve a
BDP, select a first rollout, start Gate D, or change runtime.

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

| ID    | Decision                                                   | Evidence                                                         | Status                    |
| ----- | ---------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------- |
| ED-01 | allocate the 15 residual P0 handlers                       | residual inventory below                                         | `HUMAN DECISION REQUIRED` |
| ED-02 | approve capabilities and operation classes per family      | [capability matrix](ETP-015_9_CAPABILITY_DECISION_MATRIX.md)     | `HUMAN DECISION REQUIRED` |
| ED-03 | approve data projection, sensitivity, and audit per family | [data/audit matrix](ETP-015_9_DATA_AND_AUDIT_DECISION_MATRIX.md) | `HUMAN DECISION REQUIRED` |
| ED-04 | assign owners and required approvers                       | [owner matrix](ETP-015_9_OWNER_AND_APPROVER_MATRIX.md)           | `HUMAN DECISION REQUIRED` |
| ED-05 | select the first rollout and its evidence gate             | [first-wave options](ETP-015_9_FIRST_WAVE_OPTIONS.md)            | `HUMAN DECISION REQUIRED` |
| ED-06 | confirm P4 as preservation/reconciliation only             | P4 proposal below                                                | `HUMAN DECISION REQUIRED` |

No decision in this register is approved by this package.

## ED-01 — Residual P0 allocation

All entries remain `LEGACY_DEFERRED`. Candidate capability names originate in the historical
inventory and are not approved catalog codes.

| Controller#method                   | Verb and route                       | Current classification | Canonical overlap                                                               | Known consumer                       | Parallel-rule risk                                    | BDP dependency                                           | Potential related capability                                                  | Existing audit decision                                    | Proposed destination options                                    | Human decision |
| ----------------------------------- | ------------------------------------ | ---------------------- | ------------------------------------------------------------------------------- | ------------------------------------ | ----------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------- | -------------- |
| `PayrollPeriodsController#list`     | `GET /payroll-periods`               | `LEGACY_DEFERRED`      | canonical period aggregate/history exists, but this list contract is legacy     | `/folha/competencias`                | medium: unsafe global/company query                   | BDP-014 approved; BDP-011 limits fields                  | `payroll.period.close.view` exists; `payroll.period.view` is only a candidate | closure history policy does not approve this read          | A: existing wave; B: governed P0.1; C: preserve/defer; D: block | `PENDING`      |
| `PayrollPeriodsController#create`   | `POST /payroll-periods`              | `LEGACY_DEFERRED`      | `PayrollPeriod` is canonical, but creation is outside closure commands          | `/folha/competencias`                | high: mutation outside approved closure orchestration | BDP-014 approved; calendar/type policy not approved here | `payroll.period.manage` candidate only                                        | no approved create event                                   | A/B/C/D                                                         | `PENDING`      |
| `PayrollPeriodsController#find`     | `GET /payroll-periods/:id`           | `LEGACY_DEFERRED`      | canonical aggregate exists; safe general detail projection not approved         | `/folha/competencias`                | medium: lookup/enumeration before company scope       | BDP-014 approved; BDP-011 limits fields                  | existing closure view/history may not authorize general detail                | closure read policy is narrower                            | A/B/C/D                                                         | `PENDING`      |
| `PayrollPeriodsController#update`   | `PATCH /payroll-periods/:id`         | `LEGACY_DEFERRED`      | canonical close/reopen exists; general update is separate                       | `/folha/competencias`                | critical: can conflict with immutable closed state    | BDP-014 approved                                         | `payroll.period.manage` candidate only                                        | no approved update event                                   | A/B/C/D                                                         | `PENDING`      |
| `PayrollPeriodsController#open`     | `POST /payroll-periods/:id/open`     | `LEGACY_DEFERRED`      | controlled reopen is canonical only for `CLOSED -> OPEN`                        | `/folha/competencias`                | critical: may bypass controlled reopen evidence       | BDP-014 approved and binding                             | `payroll.period.close.reopen` exists only for controlled reopen               | `PAYROLL_PERIOD_REOPENED` applies only to canonical reopen | A/B/C/D                                                         | `PENDING`      |
| `PayrollPeriodsController#validate` | `POST /payroll-periods/:id/validate` | `LEGACY_DEFERRED`      | closure readiness is canonical, but legacy validate semantics differ            | `/folha/competencias`                | high: competing readiness/validation rule             | BDP-014 approved                                         | `payroll.period.close.readiness` exists; reuse is not approved                | no separate approved validation event                      | A/B/C/D                                                         | `PENDING`      |
| `PayrollInputsController#list`      | `GET /payroll-inputs`                | `LEGACY_DEFERRED`      | inputs feed canonical run/closure but no canonical authorization wrapper exists | `/folha/lancamentos`                 | high: financial data and client company filters       | BDP-001/004/005/006/011 material                         | `payroll.input.view` candidate only                                           | sensitive-read classification absent                       | A/B/C/D                                                         | `PENDING`      |
| `PayrollInputsController#create`    | `POST /payroll-inputs`               | `LEGACY_DEFERRED`      | canonical closure immutability constrains writes                                | `/folha/lancamentos`                 | critical: write can affect payroll totals             | BDP-004/005/006 material                                 | `payroll.input.manage` candidate only                                         | critical-write event absent                                | A/B/C/D                                                         | `PENDING`      |
| `PayrollInputsController#find`      | `GET /payroll-inputs/:id`            | `LEGACY_DEFERRED`      | no approved canonical read projection                                           | `/folha/lancamentos`                 | high: financial resource enumeration                  | BDP-001/004/005/011 material                             | `payroll.input.view` candidate only                                           | sensitive-read classification absent                       | A/B/C/D                                                         | `PENDING`      |
| `PayrollInputsController#update`    | `PATCH /payroll-inputs/:id`          | `LEGACY_DEFERRED`      | must preserve closed-period immutability                                        | `/folha/lancamentos`                 | critical: mutation/parallel close rule                | BDP-004/005/006 material                                 | `payroll.input.manage` candidate only                                         | critical-write event absent                                | A/B/C/D                                                         | `PENDING`      |
| `PayrollRunsController#list`        | `GET /payroll-runs`                  | `LEGACY_DEFERRED`      | runs are referenced by canonical closure/history                                | `/folha/execucoes` and review flows  | high: totals/version metadata                         | BDP-004/005/006/011 material                             | `payroll.run.view` candidate only                                             | sensitive-read classification absent                       | A/B/C/D                                                         | `PENDING`      |
| `PayrollRunsController#start`       | `POST /payroll-runs`                 | `LEGACY_DEFERRED`      | canonical closure consumes run but does not authorize run creation              | `/folha/execucoes`                   | critical: starts technical payroll execution          | BDP-004/005/006 material                                 | `payroll.run.manage` candidate only                                           | critical-write event absent                                | A/B/C/D                                                         | `PENDING`      |
| `PayrollRunsController#find`        | `GET /payroll-runs/:id`              | `LEGACY_DEFERRED`      | canonical history exposes only a minimal run reference                          | `/folha/execucoes` and review detail | high: totals and technical evidence                   | BDP-001/004/005/011 material                             | `payroll.run.view` candidate only                                             | sensitive-read classification absent                       | A/B/C/D                                                         | `PENDING`      |
| `PayrollRunsController#messages`    | `GET /payroll-runs/:id/messages`     | `LEGACY_DEFERRED`      | closure readiness consumes blockers/warnings internally                         | `/folha/execucoes`                   | high: operational/free-text content                   | BDP-006/011 material                                     | `payroll.run.view` candidate only                                             | sensitive-read classification absent                       | A/B/C/D                                                         | `PENDING`      |
| `PayrollRunsController#addMessage`  | `POST /payroll-runs/:id/messages`    | `LEGACY_DEFERRED`      | canonical readiness reads messages but does not own their authoring             | `/folha/execucoes`                   | critical: may affect blocker outcome                  | BDP-006 and audit policy material                        | `payroll.run.manage` candidate only                                           | critical-write event absent                                | A/B/C/D                                                         | `PENDING`      |

Allowed human options for each handler are: A, move to an existing approved wave; B, approve a
separate governed Residual-P0/P0.1 sub-scope; C, `PRESERVE / DEFER`; or D, `BLOCKED` pending a
specific decision. This package does not select an option or create an official wave.

**ED-01 status:** `HUMAN DECISION REQUIRED`.

## ED-02 — Capability and operation classification

The [capability decision matrix](ETP-015_9_CAPABILITY_DECISION_MATRIX.md) inventories read, write,
action, reuse, segregation, and escalation questions for every family. Its candidate names are
non-binding. The existing catalog remains unchanged at 19 codes.

**ED-02 status:** `HUMAN DECISION REQUIRED`.

## ED-03 — Sensitive data, projection, and audit classification

The [data and audit matrix](ETP-015_9_DATA_AND_AUDIT_DECISION_MATRIX.md) records current DTO/contract
categories without real data. It preserves the ETP-015.6 minimum projections and the limits of
BDP-001/011. It does not decide masking, retention, export, DLP, or final privacy classification.

**ED-03 status:** `HUMAN DECISION REQUIRED`.

## ED-04 — Owners and approvers

The [owner and approver matrix](ETP-015_9_OWNER_AND_APPROVER_MATRIX.md) contains roles only. Every
accountable and engineering owner remains `PENDING HUMAN ASSIGNMENT`; no person is inferred.

**ED-04 status:** `HUMAN DECISION REQUIRED`.

## ED-05 — First rollout family and evidence gate

The [first-wave options](ETP-015_9_FIRST_WAVE_OPTIONS.md) rank four non-binding possibilities. The
evidence currently supports `NO FUNCTIONAL FAMILY CURRENTLY READY`. A human decision must select a
scope only after its material blockers and Definition of Ready are satisfied.

**ED-05 status:** `HUMAN DECISION REQUIRED`.

## ED-06 — P4 preservation/reconciliation

**Proposal:** preserve the explicitly approved public routes; preserve authenticated and already
capability-protected families; reconcile runtime, OpenAPI, and documentation; make no runtime,
capability, projection, audit, company-context, or route-removal change.

**Status:** `PROPOSED — HUMAN CONFIRMATION REQUIRED`.

P4 is not an implemented rollout and cannot satisfy a Gate D checkbox by itself.

## BDP dependencies

The [BDP dependency matrix](ETP-015_9_BDP_DEPENDENCY_MATRIX.md) is binding for this package's
blocker analysis. BDP-009, BDP-014, and BDP-AUTH-LEGACY are approved. BDP-001–008 and BDP-010–013
remain pending. An approved transversal BDP does not approve a family capability or expose a field
blocked by a pending material BDP.

## Human decision form

Leave every field blank until the responsible humans review all linked matrices.

### ED-01 Residual P0

Decision:

Approver role:

Date:

Conditions:

### ED-02 Capabilities

Decision per family:

Approver role:

Date:

Conditions:

### ED-03 Data/Audit

Decision per family:

Approver roles:

Date:

Conditions:

### ED-04 Owners

Owner per family:

Required approvers:

Date:

### ED-05 First rollout

Selected family/scope:

Entry authorization:

Evidence gate:

Rollback boundary:

Approvers:

Date:

### ED-06 P4

Decision:

Date:

## Exit condition

Human review must record all decisions, approvers, dates, conditions, owners, capability/data/audit
classifications, first-scope evidence gate, and rollback boundary. A later, separately reviewed
governance change may then authorize an entry scope. Until that happens:

- ETP-015.9: `NOT STARTED — NOT AUTHORIZED`;
- Gate D: `NOT STARTED — NOT APPROVED`;
- ETP-015.10: `NOT STARTED — NOT AUTHORIZED`;
- production, cloud, deploy, and legacy removal: `NOT AUTHORIZED`.

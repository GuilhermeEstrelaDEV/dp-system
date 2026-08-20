# ETP-015.9 — Company Entry Decision Package

**Status:** `ENTRY DECISIONS RECORDED — FUNCTIONAL IMPLEMENTATION DEFERRED`

**Decision date:** 2026-08-20

**Decision authority:** `ETP-015.9 ENTRY DECISION AUTHORITY`

**Binding result:** `COMPANY ENTRY — NOT AUTHORIZED`

This record applies the human decision to defer Company. It does not resolve BDP-012, authorize a
Company runtime implementation, start Gate D, or change the technical evidence in the
[readiness assessment](ETP-015_9_COMPANY_ENTRY_READINESS.md),
[BDP-012 options](ETP-015_9_COMPANY_BDP012_DECISION_PACKAGE.md),
[consumers](ETP-015_9_COMPANY_CONSUMER_MATRIX.md),
[security test plan](ETP-015_9_COMPANY_SECURITY_TEST_PLAN.md), or
[rollout/rollback proposal](ETP-015_9_COMPANY_ROLLOUT_AND_ROLLBACK.md).

### CD-01 BDP-012

**Decision:** `E — DEFER`

**BDP-012 state:** `PENDING`

**Entry consequence:** `COMPANY FUNCTIONAL ENTRY BLOCKED`

**Approver role:** `ETP-015.9 ENTRY DECISION AUTHORITY`

**Date:** 2026-08-20

**Conditions:**

- BDP-012 remains open;
- no root, group, or economic-group model is approved;
- no fiscal-uniqueness change, migration, or backfill is approved;
- no authority between sibling companies or authority expansion is approved;
- no group semantics may be used for authorization;
- no Company subset or runtime implementation is authorized.

### CD-02 Scope per operation

**Decision:** `APPROVED — DEFER ALL COMPANY OPERATIONS`

| Handler operation | Decision |
| ----------------- | -------- |
| list              | `DEFER`  |
| find              | `DEFER`  |
| create            | `DEFER`  |
| update            | `DEFER`  |
| activate          | `DEFER`  |
| inactivate        | `DEFER`  |

No handler receives `GLOBAL ADMINISTRATION`, `ACTIVE-COMPANY`, or `SELF-CONTEXT` semantics under
this decision. The approval governs continued deferment; it is not functional approval.

**Approver role:** `ETP-015.9 ENTRY DECISION AUTHORITY`

**Date:** 2026-08-20

**Conditions:** all six handlers remain `LEGACY_DEFERRED`; no runtime rollout is authorized.

### CD-03 Capability

**Decision:** `NO CAPABILITY CHANGE`

**Current catalog:** 19

**New capabilities:** 0

**Existing capability semantic expansion:** 0

The following remain explicitly prohibited: treating `platform.manage` as a super-capability,
implicit Company reads through `platform.read`, use of `payroll.period.close.*` for Company,
role-name authorization, seed grant expansion, automatic grants, and automatic assignments.

**Status:** `APPROVED — NO COMPANY CAPABILITY AUTHORIZATION`

**Approver role:** `ETP-015.9 ENTRY DECISION AUTHORITY`

**Date:** 2026-08-20

**Conditions:** no catalog, grant, assignment, or semantic change.

### CD-04 Projection

**Decision:** `PRESERVE CURRENT BLOCKED STATE`

No Company projection is approved for rollout. The seven currently observed fields — `id`,
`legalName`, `tradeName`, `taxId`, `status`, `createdAt`, and `updatedAt` — receive no exposure
authorization from this decision. No masking, new projection, DTO change, or runtime OpenAPI change
is authorized.

**Status:** `APPROVED — NO COMPANY PROJECTION AUTHORIZATION`

**Approver role:** `ETP-015.9 ENTRY DECISION AUTHORITY`

**Date:** 2026-08-20

**Conditions:** preserve current evidence without expanding or approving exposure.

### CD-05 Audit

**Decision:** `APPROVED — DEFER AUDIT DESIGN WITH COMPANY`

**Current audit catalog:** 27

**New events:** 0

| Operation          | Decision                     |
| ------------------ | ---------------------------- |
| Company create     | `NO APPROVED EVENT`          |
| Company update     | `NO APPROVED EVENT`          |
| Company activate   | `NO APPROVED EVENT`          |
| Company inactivate | `NO APPROVED EVENT`          |
| Company reads      | `NO NEW READ EVENT APPROVED` |

No semantically inadequate event may be reused.

**Approver role:** `ETP-015.9 ENTRY DECISION AUTHORITY`

**Date:** 2026-08-20

**Conditions:** no audit catalog or runtime event change.

### CD-06 Owner

**Accountable operational owner:** `PENDING HUMAN ASSIGNMENT`

**Engineering owner:** `PENDING HUMAN ASSIGNMENT`

**Date:** 2026-08-20

**Status:** `BLOCKED — OWNERS NOT ASSIGNED`

Required future approvers remain Engineering, Security, Product, and the accountable operational
owner, plus DP and/or Jurídico/DPO when required by the future material scope.

### CD-07 Consumers

**Decision:** `CONSUMER INVENTORY ACCEPTED AS CURRENT EVIDENCE`

**Known/versioned:** inventoried in the consumer matrix.

**Residual risks:** external/unversioned consumers remain `UNKNOWN — RESIDUAL RISK PRESERVED`.

**Date:** 2026-08-20

**Status:** `APPROVED — INVENTORY EVIDENCE ONLY`

This evidence acceptance does not authorize a contract change.

### CD-08 Entry authorization

**AUTHORIZED / NOT AUTHORIZED:** `NOT AUTHORIZED`

**Company functional implementation:** `NOT AUTHORIZED`

**ETP-015.9 Company rollout:** `NOT STARTED`

**Evidence gate:** 6 `PASS` / 10 `PENDING/BLOCKED`.

**Approver role:** `ETP-015.9 ENTRY DECISION AUTHORITY`

**Date:** 2026-08-20

**Reason:** BDP-012 is pending; scope is deferred; no capability, projection, or audit model is
approved; owners are pending; and the Definition of Ready is incomplete.

**Status:** `COMPANY ENTRY — NOT AUTHORIZED`

### CD-09 Rollback

**Decision:** `NO RUNTIME ROLLOUT — ROLLBACK PLAN PRESERVED FOR FUTURE USE`

The future rollback boundary preserves JWT, deny-by-default, company isolation, server-side
authority, explicit capabilities, approved projections, and critical audit. Rollback may never trust
client `companyId`, use role names or `platform.manage` as fallback, expand projections, or disable
future critical audit.

**Stop conditions:** preserved in the rollout and rollback proposal for future use.

**Approver role:** `ETP-015.9 ENTRY DECISION AUTHORITY`

**Date:** 2026-08-20

**Status:** `APPROVED — FUTURE ROLLBACK BOUNDARY ONLY`

## Binding final state

- BDP-012: `PENDING`; selected current option: `E — DEFER`.
- Company: `ENTRY DECISIONS RECORDED — FUNCTIONAL IMPLEMENTATION DEFERRED`; `NOT AUTHORIZED`.
- six Company handlers: `LEGACY_DEFERRED`.
- ETP-015.9 functional implementation: `NOT AUTHORIZED`.
- Gate D: `NOT STARTED — NOT APPROVED`.
- ETP-015.10: `NOT STARTED — NOT AUTHORIZED`.
- production, cloud, deploy, and legacy removal: `NOT AUTHORIZED`.

**THIS DECISION DOES NOT RESOLVE BDP-012.**

**THIS DECISION DOES NOT AUTHORIZE COMPANY RUNTIME IMPLEMENTATION.**

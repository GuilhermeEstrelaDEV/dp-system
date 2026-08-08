# ETP-015.6 — Field Classification Decision Package

**Status:** `READY FOR HUMAN DECISION — NOT APPROVED`

**ETP-015.6:** `BLOCKED — FIELD CLASSIFICATION DECISION PACKAGE PREPARED; AWAITING HUMAN APPROVAL`

**ETP-015.8:** `NOT STARTED`

**Baseline:** `origin/develop@d071344` (PR #81)

**Nature:** documentary evidence and proposals only; no runtime effect

## Objective and authority boundary

This package turns the classification gate into reviewable decisions for the 33 canonical endpoints. It records actual response surfaces, known consumers, evidence gaps and conservative alternatives. It does not classify a field, approve a purpose, select a mask, grant full access, choose a capability, create an audit event or define a cache policy.

Every `FC-*` item is `PENDING HUMAN DECISION`. The expression `PROPOSAL ONLY — REQUIRES HUMAN APPROVAL` has no approval force. Until the corresponding decisions are homologated, the implementation state is `BLOCKED_PENDING_DECISION` and the current runtime remains unchanged.

## Sources inspected

- [Classification gate report](ETP-015_6_CLASSIFICATION_GATE_REPORT.md)
- [Authorization foundation design](../architecture/AUTHORIZATION_FOUNDATION_TECHNICAL_DESIGN.md)
- [ETP-015 specification](../project-management/ETP-015_AUTHORIZATION_FOUNDATION_AND_ENTERPRISE_ISOLATION.md)
- [Implementation backlog](../project-management/ETP-015_IMPLEMENTATION_BACKLOG.md)
- [Release gates](../project-management/ETP-015_RELEASE_GATES.md)
- [BDP-AUTH-LEGACY resolution](../project-management/BDP-AUTH-LEGACY_RESOLUTION_V1.md), especially DAL-06, DAL-07, DAL-08 and DAL-13
- [Pending business decisions](../project-management/BUSINESS_DECISIONS_PENDING.md), especially BDP-001 and BDP-011
- [Permission risk and sensitivity classification](../project-management/ETP-015_PERMISSION_RISK_SENSITIVITY_CLASSIFICATION.md)
- [ETP-015.7 event catalog](ETP-015_7_AUDIT_EVENT_CATALOG.md), [coverage](ETP-015_7_AUDIT_COVERAGE_INVENTORY.md), [metadata allowlist](ETP-015_7_METADATA_ALLOWLIST.md) and [acceptance evidence](ETP-015_7_ACCEPTANCE_EVIDENCE.md)
- [ETP-015.5 data-access inventory](ETP-015_5_DATA_ACCESS_INVENTORY.md) and current controllers, services, repositories, DTOs, Prisma queries, frontend clients and tests

The permission taxonomy `STANDARD | SENSITIVE | RESTRICTED` classifies permission codes, not response fields. Applying it to fields without a human decision would create a new material policy. Consequently, every field starts with `CLASSIFICATION TAXONOMY GAP`.

## Stable decision model

The authoritative decision rows are in the [approval matrix](ETP-015_6_FIELD_CLASSIFICATION_APPROVAL_MATRIX.md). IDs are stable and map to one field or a materially equivalent group. A group is used only when fields share origin, purpose, consumer and exposure semantics. The matrix contains the type, origin, company scope, current purpose, consumer, documentary source, current exposure, risk and required decision for every group.

Human decision values supported by the form are `APPROVED`, `REJECTED` or `NEEDS CHANGE`; none is preselected. Projection outcomes are `NECESSARY`, `OPTIONAL`, `CURRENTLY RETURNED WITHOUT PROVEN USE`, `BLOCKED` or `INTERNAL`. Contract outcomes are `OMIT`, `NULL`, `MASKED`, `FULL` or `NOT APPLICABLE`.

## Verified endpoint inventory

### AUTH / CONTEXT — 5 endpoints, FC-001..FC-019

| Method | Endpoint          | Use case                  | Effective return fields                                                                                                                                                     | Known consumer        |
| ------ | ----------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| POST   | `/auth/login`     | authenticate              | `accessToken`, `tokenType`                                                                                                                                                  | web session bootstrap |
| GET    | `/auth/me`        | resolve principal         | `actorId`, `activeCompanyId`, `sessionId`, `permissions`, `traceId`, `ipAddress`, `userAgent`, `accessGrants[].{id,type,capabilities}`, `email`, `displayName`, `roleCodes` | web auth context      |
| GET    | `/auth/companies` | list selectable companies | `[].{id,legalName,tradeName}`                                                                                                                                               | company selector      |
| POST   | `/auth/context`   | switch active company     | `accessToken`, `tokenType`                                                                                                                                                  | web auth context      |
| POST   | `/auth/logout`    | revoke current session    | `revoked`                                                                                                                                                                   | web logout            |

Controllers return service values directly; no family-specific response mapper or serializer was found. The web stores token, user and company summaries in `sessionStorage` under `dp-system.session.v1` and clears query data on company switch and local logout. This is current behavior, not an approved cache policy.

### GRANTS / ASSIGNMENTS — 6 endpoints, FC-020..FC-035

| Method | Endpoint                                  | Use case               | Effective return fields             | Known consumer                  |
| ------ | ----------------------------------------- | ---------------------- | ----------------------------------- | ------------------------------- |
| GET    | `/access-grants/substitutions`            | list substitutions     | full substitution scalar record     | no canonical web consumer found |
| POST   | `/access-grants/substitutions`            | create substitution    | full substitution scalar record     | no canonical web consumer found |
| POST   | `/access-grants/substitutions/:id/revoke` | revoke substitution    | full substitution scalar record     | no canonical web consumer found |
| GET    | `/access-grants/emergency`                | list emergency grants  | full emergency-access scalar record | no canonical web consumer found |
| POST   | `/access-grants/emergency`                | create emergency grant | full emergency-access scalar record | no canonical web consumer found |
| POST   | `/access-grants/emergency/:id/revoke`     | revoke emergency grant | full emergency-access scalar record | no canonical web consumer found |

The repository currently uses Prisma `findMany`/mutation returns without a minimal response projection. Effective fields are `id`, `companyId`, subject user IDs, grantor/revoker IDs, `capabilities`, validity window, reason, status, revocation data and timestamps. Absence of a frontend consumer is not evidence that a field is safe.

### DASHBOARD — 1 endpoint, FC-036..FC-052

| Method | Endpoint             | Use case          | Effective return fields                                                                                  | Known consumer |
| ------ | -------------------- | ----------------- | -------------------------------------------------------------------------------------------------------- | -------------- |
| GET    | `/dashboard/summary` | executive summary | `context`, `access`, review/period metrics, status distributions, six-month timeline and recent activity | dashboard page |

The repository uses scoped aggregate queries rather than raw employee rows. Effective groups include company context, generation time/time zone, access flags, metric value/label/description, distribution key/label/value, timeline key/label/value, and recent-activity type/time/description. All are still subject to field-purpose and cache decisions.

### PAYROLL REVIEW — 14 endpoints, FC-053..FC-080

| Method | Endpoint                                      | Use case               | Effective return surface                                                                    |
| ------ | --------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------- |
| POST   | `/payroll-runs/:payrollRunId/reviews`         | create review          | cycle scalar record                                                                         |
| GET    | `/payroll-runs/:payrollRunId/reviews`         | list reviews           | cycles with findings and events                                                             |
| GET    | `/payroll-reviews/:reviewCycleId`             | read review            | cycle, findings, events, approval stages and decisions                                      |
| POST   | `/payroll-reviews/:reviewCycleId/findings`    | create finding         | finding scalar record                                                                       |
| GET    | `/payroll-reviews/:reviewCycleId/findings`    | list findings          | findings with events                                                                        |
| POST   | `/payroll-review-findings/:findingId/resolve` | resolve finding        | finding scalar record                                                                       |
| POST   | `/payroll-review-findings/:findingId/reopen`  | reopen finding         | finding scalar record                                                                       |
| POST   | `/payroll-reviews/:reviewCycleId/start`       | start review           | cycle scalar record                                                                         |
| POST   | `/payroll-reviews/:reviewCycleId/submit`      | submit review          | cycle scalar record                                                                         |
| POST   | `/payroll-reviews/:reviewCycleId/approve`     | approve stage          | cycle scalar record                                                                         |
| POST   | `/payroll-reviews/:reviewCycleId/reject`      | reject review          | cycle scalar record                                                                         |
| GET    | `/payroll-reviews/:reviewCycleId/history`     | read complete timeline | state, timeline, events, findings, stages, decisions and invalidations with actor summaries |
| POST   | `/payroll-reviews/:reviewCycleId/close`       | close review           | cycle scalar record                                                                         |
| POST   | `/payroll-reviews/:reviewCycleId/reopen`      | reopen review          | cycle scalar record                                                                         |

The service currently returns Prisma records and nested relations directly. Field groups cover cycle identity/state/counters, finding references/content/resolution, event state and metadata, stage capability, decision actors/reasons and invalidation history. The web client consumes a subset, including finding descriptions, actor display names, reasons, metadata and timeline.

### PAYROLL PERIODS — 7 endpoints, FC-081..FC-110

| Method | Endpoint                                         | Use case            | Effective return surface                                                                  |
| ------ | ------------------------------------------------ | ------------------- | ----------------------------------------------------------------------------------------- |
| GET    | `/payroll-periods/:id/closure-readiness`         | evaluate readiness  | period state, selected run, review, blockers, warnings, acknowledgements, token and trace |
| GET    | `/payroll-periods/:id/history`                   | list versions       | version graph, actors, linked run/review, manifest summary and events                     |
| GET    | `/payroll-periods/:id/history/:version/events`   | list version events | event type/time/actor/trace                                                               |
| GET    | `/payroll-periods/:id/history/:version/manifest` | read safe manifest  | summary, warning acknowledgements, totals and entity references                           |
| GET    | `/payroll-periods/:id/history/:version`          | read version        | version details plus warning acknowledgements and actors                                  |
| POST   | `/payroll-periods/:id/close`                     | close period        | closure/version/status, run/review/manifest references, actor/time, token and replay flag |
| POST   | `/payroll-periods/:id/reopen`                    | reopen period       | predecessor/successor closure data, reason, actor/time, flags, token and replay flag      |

These canonical DTOs are explicit but include actor display names, operational reasons, metadata, totals, reference arrays, hashes and trace/consistency tokens. `PAYROLL_PERIOD_MANIFEST` is documented as safe in its current domain context; that label does not substitute for the field-by-field human decision required by this gate.

## Endpoint-to-field decision mapping

The approval matrix expands each referenced FC ID into its exact field path, type, origin and exposure. Ranges below therefore identify all effective returnable members for each endpoint without repeating or hiding a field. Optional nested relations are included even when a particular record has no value.

| #   | Method | Endpoint                                         | Effective FC fields            |
| --- | ------ | ------------------------------------------------ | ------------------------------ |
| 1   | POST   | `/auth/login`                                    | FC-001..FC-002                 |
| 2   | GET    | `/auth/me`                                       | FC-003..FC-015                 |
| 3   | GET    | `/auth/companies`                                | FC-016..FC-018                 |
| 4   | POST   | `/auth/context`                                  | FC-001..FC-002                 |
| 5   | POST   | `/auth/logout`                                   | FC-019                         |
| 6   | GET    | `/access-grants/substitutions`                   | FC-020..FC-023, FC-025..FC-035 |
| 7   | POST   | `/access-grants/substitutions`                   | FC-020..FC-023, FC-025..FC-035 |
| 8   | POST   | `/access-grants/substitutions/:id/revoke`        | FC-020..FC-023, FC-025..FC-035 |
| 9   | GET    | `/access-grants/emergency`                       | FC-020..FC-021, FC-024..FC-035 |
| 10  | POST   | `/access-grants/emergency`                       | FC-020..FC-021, FC-024..FC-035 |
| 11  | POST   | `/access-grants/emergency/:id/revoke`            | FC-020..FC-021, FC-024..FC-035 |
| 12  | GET    | `/dashboard/summary`                             | FC-036..FC-052                 |
| 13  | POST   | `/payroll-runs/:payrollRunId/reviews`            | FC-053..FC-060                 |
| 14  | GET    | `/payroll-runs/:payrollRunId/reviews`            | FC-053..FC-070, FC-072..FC-074 |
| 15  | GET    | `/payroll-reviews/:reviewCycleId`                | FC-053..FC-077                 |
| 16  | POST   | `/payroll-reviews/:reviewCycleId/findings`       | FC-061..FC-068                 |
| 17  | GET    | `/payroll-reviews/:reviewCycleId/findings`       | FC-061..FC-070, FC-072..FC-074 |
| 18  | POST   | `/payroll-review-findings/:findingId/resolve`    | FC-061..FC-068                 |
| 19  | POST   | `/payroll-review-findings/:findingId/reopen`     | FC-061..FC-068                 |
| 20  | POST   | `/payroll-reviews/:reviewCycleId/start`          | FC-053..FC-060                 |
| 21  | POST   | `/payroll-reviews/:reviewCycleId/submit`         | FC-053..FC-060                 |
| 22  | POST   | `/payroll-reviews/:reviewCycleId/approve`        | FC-053..FC-060                 |
| 23  | POST   | `/payroll-reviews/:reviewCycleId/reject`         | FC-053..FC-060                 |
| 24  | GET    | `/payroll-reviews/:reviewCycleId/history`        | FC-061..FC-080                 |
| 25  | POST   | `/payroll-reviews/:reviewCycleId/close`          | FC-053..FC-060                 |
| 26  | POST   | `/payroll-reviews/:reviewCycleId/reopen`         | FC-053..FC-060                 |
| 27  | GET    | `/payroll-periods/:id/closure-readiness`         | FC-081..FC-095                 |
| 28  | GET    | `/payroll-periods/:id/history`                   | FC-096..FC-101                 |
| 29  | GET    | `/payroll-periods/:id/history/:version/events`   | FC-101                         |
| 30  | GET    | `/payroll-periods/:id/history/:version/manifest` | FC-100, FC-103..FC-106         |
| 31  | GET    | `/payroll-periods/:id/history/:version`          | FC-096..FC-102                 |
| 32  | POST   | `/payroll-periods/:id/close`                     | FC-107..FC-108, FC-110         |
| 33  | POST   | `/payroll-periods/:id/reopen`                    | FC-109..FC-110                 |

## Family decision summaries

| Family               | Purpose candidates supported by code                                       | Projection concern                                                                | FULL/capability concern                                                         | Audit concern                                                                  | Cache concern                                                                               | State                      |
| -------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- | -------------------------- |
| AUTH / CONTEXT       | authentication, session identity, company selection, authorization context | `/auth/me` exposes technical/session context beyond current visible UI            | no existing capability explicitly authorizes integral identity/session data     | no approved sensitive-read event                                               | session storage contains identity/token data                                                | `BLOCKED_PENDING_DECISION` |
| GRANTS / ASSIGNMENTS | administrative grant lifecycle                                             | raw Prisma records and no proven web consumer                                     | manage capabilities authorize operations, not demonstrably every returned field | list reads have no read event                                                  | no frontend cache evidenced; intermediaries remain undecided                                | `BLOCKED_PENDING_DECISION` |
| DASHBOARD            | executive operational summary                                              | aggregate fields are consumed, but activity descriptions need purpose review      | `platform.read` is related, not evidence of FULL sensitive data                 | no dashboard-read event                                                        | React Query cache is company-keyed but TTL/profile policy is not homologated                | `BLOCKED_PENDING_DECISION` |
| PAYROLL REVIEW       | review, finding resolution and decision timeline                           | nested records expose actors, reasons, metadata and internal trace data           | workflow capabilities authorize actions, not integral response fields           | write events exist; read events do not                                         | React Query keys use resources, not company/profile; global clear handles company switch    | `BLOCKED_PENDING_DECISION` |
| PAYROLL PERIODS      | readiness, closure, reopening and history                                  | explicit DTOs still expose operational reasons, totals, references and trace data | closure capabilities authorize use cases, not integral sensitive fields         | write events exist; history/readiness/manifest reads lack approved read events | React Query keys use period/version, not company/profile; stale-grant behavior is undecided | `BLOCKED_PENDING_DECISION` |

## Purpose codes proposed for human decision

These codes merely normalize current technical uses; they do not claim a legal basis.

| Code        | Description                                         | Use case / consumer             | Required FC range      | Status                   |
| ----------- | --------------------------------------------------- | ------------------------------- | ---------------------- | ------------------------ |
| PUR-AUTH    | authenticate and maintain local session             | auth service / web auth context | FC-001..FC-015, FC-019 | `PENDING HUMAN DECISION` |
| PUR-COMPANY | select active company                               | company selector                | FC-016..FC-018         | `PENDING HUMAN DECISION` |
| PUR-GRANT   | administer substitution/emergency grants            | access-grants API               | FC-020..FC-035         | `PENDING HUMAN DECISION` |
| PUR-DASH    | present executive operational summary               | dashboard                       | FC-036..FC-052         | `PENDING HUMAN DECISION` |
| PUR-REVIEW  | operate payroll review and evidence timeline        | review API/UI                   | FC-053..FC-080         | `PENDING HUMAN DECISION` |
| PUR-CLOSE   | evaluate, close, reopen and inspect payroll periods | period API/UI                   | FC-081..FC-110         | `PENDING HUMAN DECISION` |

## Decision format and conservative alternatives

For every FC item, reviewers must select classification, purpose, minimal projection and contract behavior independently.

- `A — OMIT`: remove the member from the response; this is a breaking contract change for consumers that dereference it.
- `B — NULL`: preserve the member but change its value/type semantics; consumers must distinguish null from absent and empty.
- `C — MASKED`: preserve a recognizable representation; exact revealed characters or value bands remain `PENDING HUMAN DECISION`.
- `D — FULL WITH CAPABILITY`: requires explicit capability semantics, deny-by-default enforcement, audit and cache decisions.
- `E — BLOCK UNTIL FUTURE DECISION`: keep implementation blocked when evidence is insufficient.
- `NOT APPLICABLE`: only after a human confirms no masking/full-access dimension applies.

The conservative Codex proposal is `PROPOSAL ONLY — REQUIRES HUMAN APPROVAL`: retain only fields proven necessary by current consumers, block new FULL exposure, avoid persistent/cache copies, require material read auditing, and do not treat a general management capability as universal. It does not change current runtime until approved and implemented in a later branch.

No approved mask exists for document, phone, email, address, bank account, salary, name or financial value. No number of revealed characters, rounding rule or replacement token is proposed as final policy.

## Completion criteria for human homologation

ETP-015.6 can leave the decision gate only when:

1. every FC row has a human decision, rationale, approver and date;
2. field classification categories are explicitly approved or a documented taxonomy gap is resolved;
3. every endpoint has an approved minimal projection and omission/null/masked/full contract;
4. every FULL path has explicit capability semantics or remains blocked;
5. sensitive reads have an approved event or an explicit decision that auditing is not required;
6. cache keys, scope, TTL and invalidators are approved, including company switch, logout and revocation;
7. BDP-001/BDP-011 dependencies are resolved or the affected FC items remain blocked;
8. ETP-015.8 remains not started until ETP-015.6 is implemented and accepted.

## Explicit non-deliverables

This package changes no application code, Prisma schema, migration, seed, capability, grant, assignment, runtime event catalog, DTO, serializer, repository, endpoint, frontend, OpenAPI, cache, mask, projection or functional test. It activates no sensitive read.

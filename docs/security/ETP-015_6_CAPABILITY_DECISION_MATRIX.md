# ETP-015.6 — Capability Decision Matrix

**Status:** `PENDING HUMAN DECISION`

**Runtime catalog:** 19 capabilities, unchanged

**FULL exposure:** blocked until an explicit decision

## Existing catalog and semantic evidence

The descriptions below come from the canonical seed. They authorize operations on resources; none explicitly states that it authorizes an integral representation of sensitive response fields. Permission sensitivity (`SENSITIVE` or `RESTRICTED`) describes the capability, not the payload it may reveal.

| Capability                       | Official description                            | Scope    | Related FC family         | Evidence for integral data                                      | Candidate classification                     | Human decision |
| -------------------------------- | ----------------------------------------------- | -------- | ------------------------- | --------------------------------------------------------------- | -------------------------------------------- | -------------- |
| `platform.read`                  | View platform resources                         | PLATFORM | AUTH / CONTEXT; DASHBOARD | no explicit FULL-field semantics                                | POSSIBLE CANDIDATE — HUMAN DECISION REQUIRED | PENDING        |
| `platform.manage`                | Manage platform resources                       | PLATFORM | AUTH / CONTEXT            | no universal-read semantics; must not become a super-capability | NOT SUITABLE as universal FULL grant         | PENDING        |
| `delegation.manage`              | Manage temporary substitutions                  | COMPANY  | GRANTS / ASSIGNMENTS      | operation-related only                                          | POSSIBLE CANDIDATE — HUMAN DECISION REQUIRED | PENDING        |
| `emergency_access.manage`        | Manage audited emergency access                 | COMPANY  | GRANTS / ASSIGNMENTS      | operation-related only                                          | POSSIBLE CANDIDATE — HUMAN DECISION REQUIRED | PENDING        |
| `payroll.review.view`            | View payroll review cycles and findings         | COMPANY  | PAYROLL REVIEW            | permits current view route; integral-sensitive semantics absent | POSSIBLE CANDIDATE — HUMAN DECISION REQUIRED | PENDING        |
| `payroll.review.create`          | Open payroll review cycles                      | COMPANY  | PAYROLL REVIEW            | write action only                                               | NOT SUITABLE for general FULL reads          | PENDING        |
| `payroll.review.finding.create`  | Create payroll review findings                  | COMPANY  | PAYROLL REVIEW            | write action only                                               | NOT SUITABLE for general FULL reads          | PENDING        |
| `payroll.review.finding.resolve` | Resolve payroll review findings                 | COMPANY  | PAYROLL REVIEW            | write action only                                               | NOT SUITABLE for general FULL reads          | PENDING        |
| `payroll.review.finding.reopen`  | Reopen payroll review findings                  | COMPANY  | PAYROLL REVIEW            | write action only                                               | NOT SUITABLE for general FULL reads          | PENDING        |
| `payroll.review.submit`          | Submit payroll review cycles                    | COMPANY  | PAYROLL REVIEW            | write action only                                               | NOT SUITABLE for general FULL reads          | PENDING        |
| `payroll.review.approve`         | Approve configured payroll review stages        | COMPANY  | PAYROLL REVIEW            | critical decision action only                                   | NOT SUITABLE for general FULL reads          | PENDING        |
| `payroll.review.reject`          | Reject submitted payroll review cycles          | COMPANY  | PAYROLL REVIEW            | write action only                                               | NOT SUITABLE for general FULL reads          | PENDING        |
| `payroll.review.close`           | Close approved payroll review cycles            | COMPANY  | PAYROLL REVIEW            | critical write action only                                      | NOT SUITABLE for general FULL reads          | PENDING        |
| `payroll.review.reopen`          | Reopen approved or closed payroll review cycles | COMPANY  | PAYROLL REVIEW            | critical write action only                                      | NOT SUITABLE for general FULL reads          | PENDING        |
| `payroll.period.close.view`      | View payroll period closure summary             | COMPANY  | PAYROLL PERIODS           | summary view only; integral-field semantics absent              | POSSIBLE CANDIDATE — HUMAN DECISION REQUIRED | PENDING        |
| `payroll.period.close.readiness` | Evaluate payroll period closure readiness       | COMPANY  | PAYROLL PERIODS           | use-case view; integral-field semantics absent                  | POSSIBLE CANDIDATE — HUMAN DECISION REQUIRED | PENDING        |
| `payroll.period.close.execute`   | Execute payroll period closure                  | COMPANY  | PAYROLL PERIODS           | critical write action only                                      | NOT SUITABLE for general FULL reads          | PENDING        |
| `payroll.period.close.reopen`    | Reopen a closed payroll period                  | COMPANY  | PAYROLL PERIODS           | critical write action only                                      | NOT SUITABLE for general FULL reads          | PENDING        |
| `payroll.period.close.history`   | View payroll period closure history             | COMPANY  | PAYROLL PERIODS           | history view; integral-field semantics absent                   | POSSIBLE CANDIDATE — HUMAN DECISION REQUIRED | PENDING        |

`EXISTING APPROVED EVIDENCE` count for integral sensitive data is zero. The catalog contains operationally related candidates, but no approved decision connects one to FULL field exposure.

## FC range decisions

| FC range       | Family               | Related capabilities                                               | Current conclusion                                                                  | Alternatives for human decision                                                         | Status                 |
| -------------- | -------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ---------------------- |
| FC-001..FC-019 | AUTH / CONTEXT       | `platform.read`, `platform.manage`                                 | neither explicitly authorizes integral identity/session context                     | A block FULL; B approve bounded semantic extension; C propose a future capability       | PENDING HUMAN DECISION |
| FC-020..FC-035 | GRANTS / ASSIGNMENTS | `delegation.manage`, `emergency_access.manage`                     | operation authorization does not prove every raw record field                       | A block FULL; B approve per-grant bounded extension; C propose future read capabilities | PENDING HUMAN DECISION |
| FC-036..FC-052 | DASHBOARD            | `platform.read`, plus domain view capabilities used by the service | aggregate/presentation access exists; sensitive activity semantics remain undefined | A minimal aggregates only; B bounded extension; C future capability                     | PENDING HUMAN DECISION |
| FC-053..FC-080 | PAYROLL REVIEW       | `payroll.review.view` and action capabilities                      | `view` is the closest candidate; action capabilities are not read grants            | A block FULL; B approve bounded `view` semantics; C future capability                   | PENDING HUMAN DECISION |
| FC-081..FC-110 | PAYROLL PERIODS      | `payroll.period.close.view`, `.readiness`, `.history`              | each maps to a use case, not an approved integral data class                        | A block FULL; B approve per-use-case semantics; C future capability                     | PENDING HUMAN DECISION |

## Required human record for every FULL decision

- FC IDs and exact fields covered;
- capability code and company/platform scope;
- whether existing semantics are extended or a future capability gate is required;
- deny-by-default behavior when the capability is absent;
- interaction with substitution and emergency grants under DAL-13;
- audit event and cache invalidation requirements;
- approver, rationale and date.

No capability is created, broadened, assigned or granted by this document. No automatic role association is proposed.

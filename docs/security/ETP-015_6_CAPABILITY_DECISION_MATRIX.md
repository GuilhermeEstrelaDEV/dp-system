# ETP-015.6 — Capability Decision Matrix

**Status:** `APPROVED FOR APPROVED MINIMAL CONTRACTS`

**Approver:** `PROJECT_OWNER`

**Decision date:** `2026-08-08`

**Runtime catalog:** 19 capabilities, unchanged

## Governing decision

Capabilities authorize only the named operation and the approved MINIMAL response associated with it. They do not authorize raw Prisma records, a general FULL profile, blocked fields or future sensitive exposure. `platform.manage` is not a super-capability, role names never grant access, and this decision creates no capability or assignment.

## Existing catalog and homologated semantics

| Capability                       | Official description                            | Scope    | Homologated ETP-015.6 semantics                                       | Decision       | Approver      | Date       |
| -------------------------------- | ----------------------------------------------- | -------- | --------------------------------------------------------------------- | -------------- | ------------- | ---------- |
| `platform.read`                  | View platform resources                         | PLATFORM | approved only for the MINIMAL dashboard contract                      | APPROVED       | PROJECT_OWNER | 2026-08-08 |
| `platform.manage`                | Manage platform resources                       | PLATFORM | not a replacement for `platform.read` and not a universal FULL grant  | APPROVED LIMIT | PROJECT_OWNER | 2026-08-08 |
| `delegation.manage`              | Manage temporary substitutions                  | COMPANY  | substitution operations plus the MINIMAL substitution contract only   | APPROVED       | PROJECT_OWNER | 2026-08-08 |
| `emergency_access.manage`        | Manage audited emergency access                 | COMPANY  | emergency-access operations plus the MINIMAL emergency contract only  | APPROVED       | PROJECT_OWNER | 2026-08-08 |
| `payroll.review.view`            | View payroll review cycles and findings         | COMPANY  | approved only for the MINIMAL payroll-review read contract            | APPROVED       | PROJECT_OWNER | 2026-08-08 |
| `payroll.review.create`          | Open payroll review cycles                      | COMPANY  | create action plus its own MINIMAL response; not a general read grant | APPROVED LIMIT | PROJECT_OWNER | 2026-08-08 |
| `payroll.review.finding.create`  | Create payroll review findings                  | COMPANY  | finding-create action plus its own MINIMAL response                   | APPROVED LIMIT | PROJECT_OWNER | 2026-08-08 |
| `payroll.review.finding.resolve` | Resolve payroll review findings                 | COMPANY  | resolve action plus its own MINIMAL response                          | APPROVED LIMIT | PROJECT_OWNER | 2026-08-08 |
| `payroll.review.finding.reopen`  | Reopen payroll review findings                  | COMPANY  | finding-reopen action plus its own MINIMAL response                   | APPROVED LIMIT | PROJECT_OWNER | 2026-08-08 |
| `payroll.review.submit`          | Submit payroll review cycles                    | COMPANY  | submit action plus its own MINIMAL response                           | APPROVED LIMIT | PROJECT_OWNER | 2026-08-08 |
| `payroll.review.approve`         | Approve configured payroll review stages        | COMPANY  | approval action plus its own MINIMAL response                         | APPROVED LIMIT | PROJECT_OWNER | 2026-08-08 |
| `payroll.review.reject`          | Reject submitted payroll review cycles          | COMPANY  | rejection action plus its own MINIMAL response                        | APPROVED LIMIT | PROJECT_OWNER | 2026-08-08 |
| `payroll.review.close`           | Close approved payroll review cycles            | COMPANY  | review-close action plus its own MINIMAL response                     | APPROVED LIMIT | PROJECT_OWNER | 2026-08-08 |
| `payroll.review.reopen`          | Reopen approved or closed payroll review cycles | COMPANY  | review-reopen action plus its own MINIMAL response                    | APPROVED LIMIT | PROJECT_OWNER | 2026-08-08 |
| `payroll.period.close.view`      | View payroll period closure summary             | COMPANY  | approved only for the applicable MINIMAL summary                      | APPROVED       | PROJECT_OWNER | 2026-08-08 |
| `payroll.period.close.readiness` | Evaluate payroll period closure readiness       | COMPANY  | approved only for the MINIMAL readiness contract                      | APPROVED       | PROJECT_OWNER | 2026-08-08 |
| `payroll.period.close.execute`   | Execute payroll period closure                  | COMPANY  | close action plus its own MINIMAL response                            | APPROVED LIMIT | PROJECT_OWNER | 2026-08-08 |
| `payroll.period.close.reopen`    | Reopen a closed payroll period                  | COMPANY  | reopen action plus its own MINIMAL response                           | APPROVED LIMIT | PROJECT_OWNER | 2026-08-08 |
| `payroll.period.close.history`   | View payroll period closure history             | COMPANY  | approved only for MINIMAL history, event and manifest contracts       | APPROVED       | PROJECT_OWNER | 2026-08-08 |

## Family result

| Family               | Capability decision                                                                               | Integral or blocked data                                          | Status   |
| -------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | -------- |
| AUTH / CONTEXT       | own-principal authentication and membership context requires no artificial FULL capability        | no capability authorizes omitted technical/grant fields           | APPROVED |
| GRANTS / ASSIGNMENTS | `delegation.manage` and `emergency_access.manage` are bounded to their matching MINIMAL contracts | raw Prisma and free-text fields remain forbidden                  | APPROVED |
| DASHBOARD            | `platform.read` is bounded to the MINIMAL dashboard                                               | personal data and FC-052 remain forbidden                         | APPROVED |
| PAYROLL REVIEW       | `payroll.review.view` covers MINIMAL reads; action capabilities cover only their action/response  | general FULL reads remain forbidden                               | APPROVED |
| PAYROLL PERIODS      | view/readiness/history cover matching MINIMAL reads; execute/reopen cover action responses        | totals, person arrays, text, metadata and actors remain forbidden | APPROVED |

No capability is created, broadened beyond these bounded semantics, assigned or automatically granted by this document.

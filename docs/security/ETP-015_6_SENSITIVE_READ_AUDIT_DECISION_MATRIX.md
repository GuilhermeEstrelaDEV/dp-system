# ETP-015.6 — Sensitive Read Audit Decision Matrix

**Status:** `APPROVED`

**Approver:** `PROJECT_OWNER`

**Decision date:** `2026-08-08`

**Existing runtime events:** 26, unchanged

## Homologated decisions

| Decision | FC range               | Event                                      | Approved behavior                                                                       | Runtime activation                         | Approver      | Date       |
| -------- | ---------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------- | ------------------------------------------ | ------------- | ---------- |
| AR-01    | FC-003..FC-015         | `AUTH_IDENTITY_VIEWED` proposal            | not required for the approved MINIMAL own-principal profile                             | NOT ACTIVATED                              | PROJECT_OWNER | 2026-08-08 |
| AR-02    | FC-016..FC-018         | `AUTH_COMPANIES_VIEWED` proposal           | not required for the approved MINIMAL membership-filtered list                          | NOT ACTIVATED                              | PROJECT_OWNER | 2026-08-08 |
| AR-03    | FC-020..FC-035         | `ACCESS_GRANTS_VIEWED`                     | event semantics approved for successful GET lists of substitutions and emergency access | READY WITH APPROVED MINIMAL IMPLEMENTATION | PROJECT_OWNER | 2026-08-08 |
| AR-04    | FC-036..FC-052         | `DASHBOARD_SUMMARY_VIEWED` proposal        | not required for the approved MINIMAL dashboard                                         | NOT ACTIVATED                              | PROJECT_OWNER | 2026-08-08 |
| AR-05    | FC-053..FC-080         | `PAYROLL_REVIEW_VIEWED` proposal           | not required for approved MINIMAL review reads                                          | NOT ACTIVATED                              | PROJECT_OWNER | 2026-08-08 |
| AR-06    | FC-061..FC-068         | `PAYROLL_REVIEW_FINDINGS_VIEWED` proposal  | not required for approved MINIMAL finding reads                                         | NOT ACTIVATED                              | PROJECT_OWNER | 2026-08-08 |
| AR-07    | FC-069..FC-080         | `PAYROLL_REVIEW_HISTORY_VIEWED` proposal   | not required for approved MINIMAL history                                               | NOT ACTIVATED                              | PROJECT_OWNER | 2026-08-08 |
| AR-08    | FC-081..FC-095         | `PAYROLL_PERIOD_READINESS_VIEWED` proposal | not required for approved MINIMAL readiness                                             | NOT ACTIVATED                              | PROJECT_OWNER | 2026-08-08 |
| AR-09    | FC-096..FC-107         | `PAYROLL_PERIOD_HISTORY_VIEWED` proposal   | not required for approved MINIMAL history                                               | NOT ACTIVATED                              | PROJECT_OWNER | 2026-08-08 |
| AR-10    | FC-100, FC-103..FC-106 | `PAYROLL_PERIOD_MANIFEST_VIEWED` proposal  | not required for approved MINIMAL manifest                                              | NOT ACTIVATED                              | PROJECT_OWNER | 2026-08-08 |

## AR-03 approved semantics

- one event per successful GET list call, never one event per returned record;
- applies separately to substitution and emergency-access lists;
- resource category: authorization access grant;
- operation: list using the approved MINIMAL projection;
- canonical envelope records actor, company and correlation/trace context;
- event detail may contain only `grantType` and `projectionProfile=MINIMAL`; if the implementation represents `correlationId` in metadata, it must be the canonical request value and must not duplicate or override the trace column;
- never record `reason`, `revocationReason`, subject user IDs, returned capabilities, payload or response body;
- the existing create/revoke/expire events remain unchanged;
- the implementation must use the ETP-015.7 catalog, allowlist and writer; it must not create a parallel trail.

The event must be persisted before a successful sensitive list response is released. A writer/catalog failure fails closed for that response. Exact adapter mechanics belong to the future runtime increment, not this approval branch.

## BDP-011 reconciliation

BDP-011 remains pending for final retention, disposal, export and privacy policy. It does not block AR-03 emission in the approved MINIMAL implementation because the existing ETP-015.7 architecture already preserves `AuditLog` append-only and no retention, deletion or export behavior is introduced by this decision. Any future automated retention/disposal/export, or expansion of event content, remains `STILL BLOCKED BY BDP-011`.

No event code or runtime catalog entry is created in this branch.

## Implementation evidence

The subsequent runtime increment adds only AR-03 as `ACCESS_GRANTS_VIEWED`. It is emitted for both
successful list operations, including empty results, and a writer failure prevents a successful
response. AR-01/02/04..10 remain inactive.

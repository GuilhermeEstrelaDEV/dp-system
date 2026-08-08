# ETP-015.6 — Sensitive Read Audit Decision Matrix

**Status:** `PENDING HUMAN DECISION`

**Existing runtime events:** 26, unchanged

**Sensitive reads enabled:** zero

## Finding

The ETP-015.7 catalog covers authenticated-session, grant and payroll write/decision events. Reusing a write event for a GET would change its semantics and is `NOT SUITABLE`. No existing event provides approved sensitive-read coverage, so the candidate read surfaces below are `EVENT GAP` until homologated.

## Proposed event decisions

All rows are `PROPOSED — NOT APPROVED`. Codes are documentary candidates only.

| Decision | FC range       | Candidate event code              | Category       | Resource / operation      | Minimum metadata proposal                                                     | Related capability                      | Atomicity proposal                                                                 | Expected cardinality       | Human decision |
| -------- | -------------- | --------------------------------- | -------------- | ------------------------- | ----------------------------------------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------- | -------------- |
| AR-01    | FC-003..FC-015 | `AUTH_IDENTITY_VIEWED`            | AUTH           | principal / read          | actor, session, selected field-profile identifier; no sensitive value         | capability decision pending             | successful read and event in one request outcome; no payload value                 | per `/auth/me` call        | PENDING        |
| AR-02    | FC-016..FC-018 | `AUTH_COMPANIES_VIEWED`           | AUTH           | company membership / list | actor, returned company count, profile identifier                             | capability decision pending             | same successful request boundary                                                   | per list call              | PENDING        |
| AR-03    | FC-020..FC-035 | `ACCESS_GRANTS_VIEWED`            | AUTHORIZATION  | grant / list              | actor, company, grant type, record count, profile identifier                  | delegation/emergency candidate pending  | same successful request boundary                                                   | per list call, not per row | PENDING        |
| AR-04    | FC-036..FC-052 | `DASHBOARD_SUMMARY_VIEWED`        | PLATFORM       | dashboard / summary       | actor, company, included aggregate sections, profile identifier               | `platform.read` candidate pending       | same successful request boundary                                                   | per summary call           | PENDING        |
| AR-05    | FC-053..FC-080 | `PAYROLL_REVIEW_VIEWED`           | PAYROLL_REVIEW | review / list-or-detail   | actor, company, review/run reference, profile identifier                      | `payroll.review.view` candidate pending | same successful request boundary                                                   | per endpoint call          | PENDING        |
| AR-06    | FC-061..FC-067 | `PAYROLL_REVIEW_FINDINGS_VIEWED`  | PAYROLL_REVIEW | findings / list           | actor, company, review reference, count, profile identifier                   | `payroll.review.view` candidate pending | same successful request boundary                                                   | per list call              | PENDING        |
| AR-07    | FC-069..FC-080 | `PAYROLL_REVIEW_HISTORY_VIEWED`   | PAYROLL_REVIEW | review history / read     | actor, company, review reference, profile identifier                          | `payroll.review.view` candidate pending | same successful request boundary                                                   | per history call           | PENDING        |
| AR-08    | FC-081..FC-095 | `PAYROLL_PERIOD_READINESS_VIEWED` | PAYROLL_PERIOD | readiness / evaluate-read | actor, company, period reference, included checks, profile identifier         | `.readiness` candidate pending          | event only after successful evaluation; transactional feasibility must be designed | per readiness call         | PENDING        |
| AR-09    | FC-096..FC-107 | `PAYROLL_PERIOD_HISTORY_VIEWED`   | PAYROLL_PERIOD | history / list-or-detail  | actor, company, period/version reference, profile identifier                  | `.history` candidate pending            | same successful request boundary                                                   | per history call           | PENDING        |
| AR-10    | FC-103..FC-106 | `PAYROLL_PERIOD_MANIFEST_VIEWED`  | PAYROLL_PERIOD | manifest / read           | actor, company, period/version and manifest id; never totals/reference values | `.history` candidate pending            | same successful request boundary                                                   | per manifest call          | PENDING        |

## Human decisions required

For each AR row decide whether auditing is mandatory, whether the proposed code is acceptable, event cardinality, sampling prohibition/allowance, metadata allowlist, transaction/request atomicity, failure behavior, retention dependency and whether masked/minimal reads also emit an event. BDP-011 must supply retention and sensitive-read governance before activation where applicable.

No runtime catalog, writer, listener, DTO, controller or test is changed here.

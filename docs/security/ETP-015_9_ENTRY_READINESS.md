# ETP-015.9 — Entry Readiness Assessment

**Status:** `ETP-015.9 ENTRY READINESS ASSESSED — HUMAN ENTRY DECISION REQUIRED`

**Implementation state:** `NOT STARTED — NOT AUTHORIZED`

**Assessment baseline:** `origin/develop@b8324037b053b947692992d698888ed6e73db5f2`

## Purpose and boundary

This assessment reconciles the remaining legacy route families after the verified completion of
ETP-015.8. It does not approve a capability, assign an owner, resolve a business decision, activate
authorization, change a route, or start ETP-015.9.

## Current inventory

The runtime verifier classifies 165 handlers: 4 public, 5 authenticated, 31 capability protected,
and 125 legacy deferred. The historical inventory contains 163 entries; the two later runtime
handlers are `AuthController#logout` and `DashboardController#summary`. ETP-015.4 explicitly
classifies both as authenticated transversal/projection surfaces. They must remain reconciled as
such rather than being silently absorbed into a legacy rollout family.

The 125 deferred handlers decompose as follows:

| Proposed wave | Families                                                        | Handlers | Readiness                                           |
| ------------- | --------------------------------------------------------------- | -------: | --------------------------------------------------- |
| P1            | company, employee, contract, payroll parameters, payroll rubric |       33 | `BLOCKED`                                           |
| P2            | organization, admission, leave, variable compensation           |       56 | `BLOCKED`                                           |
| P3            | time, benefit, vacation                                         |       21 | `BLOCKED`                                           |
| Residual P0   | payroll period legacy, payroll input, payroll run               |       15 | `BLOCKED — WAVE ALLOCATION HUMAN DECISION REQUIRED` |
| Total         | all deferred handlers                                           |      125 | —                                                   |

The proposed P4 scope—legitimate public surfaces and reconciliation of already protected
surfaces—is `READY — PRESERVATION/RECONCILIATION ONLY`. This readiness does not authorize a runtime
change or entry into ETP-015.9. Authentication, grants, payroll review, and canonical payroll-period
families are already protected and are classified as `PRESERVE`, not as rollout candidates.

### Family inventory

| Priority    | Family                | Handlers |
| ----------- | --------------------- | -------: |
| P1          | company               |        6 |
| P1          | employee              |       12 |
| P1          | contract              |        7 |
| P1          | payroll parameters    |        4 |
| P1          | payroll rubrics       |        4 |
| P2          | organization          |       24 |
| P2          | admission             |       19 |
| P2          | leave                 |        5 |
| P2          | variable compensation |        8 |
| P3          | time                  |        8 |
| P3          | benefit               |        6 |
| P3          | vacation              |        7 |
| Residual P0 | payroll period legacy |        6 |
| Residual P0 | payroll input         |        4 |
| Residual P0 | payroll run           |        5 |

## Family readiness and blockers

| Family                         | Candidate capability classification | Material dependencies                                    | Owner          | Result                      |
| ------------------------------ | ----------------------------------- | -------------------------------------------------------- | -------------- | --------------------------- |
| Company                        | `CANDIDATE — NOT APPROVED`          | BDP-012 and administrative scope                         | not documented | `BLOCKED`                   |
| Employee                       | `CANDIDATE — NOT APPROVED`          | BDP-001, BDP-003, BDP-005, BDP-011                       | not documented | `BLOCKED`                   |
| Contract                       | `CANDIDATE — NOT APPROVED`          | BDP-003, BDP-004, BDP-005, BDP-011                       | not documented | `BLOCKED`                   |
| Payroll parameters and rubrics | `CANDIDATE — NOT APPROVED`          | capability, audit, and segregation approval              | not documented | `BLOCKED`                   |
| Organization                   | `CANDIDATE — NOT APPROVED`          | BDP-002, BDP-012, BDP-013                                | not documented | `BLOCKED`                   |
| Admission                      | `CANDIDATE — NOT APPROVED`          | BDP-001 and BDP-011                                      | not documented | `BLOCKED`                   |
| Leave                          | `CANDIDATE — NOT APPROVED`          | BDP-011                                                  | not documented | `BLOCKED`                   |
| Variable compensation          | `CANDIDATE — NOT APPROVED`          | BDP-006 and BDP-011                                      | not documented | `BLOCKED`                   |
| Time                           | `CANDIDATE — NOT APPROVED`          | BDP-007 and BDP-010                                      | not documented | `BLOCKED`                   |
| Benefit                        | `CANDIDATE — NOT APPROVED`          | BDP-008 and BDP-011                                      | not documented | `BLOCKED`                   |
| Vacation                       | `CANDIDATE — NOT APPROVED`          | DP/Juridical policy approval and sensitive-data decision | not documented | `BLOCKED`                   |
| Residual P0                    | `CANDIDATE — NOT APPROVED`          | explicit wave allocation and capability approval         | not documented | `BLOCKED`                   |
| Public/protected preservation  | existing classification only        | reconciliation evidence                                  | not documented | `READY — PRESERVATION ONLY` |

BDP-009, BDP-014, and BDP-AUTH-LEGACY are approved, but they do not approve new domain
capabilities or resolve the pending dependencies above. BDP-001, BDP-002, BDP-003, BDP-004,
BDP-005, BDP-006, BDP-007, BDP-008, BDP-010, BDP-011, BDP-012, and BDP-013 remain pending.

### Technical readiness by family

| Family                         | Sensitivity/projection                              | Audit                           | Company isolation                               | Known consumer evidence                            | Principal risk                                 |
| ------------------------------ | --------------------------------------------------- | ------------------------------- | ----------------------------------------------- | -------------------------------------------------- | ---------------------------------------------- |
| Company                        | legacy contract requires explicit classification    | not approved for rollout        | reusable foundation; family proof required      | web/demo present; exhaustive inventory pending     | administrative overreach                       |
| Employee                       | blocked fields remain omitted under BDP-001/011     | not approved for rollout        | reusable foundation; two-company proof required | web/demo present; exhaustive inventory pending     | personal-data exposure                         |
| Contract                       | blocked fields remain omitted under BDP-003/005/011 | not approved for rollout        | reusable foundation; two-company proof required | web/demo present; exhaustive inventory pending     | employment-data exposure                       |
| Payroll parameters and rubrics | classification not approved                         | explicit events required        | reusable foundation; family proof required      | web/demo present; external consumers not evidenced | calculation inputs changed without segregation |
| Organization                   | depends on BDP-002/012/013                          | not approved for rollout        | reusable foundation; hierarchy proof required   | web/demo present; exhaustive inventory pending     | cross-company hierarchy leakage                |
| Admission                      | blocked fields remain omitted under BDP-001/011     | not approved for rollout        | reusable foundation; two-company proof required | web/demo present; integrations not evidenced       | personal and onboarding data exposure          |
| Leave                          | blocked fields remain omitted under BDP-011         | not approved for rollout        | reusable foundation; two-company proof required | web/demo present; exhaustive inventory pending     | sensitive leave-data exposure                  |
| Variable compensation          | blocked fields remain omitted under BDP-006/011     | critical reads/writes undecided | reusable foundation; two-company proof required | web/demo present; exhaustive inventory pending     | financial exposure or unauthorized mutation    |
| Time                           | depends on BDP-007/010                              | critical reads/writes undecided | reusable foundation; two-company proof required | web/demo present; integrations not evidenced       | time-record policy conflict                    |
| Benefit                        | blocked fields remain omitted under BDP-008/011     | critical reads/writes undecided | reusable foundation; two-company proof required | web/demo present; integrations not evidenced       | sensitive benefit-data exposure                |
| Vacation                       | policy and projection not approved                  | critical reads/writes undecided | reusable foundation; two-company proof required | web/demo present; exhaustive inventory pending     | undocumented DP/Juridical policy               |
| Residual P0                    | classification and wave allocation absent           | audit decision absent           | canonical overlap must be proved                | frontend/demo consumers; full inventory pending    | parallel rule or premature canonical migration |
| Public/protected preservation  | existing approved classification only               | existing policy preserved       | no expansion permitted                          | current consumers preserved                        | accidental reclassification                    |

“Reusable foundation” means only that the existing technical mechanism can enforce company scope;
it is not evidence that the family policy, repository path, or consumer contract is approved. No
family has a named accountable owner in the current inventory. Owner assignment is therefore a
blocking entry requirement rather than an inferred responsibility.

## Capability, data, audit, and test gates

- the current catalog has 19 capabilities and contains no approved capability family for the
  candidate P1–P3 or residual P0 routes;
- candidate capability names must not be inferred from route names, verbs, or role names;
- each family needs explicit read/write/action classification, sensitivity profile, audit events,
  segregation constraints, company-isolation policy, and named operational owner;
- fields omitted under BDP-001 or BDP-011 remain omitted; rollout cannot broaden projections;
- no capability may be assigned automatically, and no seed may expand access;
- each approved family needs 401/403/404 coverage, two-company isolation, deny-by-default,
  projection tests, audit atomicity for critical writes, rollback evidence, OpenAPI reconciliation,
  and consumer evidence;
- rollout must remain family-by-family, observable, reversible, and independently gated.

## Required human entry decisions

1. Allocate the 15 residual P0 handlers to an explicitly approved wave or separate governed scope.
2. Approve the capability and sensitivity classification for each candidate family.
3. Name the accountable owner and required Security, Product, DP, and Jurídico/DPO approvers for
   each family.
4. Resolve the material pending BDP dependencies before exposing any currently omitted field.
5. Approve the first rollout family, its evidence gate, rollback boundary, and entry criteria.
6. Confirm that the P4 preservation/reconciliation scope requires no runtime behavior change.

Until those decisions are recorded, every business-domain rollout family remains blocked. Gate D,
production, cloud, deploy, global enforcement, and alias removal remain outside this assessment.

## Conclusion

`ETP-015.9 ENTRY READINESS ASSESSED — HUMAN ENTRY DECISION REQUIRED`

`ETP-015.9 NOT STARTED — NOT AUTHORIZED`

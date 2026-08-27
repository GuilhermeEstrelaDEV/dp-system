# Release Candidate Homologation Readiness

## Result

`BLOCKED — RELEASE CANDIDATE READINESS`

- baseline: `c23c68deff6e542febe07db74d7da3119c05d1dd`;
- validation date: 2026-08-26;
- scope: local/demonstrative hardening and homologation preparation;
- known blockers: 2.

## Consolidated evidence

| Control                           | Result                                   |
| --------------------------------- | ---------------------------------------- |
| Route inventory                   | 165 total / 0 deferred / 0 unclassified  |
| Public routes                     | 4                                        |
| Authenticated-only routes         | 5                                        |
| Capability-protected routes       | 156                                      |
| Capabilities                      | 48                                       |
| Audit events                      | 81                                       |
| Migrations                        | 16                                       |
| Automatic grants                  | 0                                        |
| Temporary grants tested           | 35 MANUAL; idempotent; revoked           |
| API tests                         | `PASS` — 86 suites / 410 active tests    |
| Frontend tests                    | `PASS` — 22 files / 87 tests             |
| Essential                         | `17/17 PASS`                             |
| P1                                | `33/33 PASS`                             |
| P2                                | `56/56 PASS`                             |
| P3                                | `21/21 PASS`                             |
| P0-RESIDUAL                       | `15/15 PASS`                             |
| Unexpected 5xx                    | 0                                        |
| Security                          | `PASS`                                   |
| Company isolation                 | `PASS`                                   |
| Audit fail-closed                 | `PASS`                                   |
| Canonical payroll flow            | `PASS`                                   |
| DataTable static/automated review | `PASS`                                   |
| UX automated/static               | `PASS`                                   |
| UX visual execution               | `PENDING HUMAN EXECUTION`                |
| Accessibility static              | `PASS`                                   |
| Accessibility keyboard/dialog     | `PENDING HUMAN EXECUTION`                |
| Dependency review                 | `BLOCKED` — 1 high and 3 moderate remain |

## Coverage

- API: 75.09% lines and 71.03% branches;
- frontend: 76.06% lines and 72.53% branches.

The 0.02 percentage-point frontend branch variation from the previous 72.55% report is not a
material regression and no functional branch was removed by this hardening work.

## Hardening performed

- corrected broken UTF-8 messages in session and organizational API flows;
- completed the frontend demo-mode environment examples;
- pinned compatible patched transitive versions of `effect`, `brace-expansion` and `js-yaml`;
- reduced dependency advisories from 10 (7 high) to 4 (1 high);
- rebuilt the local images and database from zero and reran every regression gate;
- produced the readiness inventory, configuration review, human script, checklist and known
  limitations.

## Blocking conditions

1. `deepmerge-ts` requires a major remediation through the Prisma tooling dependency chain, and
   current React Router advisories also require a reviewed major upgrade or risk decision.
2. No browser surface was available to produce the mandatory responsive and keyboard evidence.

The exact dependency evidence and human options are recorded in
[SECURITY_DEPENDENCY_RISK_DECISION.md](SECURITY_DEPENDENCY_RISK_DECISION.md). The security human
decision remains `PENDING`; no risk was accepted. Visual evidence remains
`PENDING HUMAN EXECUTION` in
[HOMOLOGATION_VISUAL_EVIDENCE.md](HOMOLOGATION_VISUAL_EVIDENCE.md), and keyboard/dialog evidence
remains `PENDING HUMAN EXECUTION` in
[HOMOLOGATION_ACCESSIBILITY_EVIDENCE.md](HOMOLOGATION_ACCESSIBILITY_EVIDENCE.md).

The exact exit criteria are recorded in
[RELEASE_CANDIDATE_CHECKLIST.md](RELEASE_CANDIDATE_CHECKLIST.md). Human execution must use
[HOMOLOGATION_SCRIPT.md](HOMOLOGATION_SCRIPT.md), and all debt remains disclosed in
[KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md).

## Scope boundaries

This result does not authorize production, cloud, deployment, Gate D, ETP-015.10 or resolution of
pending BDP/legal/business decisions.

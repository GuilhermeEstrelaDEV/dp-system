# Release Candidate Checklist

## Status legend

- `PASS`: supported by evidence recorded in this branch;
- `FAIL`: missing evidence or unresolved blocker;
- `PENDING`: requires human execution or decision and has no result yet;
- `BLOCKED`: a Release Candidate gate cannot pass without resolution;
- `N/A`: outside the authorized local/demonstrative scope.

| Category          | Check                                            | Status    | Evidence                                                                         |
| ----------------- | ------------------------------------------------ | --------- | -------------------------------------------------------------------------------- |
| Functional        | Essential regression                             | `PASS`    | 17/17 smoke                                                                      |
| Functional        | P1 regression                                    | `PASS`    | 33/33 smoke                                                                      |
| Functional        | P2 regression                                    | `PASS`    | 56/56 smoke                                                                      |
| Functional        | P3 regression                                    | `PASS`    | 21/21 smoke                                                                      |
| Functional        | P0-RESIDUAL regression                           | `PASS`    | 15/15 smoke                                                                      |
| Security          | Route classification                             | `PASS`    | 165 total; 0 deferred; 0 unclassified                                            |
| Security          | Deny-by-default and no bypass                    | `PASS`    | Focused verifier tests and negative smokes                                       |
| Authorization     | Capability catalog                               | `PASS`    | 48 unique capabilities; no role-name decision                                    |
| Authorization     | Automatic assignments                            | `PASS`    | Seed and clean database show 0                                                   |
| Company isolation | Horizon/Atlas list, detail and action isolation  | `PASS`    | Cross-company 404 and relation-injection smokes                                  |
| Audit             | Event catalog and authorized writer              | `PASS`    | 81 events; sanitizer and writer tests                                            |
| Audit             | Critical mutation rollback                       | `PASS`    | Audit fail-closed unit/integration coverage                                      |
| Database          | PostgreSQL 16 clean bootstrap                    | `PASS`    | 16/16 migrations, seed and dataset verifier                                      |
| Database          | Manual grants lifecycle                          | `PASS`    | 35 MANUAL, idempotent, revoked; history preserved                                |
| Frontend          | Automated tests, typecheck and build             | `PASS`    | 22 files, 87 tests, successful build                                             |
| Frontend          | Company-switch cache reset                       | `PASS`    | Auth context clears query cache; automated/smoke evidence                        |
| UX                | Broken UTF-8 runtime messages                    | `PASS`    | Session and organization messages corrected                                      |
| UX                | Visual review at four viewport classes           | `PENDING` | Human matrix created; execution evidence not supplied                            |
| Accessibility     | Semantic/static sanity                           | `PASS`    | Labels, headings, table semantics, focus styles and live/error regions inspected |
| Accessibility     | Keyboard/dialog/viewport execution               | `PENDING` | Human keyboard/dialog script created; execution evidence not supplied            |
| Dependencies      | No high-severity advisory                        | `BLOCKED` | `deepmerge-ts` <8 remains through Prisma 6 tooling; human decision pending       |
| Dependencies      | No unapproved major upgrade                      | `PASS`    | React Router 7 and `deepmerge-ts` 8 were not forced                              |
| Tests             | API suite                                        | `PASS`    | 86 active suites and 410 active tests                                            |
| Tests             | Coverage preserved                               | `PASS`    | API 75.09/71.03; frontend 76.06/72.53 lines/branches                             |
| Documentation     | Inventory, configuration, script and limitations | `PASS`    | `docs/release/` package                                                          |
| Operations        | Local health, reset and recovery                 | `PASS`    | Healthy Compose stack and deterministic reset                                    |
| Operations        | Production/cloud/deployment                      | `N/A`     | Explicitly not authorized                                                        |
| Known limitations | All blockers disclosed                           | `PASS`    | See `KNOWN_LIMITATIONS.md`                                                       |

## Decision

`BLOCKED — RELEASE CANDIDATE READINESS`

Promotion requires both:

1. an approved compatible remediation or explicit security risk decision using
   [SECURITY_DEPENDENCY_RISK_DECISION.md](SECURITY_DEPENDENCY_RISK_DECISION.md);
2. executed visual evidence in
   [HOMOLOGATION_VISUAL_EVIDENCE.md](HOMOLOGATION_VISUAL_EVIDENCE.md);
3. executed keyboard/dialog evidence in
   [HOMOLOGATION_ACCESSIBILITY_EVIDENCE.md](HOMOLOGATION_ACCESSIBILITY_EVIDENCE.md).

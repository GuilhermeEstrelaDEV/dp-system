# Release Candidate Checklist

## Status legend

- `PASS`: supported by evidence recorded in this branch;
- `FAIL`: missing evidence or unresolved blocker;
- `PENDING`: requires human execution or decision and has no result yet;
- `BLOCKED`: a Release Candidate gate cannot pass without resolution;
- `RECORDED`: a known limitation remains documented and does not receive a false pass;
- `N/A`: outside the authorized local/demonstrative scope.

| Category          | Check                                            | Status                           | Evidence                                                                         |
| ----------------- | ------------------------------------------------ | -------------------------------- | -------------------------------------------------------------------------------- |
| Functional        | Essential regression                             | `PASS`                           | 17/17 smoke                                                                      |
| Functional        | P1 regression                                    | `PASS`                           | 33/33 smoke                                                                      |
| Functional        | P2 regression                                    | `PASS`                           | 56/56 smoke                                                                      |
| Functional        | P3 regression                                    | `PASS`                           | 21/21 smoke                                                                      |
| Functional        | P0-RESIDUAL regression                           | `PASS`                           | 15/15 smoke                                                                      |
| Security          | Route classification                             | `PASS`                           | 165 total; 0 deferred; 0 unclassified                                            |
| Security          | Deny-by-default and no bypass                    | `PASS`                           | Focused verifier tests and negative smokes                                       |
| Authorization     | Capability catalog                               | `PASS`                           | 48 unique capabilities; no role-name decision                                    |
| Authorization     | Automatic assignments                            | `PASS`                           | Seed and clean database show 0                                                   |
| Company isolation | Horizon/Atlas list, detail and action isolation  | `PASS`                           | Cross-company 404 and relation-injection smokes                                  |
| Audit             | Event catalog and authorized writer              | `PASS`                           | 81 events; sanitizer and writer tests                                            |
| Audit             | Critical mutation rollback                       | `PASS`                           | Audit fail-closed unit/integration coverage                                      |
| Database          | PostgreSQL 16 clean bootstrap                    | `PASS`                           | 16/16 migrations, seed and dataset verifier                                      |
| Database          | Manual grants lifecycle                          | `PASS`                           | 35 MANUAL, idempotent, revoked; history preserved                                |
| Frontend          | Automated tests, typecheck and build             | `PASS`                           | 22 files, 87 tests, successful build                                             |
| Frontend          | Company-switch cache reset                       | `PASS`                           | Auth context clears query cache; automated/smoke evidence                        |
| UX                | Broken UTF-8 runtime messages                    | `PASS`                           | Session and organization messages corrected                                      |
| UX                | Visual review at four viewport classes           | `PASS — HUMAN`                   | Aggregate human result supplied; screenshots not provided                        |
| UX                | Responsive sanity                                | `PASS — HUMAN`                   | Desktop, notebook, tablet and mobile sanity approved                             |
| Accessibility     | Semantic/static sanity                           | `PASS`                           | Labels, headings, table semantics, focus styles and live/error regions inspected |
| Accessibility     | Keyboard/dialog execution                        | `PASS — HUMAN`                   | TAB, SHIFT+TAB, ENTER, SPACE, ESC and dialogs approved as sanity checks          |
| Dependencies      | Local-homologation security gate                 | `PASS WITH TEMPORARY ACCEPTANCE` | 1 high and 3 moderate remain; acceptance is local-only                           |
| Dependencies      | No unapproved major upgrade                      | `PASS`                           | React Router 7 and `deepmerge-ts` 8 were not forced                              |
| Tests             | API suite                                        | `PASS`                           | 86 active suites and 410 active tests                                            |
| Tests             | Coverage preserved                               | `PASS`                           | API 75.09/71.03; frontend 76.06/72.53 lines/branches                             |
| Documentation     | Inventory, configuration, script and limitations | `PASS`                           | `docs/release/` package                                                          |
| Operations        | Local health, reset and recovery                 | `PASS`                           | Healthy Compose stack and deterministic reset                                    |
| Operations        | Production/cloud/deployment                      | `N/A`                            | Explicitly not authorized                                                        |
| Known limitations | Residual limitations documented                  | `RECORDED`                       | 1 high, 3 moderate and scope boundaries remain in `KNOWN_LIMITATIONS.md`         |

## Decision

`RELEASE CANDIDATE — READY FOR HUMAN HOMOLOGATION`

`NOT PRODUCTION READY`

Human gates recorded:

1. dependency risk: `APPROVED — TEMPORARY LOCAL HOMOLOGATION ONLY` in
   [SECURITY_DEPENDENCY_RISK_DECISION.md](SECURITY_DEPENDENCY_RISK_DECISION.md);
2. visual and responsive: `PASS — HUMAN` in
   [HOMOLOGATION_VISUAL_EVIDENCE.md](HOMOLOGATION_VISUAL_EVIDENCE.md);
3. accessibility keyboard/dialog sanity: `PASS — HUMAN` in
   [HOMOLOGATION_ACCESSIBILITY_EVIDENCE.md](HOMOLOGATION_ACCESSIBILITY_EVIDENCE.md).

Known limitations are recorded. Production, cloud, external deployment, real data and Gate D
remain unauthorized, and ETP-015.10 remains incomplete.

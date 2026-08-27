# Homologation Readiness Inventory

## Snapshot

- baseline: `develop@c23c68deff6e542febe07db74d7da3119c05d1dd`;
- inventory date: 2026-08-26;
- scope: local and demonstrative Release Candidate preparation;
- classification: `PASS`, `IMPROVEMENT` or `BLOCKER`;
- production, cloud, external deployment, Gate D and ETP-015.10 remain outside this work.

This inventory records the state observed before hardening changes. A later acceptance record must
show evidence for every resolved item; an item is not promoted to `PASS` by documentation alone.

## Readiness classification

| Area                    | Classification | Evidence and required action                                                                                                                                                                                                                                                                           |
| ----------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A. Backend              | `IMPROVEMENT`  | The monorepo check and 44 focused security, health and error-handling tests pass. Five organizational error messages contain broken UTF-8 text and require an editorial runtime correction.                                                                                                            |
| B. Frontend             | `IMPROVEMENT`  | Tests, typecheck and build pass; navigation, loading, error states, permission visibility and shared tables exist. One stored-session error contains broken UTF-8 text. Dialog focus behavior requires a focused accessibility regression check.                                                       |
| C. Database             | `IMPROVEMENT`  | Prisma validation passes and the repository contains 16 migrations. A clean PostgreSQL 16 bootstrap, seed and zero-assignment check are still required for final evidence.                                                                                                                             |
| D. Security             | `PASS`         | Route classification, deny-by-default, explicit capabilities, active-company isolation, audit fail-closed and metadata sanitizer focused tests pass. No direct `AuditLog` writer exists outside `AuditWriterService`; no secret signature was found in tracked functional files.                       |
| E. Configuration        | `PASS`         | Required database and JWT values fail fast through Joi. Local examples use explicitly fictitious credentials, `.env` files are ignored, CORS is allowlisted and Vite exposes only its local API/demo variables.                                                                                        |
| F. Logs                 | `PASS`         | Structured request logs include method, path, status, duration and correlation ID without body or headers. Sensitive metadata keys are redacted. Development-only traces remain a local diagnostic behavior and are not production authorization.                                                      |
| G. Error handling       | `PASS`         | The global filter maps expected HTTP failures, replaces all 5xx response messages with a generic message and does not expose stack traces or Prisma errors to clients. Focused filter tests pass.                                                                                                      |
| H. UX                   | `IMPROVEMENT`  | Main flows expose loading and error states and prevent pending resubmission. Broken UTF-8 messages must be fixed; human journey evidence and final visual review are pending.                                                                                                                          |
| I. Performance          | `IMPROVEMENT`  | No obvious duplicate closing logic or security-context cache leak was found. The frontend build reports a known 554.65 kB chunk warning; code splitting remains a documented follow-up, not a local functional blocker.                                                                                |
| J. Operational recovery | `IMPROVEMENT`  | Local demo setup/reset/status and reversible manual grants exist. Clean reset, restart, grant/revoke history and smoke evidence remain pending in this run. Production backup/restore is outside the authorized scope.                                                                                 |
| K. Documentation        | `IMPROVEMENT`  | Full Delivery acceptance exists. Homologation script, RC checklist, configuration review, known limitations and consolidated RC readiness record still need to be produced.                                                                                                                            |
| L. Tests                | `PASS`         | `pnpm check` passes at the mandatory baseline. Full coverage and all five smoke suites remain required as final evidence.                                                                                                                                                                              |
| M. Dependencies         | `BLOCKER`      | `pnpm audit --prod --audit-level high` reports 10 advisories: 7 high and 3 moderate, including `effect`, `brace-expansion`, `js-yaml` and `deepmerge-ts`. Apply only compatible patch/transitive remediation and rerun the complete regression suite. Major upgrades are not authorized automatically. |
| N. Demonstration data   | `IMPROVEMENT`  | The accepted fictitious Horizon/Atlas fixtures and zero automatic grants remain present. A clean bootstrap and canonical dataset verifier are pending in this run.                                                                                                                                     |
| O. Human homologation   | `IMPROVEMENT`  | The product is functionally integrated, but the human execution script, evidence fields and RC checklist do not yet exist. No human homologation has occurred.                                                                                                                                         |

## Security bypass search

The source and authoritative verifiers were reviewed for unclassified handlers, missing route
policy, role-name authorization, `platform.manage` bypass, client-supplied company authority,
cross-company global lookups, unrestricted projections, direct audit writes, raw request/response
metadata, debug endpoints and exposed fixtures.

No runtime authorization bypass was found. The occurrences of `ADMINISTRATOR` are limited to the
explicit local-demo access tool; they do not authorize application requests. DTOs that retain a
legacy `companyId` reject values different from the authenticated active company. The only direct
`auditLog.create` call is inside `AuditWriterService`.

## Initial blocker

Release Candidate readiness is blocked until the high-severity dependency advisories are removed
or a documented non-remediable exception is approved. This task will attempt only the smallest
compatible transitive remediation, followed by frozen install, Prisma, full tests, coverage,
PostgreSQL 16 bootstrap and all smoke suites.

## Post-hardening disposition

- compatible patches reduced the audit from 7 high/3 moderate to 1 high/3 moderate;
- no major dependency override was applied;
- broken UTF-8 runtime messages were corrected;
- PostgreSQL 16 clean bootstrap, 16 migrations, seed and dataset verifier passed;
- all five smoke suites, full tests, build, Prisma and coverage passed;
- visual responsive and keyboard evidence could not be produced because no controllable browser
  was available.

The dependency and visual-evidence blockers remain open. Final classification is
`BLOCKED — RELEASE CANDIDATE READINESS`.

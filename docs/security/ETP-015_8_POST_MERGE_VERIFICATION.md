# ETP-015.8 — Post-Merge Verification

**Status:** `COMPLETED — POST-MERGE VERIFIED`

**Verification date:** 2026-08-10

**Post-merge verification:** `PASS`

## Audited baseline

- pull request: PR #86;
- functional commit: `c7c0ecd307df297052007f39ce90de31ede84d4d`;
- Gate C approval commit: `96296fa85a1f7431536c7f34e3fe9419c95f8791`;
- merge commit: `b8324037b053b947692992d698888ed6e73db5f2`;
- verified `origin/develop` HEAD: `b8324037b053b947692992d698888ed6e73db5f2`.

Gate C remains `APPROVED — SECURITY / PRODUCT / DP — 2026-08-10`, as recorded in
[ETP-015_GATE_C_HUMAN_APPROVAL.md](ETP-015_GATE_C_HUMAN_APPROVAL.md). This verification found no
post-merge regression and made no functional change.

## Runtime and architecture verification

- all four `/payroll-closures` aliases remain deprecated adapters;
- list and detail require `payroll.period.close.history`, close requires
  `payroll.period.close.execute`, and reopen requires `payroll.period.close.reopen`;
- adapters delegate exclusively to the canonical history, operational closure, and controlled
  reopening services;
- `PayrollPeriod` remains the canonical aggregate and the legacy service contains no direct Prisma
  access or parallel business rule;
- company isolation, deny-by-default authorization, `MINIMAL` projection, canonical idempotency,
  transactional audit, and append-only history remain preserved;
- frontend `/folha/fechamentos` continues to use the canonical readiness, history, close, and reopen
  contracts;
- no route was removed and no `410`, redirect, `Sunset`, or legacy fallback was introduced.

## Reconciled invariants

| Invariant                    | Verified value |
| ---------------------------- | -------------- |
| Runtime handlers             | 165            |
| Public                       | 4              |
| Authenticated                | 5              |
| Capability protected         | 31             |
| Legacy deferred              | 125            |
| Capability catalog           | 19             |
| Automatic grants/assignments | 0              |
| Audit event catalog          | 27             |
| Migrations                   | 16             |

No capability, grant, assignment, audit event, migration, Prisma model, seed behavior, or public
contract was added by the post-merge verification.

## Validation evidence

- `pnpm check`, lint, typecheck, tests, build, Prisma generate, and Prisma validate: `PASS`;
- API: 79 suites passed, 6 PostgreSQL-conditional suites skipped in the ordinary run; 371 tests
  passed and 27 were skipped;
- frontend: 22 test files and 80 tests passed;
- scripts: 28 tests passed;
- API coverage: 74.86% lines/statements, 72.21% branches, and 51.69% functions;
- frontend coverage: 78.43% lines/statements, 74.58% branches, and 63.91% functions;
- focused authorization/P0/HTTP verification: 11 suites and 41 tests passed;
- clean PostgreSQL 16.14: 16/16 migrations, seed, and 6 database suites with 27/27 tests passed;
- clean-database checks covered capability catalog, enterprise isolation, authorization audit,
  closure persistence, operational closure, controlled reopening, constraints, append-only
  behavior, concurrency, and idempotent replay;
- demo status, data verification, operational verification, rehearsal, and presentation verification:
  `PASS`;
- `git diff --check`: `PASS`.

The clean PostgreSQL executions used disposable containers without persistent volumes. The final
authoritative run enabled `RUN_DATABASE_TESTS=true`; all six conditional database suites ran and
passed.

## Residual risks and limits

- the four deprecated aliases remain present until a separately approved removal decision;
- 125 handlers remain `LEGACY_DEFERRED`, including 15 residual P0 handlers not allocated to an
  approved rollout wave;
- BDP-001 and BDP-011 remain pending, so omitted fields cannot be exposed;
- target-environment, production, cloud, and deploy evidence remains outside this local verification;
- the known frontend chunk-size and local browser-availability warnings remain non-blocking;
- Gate D has not started and has not been approved.

## Final state

- ETP-015.8: `COMPLETED — POST-MERGE VERIFIED`;
- implementation: merged in PR #86;
- Gate C: `APPROVED`;
- aliases: deprecated and protected; removal not authorized;
- Gate D: `NOT STARTED — NOT APPROVED`;
- ETP-015.9: `NOT STARTED — NOT AUTHORIZED`;
- ETP-015.10: `NOT STARTED — NOT AUTHORIZED`;
- production, cloud, deploy, and removal of deprecated aliases: `NOT AUTHORIZED`.

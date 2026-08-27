# Configuration Security Review

## Scope

Review performed on 2026-08-26 against
`develop@c23c68deff6e542febe07db74d7da3119c05d1dd`. It covers local development, test and the
isolated local-demo environment. It does not define or authorize production, cloud or external
deployment configuration.

Reviewed surfaces:

- `.env.example`, `.env.demo.example` and `apps/web/.env.example`;
- `.gitignore` and tracked-file inventory;
- `docker-compose.demo.yml`, API and web Dockerfiles;
- Nest configuration, Joi validation, CORS, body limit, throttling and Swagger switches;
- Vite configuration and all `VITE_*` consumers;
- Prisma configuration, migrations, seeds and demo scripts;
- CI workflow and dependency lockfile.

## Findings

| Control                       | Status | Evidence                                                                                                                          |
| ----------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Real secrets in tracked files | `PASS` | Signature search found no access token, private key or provider credential.                                                       |
| Environment files ignored     | `PASS` | `.env` and `.env.*` are ignored; only explicit example files are tracked. Local `.env.demo.local` remains ignored.                |
| Example credentials           | `PASS` | Values are clearly fictitious, local-only and documented as unsuitable outside a workstation.                                     |
| Backend fail-fast             | `PASS` | `DATABASE_URL` and a JWT secret with at least 32 characters are mandatory; invalid keys are listed without printing their values. |
| CORS                          | `PASS` | Origins are explicitly allowlisted and no wildcard credential policy is enabled.                                                  |
| Request limits                | `PASS` | Body size and throttling are configurable with validated bounded defaults.                                                        |
| Frontend exposure             | `PASS` | Only `VITE_API_URL` and the boolean demo-mode switch are consumed by the browser bundle. No database or JWT value is exposed.     |
| Example completeness          | `PASS` | `VITE_DEMO_MODE=false` was added to the generic root and web examples.                                                            |
| Container isolation           | `PASS` | Predictable `dp-system-demo-*` names, a dedicated network and a named database volume are used. Reset targets only that project.  |
| Health information            | `PASS` | Public health responses contain status, database availability and latency only; no connection string or host detail is returned.  |
| CI credentials                | `PASS` | CI uses local service placeholders with no production value and read-only repository permissions.                                 |

## Environment matrix

| Environment | Database                                      | Credentials                     | Swagger            | Demo mode           | Status |
| ----------- | --------------------------------------------- | ------------------------------- | ------------------ | ------------------- | ------ |
| development | Explicit `DATABASE_URL` required              | Developer-provided local values | Configurable       | Disabled by default | `PASS` |
| test        | Explicit test database/JWT values             | Test-only placeholders          | Configurable       | Disabled            | `PASS` |
| local-demo  | PostgreSQL 16 in the isolated Compose project | Fictitious documented accounts  | Local/configurable | Explicitly enabled  | `PASS` |

There is no approved production environment matrix. The web container intentionally runs the Vite
server for the local demonstration and must not be interpreted as a production serving strategy.

## Dependency security disposition

Compatible transitive patches were pinned for `effect`, `brace-expansion` and `js-yaml`. The audit
was reduced from 10 advisories (7 high, 3 moderate) to 4 advisories (1 high, 3 moderate). The
remaining issues require major upgrades of `deepmerge-ts` and React Router or an approved risk
exception. They are documented as Release Candidate blockers and were not overridden
automatically.

## Result

Configuration and secret handling: `PASS`.

Overall dependency readiness: `FAIL — MAJOR REMEDIATION OR RISK DECISION REQUIRED`.

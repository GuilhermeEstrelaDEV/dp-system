# Security Dependency Risk Decision

## Current audit

Audit executed on 2026-08-26 with `pnpm audit --prod --json` on
`release/homologation-readiness@3384ca9101269b83c1ee3ddb4b899193f618ffe6`.

| Severity | Before compatible remediation | Current | Decision state                       |
| -------- | ----------------------------: | ------: | ------------------------------------ |
| High     |                             7 |       1 | `ACCEPTED — LOCAL HOMOLOGATION ONLY` |
| Moderate |                             3 |       3 | `ACCEPTED — LOCAL HOMOLOGATION ONLY` |
| Total    |                            10 |       4 | `TEMPORARY LOCAL ACCEPTANCE`         |

All four current findings are reported by pnpm as production dependency paths. No package was
upgraded in this blocker-resolution package.

## deepmerge-ts HIGH

- Advisory: [GHSA-ggr8-5vv4-36mx](https://github.com/advisories/GHSA-ggr8-5vv4-36mx)
  / CVE-2026-40345;
- severity: `HIGH`;
- dependency chain:
  `@dp-system/api -> @prisma/client@6.19.0 -> prisma@6.19.0 (peer) -> @prisma/config@6.19.0 -> deepmerge-ts@7.1.5`;
- installed: `7.1.5`;
- affected: `<8.0.0`;
- fixed: `>=8.0.0`;
- dependency type: transitive; pnpm reports a production path because `prisma` satisfies the
  `@prisma/client` peer while also being a direct API development dependency;
- introducing component: Prisma configuration loader.

### Reachability

`@prisma/config` dynamically imports `deepmerge-ts` inside its TypeScript/JavaScript configuration
loader. The repository has `apps/api/prisma.config.ts`, so this path runs when Prisma CLI commands
load configuration, including generate, validate, migrate and seed preparation. It is not imported
by `PrismaService`, controllers or application services.

A runtime probe that imported `@prisma/client` and instantiated `PrismaClient` loaded neither
`@prisma/config` nor `deepmerge-ts`. Repository search found no application import of either
package. The vulnerable condition requires two recursive object graphs at the same property path;
the checked-in Prisma config supplies an acyclic object literal and environment strings.

| Question                                  | Finding                                                                           |
| ----------------------------------------- | --------------------------------------------------------------------------------- |
| Executes in API runtime                   | `NO` based on import probe and source path review                                 |
| Executes during generate/validate/migrate | `YES`                                                                             |
| Receives HTTP request data                | `NO`                                                                              |
| Direct user-controlled recursive input    | `NO`                                                                              |
| HTTP endpoint reachability                | `NO`                                                                              |
| Plausible local exploitation              | Requires control over executable repository configuration or its dependency graph |

### Application exposure

- confidentiality: no plausible direct impact in the current DP-System path;
- integrity: no direct application or database mutation path from the vulnerable merge was found;
- availability: a crafted recursive configuration graph could exhaust the Prisma CLI process stack
  and block generate, validation, migration or setup;
- company isolation: no runtime path identified;
- authentication and authorization: no runtime path identified;
- audit: no runtime path identified;
- database: no direct query path; operational CLI availability can be affected before a command
  completes.

The advisory severity remains `HIGH`. The observed DP-System reachability is lower than the generic
advisory scenario, but this analysis does not downgrade the advisory.

## React Router MODERATE findings

### GHSA-wrjc-x8rr-h8h6 / CVE-2026-53669

- title: open redirect via backslash in `Link` and `useNavigate`;
- installed: `react-router@6.30.4` through direct production dependency
  `react-router-dom@6.30.4`;
- affected: `>=6.0.0 <7.18.0`;
- fixed: `>=7.18.0`;
- compatible patch/minor: `NO`; remediation crosses the 6-to-7 major boundary;
- reachability: `POTENTIAL`. Most destinations are fixed internal paths, but the authenticated
  redirect flow stores `location.pathname` and later passes it to `navigate(returnTo)`. An attacker
  can influence the initial browser pathname, so an application-level allowlist or the upstream
  major remediation requires separate review;
- impact: external navigation/phishing risk after an authentication/company-selection flow. No
  direct backend authorization or company-isolation bypass is implied.

### GHSA-jjmj-jmhj-qwj2 / CVE-2026-53668

- title: open redirect leading to XSS;
- installed: direct production dependency `react-router-dom@6.30.4`;
- affected: `>=6.30.2 <=6.30.4`;
- fixed: the audit reports `patched_versions: <0.0.0` and no recommendation;
- compatible patch/minor: `NO KNOWN FIX`;
- reachability: `POTENTIAL` for the same return-path data flow. Exploitability of the complete XSS
  chain was not demonstrated in this review and must not be represented as disproven;
- impact: open redirect and, under the advisory preconditions, client-side script execution.

### GHSA-337j-9hxr-rhxg / CVE-2026-53666

- title: arbitrary constructor injection during SSR error hydration;
- installed: `react-router@6.30.4` through `react-router-dom@6.30.4`;
- affected: `>=6.4.0 <7.18.0`;
- fixed: `>=7.18.0`;
- compatible patch/minor: `NO`;
- reachability: `NO` in the current architecture. DP-System is a Vite client application using
  `createBrowserRouter`; it has no React Router server rendering or manual SSR hydration path;
- impact: no current execution path found, while the advisory remains present in the dependency
  inventory.

## Option A — Upgrade

### Prisma ecosystem

The current Prisma and Prisma Client versions are `6.19.0`. Registry inspection shows that the
latest Prisma 6 patch (`6.19.3`) and Prisma 7.10.0 still depend on
`@prisma/config -> deepmerge-ts@7.1.5`. Therefore no released 6.x or 7.x package inspected removes
the finding. The current `prisma@8.0.0-rc.12` registry manifest no longer exposes the same
`@prisma/config` dependency chain, but it is a prerelease ground-up major rewrite, not a compatible
security patch.

A direct override to `deepmerge-ts@8` would also force a transitive major outside Prisma's declared
dependency and is not an approved supported fix.

Likely impact of a supported major migration includes:

- Prisma schema/client: generator output and imports must be reviewed; Prisma 7 already requires a
  driver adapter and revised client construction;
- migrations: no data-model migration is inherently required, but all 16 existing migrations and
  clean replay must be revalidated with the new CLI;
- Prisma Client/NestJS: `PrismaService`, scripts and all direct `PrismaClient` construction sites
  require adapter, lifecycle and generated-client compatibility review;
- module system: Prisma 7 requires ESM, affecting the current Nest build and package/TypeScript
  configuration;
- PostgreSQL: connection pooling, timeouts and SSL defaults differ with the driver adapter;
- scripts/CI: generate, validate, migrate, seed, demo reset/setup and smoke scripts require full
  regression;
- effort: `HIGH`, multi-day and suitable only for a dedicated upgrade branch with rollback.

Required evidence: frozen install, compile/typecheck, all API/frontend tests and coverage, clean
PostgreSQL 16 replay, seed, five smoke suites, concurrency/idempotency checks, dependency audit and
runtime health.

References:

- [Prisma ORM 7 upgrade guide](https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7);
- [Prisma 8 introduction](https://www.prisma.io/docs/orm/v8).

### React Router

The two advisories with published fixes require React Router 7.18.0 or later. This is a major
upgrade from `react-router-dom@6.30.4`. The third advisory has no patched version in the current
audit. A dedicated upgrade/mitigation branch must review routing semantics, return-path validation,
all protected routes, browser navigation, tests, build and every smoke suite.

## Option B — Temporary local homologation risk acceptance

A time-bounded exception can be technically considered for `LOCAL / HUMAN HOMOLOGATION` only,
because the high finding is confined to trusted Prisma CLI configuration and is not loaded by the
API runtime. It must never authorize production, cloud or external deployment.

Candidate compensating controls, subject to explicit Security approval:

- bind API and frontend only to the isolated local demonstration environment;
- admit only reviewed repository configuration and the frozen lockfile;
- do not ingest or execute untrusted Prisma config objects;
- run audit before each homologation window and stop on a changed dependency graph;
- keep automatic grants at zero and revoke temporary manual grants after the session;
- define a short expiration date and owner for the exception;
- require remediation before Gate D, production, cloud or external deployment;
- separately resolve or accept the React Router open-redirect exposure; the low reachability of
  `deepmerge-ts` does not cover those frontend advisories.

No risk is accepted by this document.

## Option C — Keep blocked

Keep the Release Candidate blocked until a supported Prisma dependency path and React Router
remediation are implemented and fully regressed. This avoids accepting known dependency risk but
delays the controlled human homologation and requires a separate major-upgrade effort before the
visual script can be treated as an RC gate.

## Security recommendation

Apply the supplied temporary acceptance only to controlled local human homologation, retain the
compensating controls above and keep remediation tracked. Reassess both the Prisma CLI finding and
the potentially reachable React Router return-path findings before any expanded scope. Production,
cloud, external deployment, public exposure, real data and Gate D remain blocked.

## Human decision

`APPROVED — TEMPORARY LOCAL HOMOLOGATION RISK ACCEPTANCE`

- scope: `LOCAL HOMOLOGATION ONLY`;
- decision date: 2026-09-09;
- approver: authorized human decision-maker; a personal name was not supplied in the acceptance
  instruction;
- evidence: explicit human approval supplied for this Release Candidate execution;
- expiration: this acceptance ends with the local homologation scope and must be reassessed before
  any scope expansion or material dependency-chain change.

### Mandatory boundaries

| Scope                    | Authorization                               |
| ------------------------ | ------------------------------------------- |
| Local human homologation | `AUTHORIZED WITH TEMPORARY RISK ACCEPTANCE` |
| Production               | `NOT AUTHORIZED`                            |
| Cloud                    | `NOT AUTHORIZED`                            |
| External deployment      | `NOT AUTHORIZED`                            |
| Public exposure          | `NOT AUTHORIZED`                            |
| Real data                | `NOT AUTHORIZED`                            |
| Gate D                   | `NOT AUTHORIZED`                            |
| ETP-015.10               | `NOT COMPLETE`                              |

The acceptance does not correct or downgrade the findings. The unresolved inventory remains:

- 1 high: `deepmerge-ts`, GHSA-ggr8-5vv4-36mx / CVE-2026-40345;
- 3 moderate: the React Router advisories documented above.

Confirmed technical reachability remains:

- `deepmerge-ts` API runtime reachable: `NO`;
- direct HTTP or user-controlled input into the vulnerable merge: `NO`;
- Prisma CLI/configuration-chain reachability: `YES`.

A new security evaluation is mandatory before Gate D, production, cloud, external deployment, a
Prisma upgrade or any material dependency-chain change.

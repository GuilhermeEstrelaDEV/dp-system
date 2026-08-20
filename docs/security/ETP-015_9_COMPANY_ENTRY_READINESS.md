# ETP-015.9 — Company Entry Readiness

**Status:** `ENTRY DECISIONS RECORDED — FUNCTIONAL IMPLEMENTATION DEFERRED`

**Result:** `COMPANY ENTRY — NOT AUTHORIZED`

**Functional state:** `FUNCTIONAL IMPLEMENTATION DEFERRED — NOT AUTHORIZED`

**Baseline:** `origin/develop@8e8ab402d9582b6e32af82039701804a7422c5b7`

## Binding boundaries

ED-01 through ED-06 remain binding. The human entry decision dated 2026-08-20 selected
`E — DEFER`. It does not resolve BDP-012, approve a capability, projection, audit event, owner,
rollout, Gate D, production, cloud, deployment, or legacy removal. The six handlers remain
`LEGACY_DEFERRED` and runtime remains unchanged.

## Readiness register

| ID    | Prerequisite                          | State                                        | Evidence and remaining decision                                                                                |
| ----- | ------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| CO-01 | BDP-012 resolution or delimitation    | `BLOCKED — BDP-012 PENDING / DEFER SELECTED` | BDP-012 remains `PENDING`; option `E — DEFER` blocks Company entry without resolving the BDP.                  |
| CO-02 | global versus active-company scope    | `APPROVED — DEFER ALL OPERATIONS`            | no global, active-company, or self-context semantics are granted to any of the six operations.                 |
| CO-03 | capability model                      | `APPROVED — NO CAPABILITY AUTHORIZATION`     | 19 capabilities remain unchanged; no semantic expansion, grant, or assignment is authorized.                   |
| CO-04 | data projection and sensitivity       | `APPROVED — NO PROJECTION AUTHORIZATION`     | the seven observed fields receive no rollout/exposure approval; no projection or masking change is authorized. |
| CO-05 | audit model                           | `APPROVED — AUDIT DESIGN DEFERRED`           | the catalog remains at 27 events; no Company event or inadequate semantic reuse is authorized.                 |
| CO-06 | accountable owner and approvers       | `BLOCKED — OWNERS PENDING`                   | accountable and engineering owners remain `PENDING HUMAN ASSIGNMENT`.                                          |
| CO-07 | consumer inventory                    | `READY — INVENTORY EVIDENCE ONLY`            | versioned consumers are inventoried and unversioned/external risk remains explicitly `UNKNOWN`.                |
| CO-08 | Definition of Ready and evidence gate | `BLOCKED — FUNCTIONAL ENTRY NOT AUTHORIZED`  | the evidence count remains 6 of 16; the defer decision does not convert any additional item to `PASS`.         |
| CO-09 | rollback boundary                     | `APPROVED — FUTURE ROLLBACK BOUNDARY ONLY`   | safe constraints are binding for a future decision, but no runtime rollout exists or is authorized now.        |

No `READY` item authorizes implementation. CO-07 means only that the present repository evidence was
inventoried.

## Authoritative six-handler inventory

All routes are under `/api/v1`; the table shows controller-relative paths. Current controller code
has only `@ApiTags('companies')`, without explicit response DTOs, bearer/capability declarations, or
operation-specific OpenAPI responses.

| Controller#method                | Verb / route                      | Input                                        | Current response                                 | Class  | Client authority / lookup                                   | Consumer and OpenAPI                            | Errors                       | Scope and exposure                                                                  | Audit |
| -------------------------------- | --------------------------------- | -------------------------------------------- | ------------------------------------------------ | ------ | ----------------------------------------------------------- | ----------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------- | ----- |
| `CompaniesController#list`       | `GET /companies`                  | `CompanyListQueryDto`                        | `{ items: Company[], pagination }`               | READ   | no `companyId`; global `findMany`/`count`, no company scope | web `ResourcePage`; tag-only OpenAPI            | validation 400 / generic 500 | returns all companies; global exposure and active-company semantics are undecided   | none  |
| `CompaniesController#find`       | `GET /companies/:id`              | path `id: string`                            | full `Company`                                   | READ   | client target ID; `findUnique({ id })`                      | no direct versioned UI caller; tag-only OpenAPI | 404 absent / generic 500     | direct lookup before any company scope; horizontal enumeration possible             | none  |
| `CompaniesController#create`     | `POST /companies`                 | `CreateCompanyDto`: legal/trade name, tax ID | created full `Company`                           | WRITE  | no active company; direct `company.create`                  | web create form; inferred DTO OpenAPI only      | 400 / 409 duplicate / 500    | necessarily creates outside an existing target context; global authority undecided  | none  |
| `CompaniesController#update`     | `PATCH /companies/:id`            | path ID + partial names/tax ID               | updated full `Company`                           | WRITE  | client target ID; unscoped find then update by ID           | web edit form; inferred DTO OpenAPI only        | 400 / 404 / 409 / 500        | can mutate any company; no active-company link or scoped write predicate            | none  |
| `CompaniesController#activate`   | `PATCH /companies/:id/activate`   | path `id: string`                            | full `Company`; idempotent when already active   | ACTION | client target ID; unscoped find then update by ID           | web status toggle; tag-only OpenAPI             | 404 / generic 500            | can activate any company, including one without prior assignment                    | none  |
| `CompaniesController#inactivate` | `PATCH /companies/:id/inactivate` | path `id: string`                            | full `Company`; idempotent when already inactive | ACTION | unscoped find; dependency counts; update by ID              | web status toggle; tag-only OpenAPI             | 404 / 409 dependencies / 500 | can inactivate any company; checks four active organizational dependency categories | none  |

### Current domain behavior

- `companyId` is not present in these DTOs. The path `id` is a client-selected target, never proven
  against an authenticated active-company context.
- List, detail, create, update, activation, and inactivation are globally reachable through the
  legacy-deferred bypass. There is no JWT, active-company, capability, or backend role-name rule.
- The frontend is authenticated and visually nested under `platform.manage`; this does not authorize
  the API and ED-02 prohibits treating `platform.manage` as an implicit super-capability.
- No post-filter exists. List is global SQL; detail and writes perform unscoped lookup/update.
- `CompanyListQueryDto` restricts explicit sorting to `legalName`, `tradeName`, or `createdAt`, but
  inherits the base default `sortBy = name`; this compatibility risk must be tested before approving
  the list contract and is not corrected here.
- Inactivation blocks when active Branch, Department, Position, or CostCenter rows exist. Tax ID is
  globally unique in the current schema. These are current CRUD invariants, not resolution of group
  hierarchy or fiscal uniqueness under BDP-012.
- `/auth/companies` and the active-company resolver are separate, already protected membership
  surfaces. Their semantics do not authorize the six administrative endpoints.

## CO-01 — BDP-012

BDP-012 is titled **“Definir organização raiz e regra definitiva de unicidade fiscal entre empresas
do mesmo grupo.”** It is `PENDING`, affects multi-company isolation/data evolution, and names
Administração and TI as validators. Its authoritative register contains no alternatives. It records
no approved root, group model, hierarchy, fiscal-uniqueness boundary, or global administrator.

Current `Company.taxId @unique` is database behavior, not proof of the future group rule. BDP-012 also
limits Organization because Branch/Department/Position/CostCenter links depend directly on Company
and no economic-group/root entity exists. A minimum scope can be proposed only by explicitly omitting
group semantics; it remains `CANDIDATE — HUMAN APPROVAL REQUIRED`.

The selected current option is `E — DEFER`. No root/group model, fiscal rule, sibling-company
authority, migration, backfill, or Company subset is approved. This is a decision to defer entry,
not a resolution of BDP-012.

**CO-01:** `BLOCKED — BDP-012 PENDING / DEFER SELECTED`.

## CO-02 — Scope per operation

| Operation  | Administers active company? | Any company / creates outside context? | Prior link question                   | Candidate states                                                         | Human decision |
| ---------- | --------------------------- | -------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------ | -------------- |
| list       | possible subset only        | currently any company                  | decide membership versus global scope | `GLOBAL ADMINISTRATION CANDIDATE`, `ACTIVE-COMPANY CANDIDATE`, `BLOCKED` | required       |
| find       | possible self-context       | currently any client-selected ID       | decide target membership/concealment  | `SELF-CONTEXT CANDIDATE`, `GLOBAL ADMINISTRATION CANDIDATE`, `BLOCKED`   | required       |
| create     | no existing target context  | necessarily creates a new company      | define bootstrap/global authority     | `GLOBAL ADMINISTRATION CANDIDATE`, `BLOCKED`                             | required       |
| update     | possible active-company     | currently any client-selected ID       | decide self versus global mutation    | `ACTIVE-COMPANY CANDIDATE`, `GLOBAL ADMINISTRATION CANDIDATE`, `BLOCKED` | required       |
| activate   | possible active-company     | currently changes any company          | define prior link and inactive target | `GLOBAL ADMINISTRATION CANDIDATE`, `ACTIVE-COMPANY CANDIDATE`, `BLOCKED` | required       |
| inactivate | possible active-company     | currently changes any company          | define self-lockout/global authority  | `GLOBAL ADMINISTRATION CANDIDATE`, `ACTIVE-COMPANY CANDIDATE`, `BLOCKED` | required       |

Every candidate needs JWT and an explicit context. No option may inherit `platform.manage` or trust
the target ID as authority. The human entry decision deferred all six operations without selecting
global, active-company, or self-context semantics. **CO-02:** `APPROVED — DEFER ALL OPERATIONS`.

## CO-03 — Capability model

| Option | Description                                                       | Benefits                             | Risks / escalation                                                        | Handlers                   | State                                    |
| ------ | ----------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------- | -------------------------- | ---------------------------------------- |
| A      | strictly bounded reuse of an existing capability                  | no catalog change                    | current `platform.*` and closure codes are not semantically adequate      | none proven                | `HUMAN DECISION REQUIRED`                |
| B      | separate catalog initiative for read/manage/critical-action codes | resource/action segregation possible | code naming, grants, global scope, and privilege creep require governance | all six, split by decision | `NEW CAPABILITY PROPOSAL — NOT APPROVED` |
| C      | keep operation unauthorized                                       | fail-closed; no privilege expansion  | functionality remains unavailable after enforcement                       | any unresolved operation   | `BLOCKED UNTIL ADDITIONAL DECISION`      |

Any illustrative `<company>.*` label is a `NON-BINDING CANDIDATE NAME`. No existing capability may
be broadened. The defer decision preserves the 19 existing capabilities with zero additions and
zero semantic expansion. **CO-03:** `APPROVED — NO CAPABILITY AUTHORIZATION`.

## CO-04 — Data projection

The service currently returns raw Prisma Company rows for all six operations.

| Field       | Technical category                  | Current state        | Minimum/omit candidate                                             | Decision state              |
| ----------- | ----------------------------------- | -------------------- | ------------------------------------------------------------------ | --------------------------- |
| `id`        | identifier / relationship key       | `CURRENTLY RETURNED` | minimum candidate for stable resource/selection references         | `PENDING MATERIAL DECISION` |
| `legalName` | legal identity / user-authored name | `CURRENTLY RETURNED` | minimum candidate for identified administrative contexts           | `PENDING MATERIAL DECISION` |
| `tradeName` | presentation / user-authored name   | `CURRENTLY RETURNED` | minimum or omit candidate by operation                             | `PENDING MATERIAL DECISION` |
| `taxId`     | registration/fiscal identifier      | `CURRENTLY RETURNED` | omit candidate outside specifically approved fiscal administration | `PENDING MATERIAL DECISION` |
| `status`    | lifecycle state                     | `CURRENTLY RETURNED` | minimum candidate                                                  | `PENDING MATERIAL DECISION` |
| `createdAt` | technical timestamp                 | `CURRENTLY RETURNED` | omit candidate for minimum list/detail                             | `PENDING MATERIAL DECISION` |
| `updatedAt` | technical timestamp                 | `CURRENTLY RETURNED` | omit candidate for minimum list/detail                             | `PENDING MATERIAL DECISION` |

There are no group references or arbitrary metadata in the current Company model. Relationships are
not embedded in the response. This is technical inventory, not final privacy/legal classification.
ED-03 prohibits expansion; reduction is only a proposal. No field receives rollout/exposure
authorization from the defer decision. **CO-04:** `APPROVED — NO PROJECTION AUTHORIZATION`.

## CO-05 — Audit model

The current 27-event catalog has authentication, access-grant, payroll-review, and payroll-period
events. None describes Company create/update/activate/inactivate without semantic distortion.

| Operation             | Existing adequate event | Candidate result                             | Required allowed metadata candidate              | Prohibited metadata                      | Atomicity / rollback  |
| --------------------- | ----------------------- | -------------------------------------------- | ------------------------------------------------ | ---------------------------------------- | --------------------- |
| list / find           | none                    | sensitive-read decision pending; no reuse    | actor/company target IDs only if later approved  | names, tax ID, query/body, full response | decide before rollout |
| create                | none                    | `NEW EVENT PROPOSAL REQUIRED — NOT APPROVED` | created ID, resulting status, reason if required | names, tax ID, request payload           | state + audit atomic  |
| update                | none                    | `NEW EVENT PROPOSAL REQUIRED — NOT APPROVED` | target ID, changed-field allowlist, reason       | old/new values, names, tax ID, raw body  | state + audit atomic  |
| activate / inactivate | none                    | `NEW EVENT PROPOSAL REQUIRED — NOT APPROVED` | target ID, prior/next status, reason             | company payload and dependency records   | state + audit atomic  |

No generic event is an adequate reuse candidate. Failure to persist an approved critical audit must
roll back the write. Catalog remains 27 and the Company audit design is deferred with the family.
**CO-05:** `APPROVED — AUDIT DESIGN DEFERRED`.

## CO-06 — Owner and approvers

- Accountable operational owner: `PENDING HUMAN ASSIGNMENT`.
- Engineering owner: `PENDING HUMAN ASSIGNMENT`.
- Minimum approvers: Engineering, Security, Product, accountable operational owner.
- DP is required if the selected scope changes employment/payroll company authority or functional
  data. Jurídico/DPO is required if tax identifiers, privacy, group sharing, or another unresolved
  legal/sensitive-data decision is material. Their participation cannot be waived by this assessment.

**CO-06:** `BLOCKED — OWNERS PENDING`.

## CO-07 — Consumers

The [consumer matrix](ETP-015_9_COMPANY_CONSUMER_MATRIX.md) records the versioned web client, tests,
documentation, direct-database demo tools, internal model references, and unknown external/OpenAPI
consumers. It does not claim zero external consumers. **CO-07:**
`READY — INVENTORY EVIDENCE ONLY`.

## CO-08 — Definition of Ready / evidence gate

- [ ] BDP-012 resolved or minimum scope formally delimited.
- [ ] global versus active-company approved per operation.
- [ ] capability model approved.
- [ ] projection approved.
- [ ] audit model approved.
- [ ] accountable owner assigned.
- [ ] approvers assigned.
- [x] versioned consumers inventoried.
- [x] external/unversioned consumer risk registered.
- [ ] company-isolation strategy approved.
- [x] `401`/`403`/`404` matrix defined in the test plan.
- [x] two-company test strategy defined.
- [x] OpenAPI reconciliation strategy defined.
- [x] telemetry/observability boundary defined without sensitive payloads.
- [ ] rollback approved.
- [ ] evidence gate approved.

**PASS:** 6. **PENDING/BLOCKED:** 10. Technical definition is not human approval, and the defer
decision does not mark any additional item as complete. **CO-08:**
`BLOCKED — FUNCTIONAL ENTRY NOT AUTHORIZED`.

## CO-09 — Rollback

The [rollout and rollback proposal](ETP-015_9_COMPANY_ROLLOUT_AND_ROLLBACK.md) preserves JWT,
deny-by-default, isolation, projection, and critical audit controls. Its safe boundary is approved
for future use only; no rollout is authorized. **CO-09:**
`APPROVED — FUTURE ROLLBACK BOUNDARY ONLY`.

## Final state

- Company: `ENTRY DECISIONS RECORDED — FUNCTIONAL IMPLEMENTATION DEFERRED`; `NOT AUTHORIZED`.
- BDP-012: `PENDING`; current option `E — DEFER`.
- six Company handlers: `LEGACY_DEFERRED`.
- ETP-015.9: `ENTRY DECISIONS RECORDED — FUNCTIONAL IMPLEMENTATION NOT AUTHORIZED`.
- Gate D: `NOT STARTED — NOT APPROVED`.
- ETP-015.10: `NOT STARTED — NOT AUTHORIZED`.
- production, cloud, deploy, and legacy removal: `NOT AUTHORIZED`.

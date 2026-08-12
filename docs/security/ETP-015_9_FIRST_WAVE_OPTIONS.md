# ETP-015.9 — First Wave Options

**Status:** `NON-BINDING TECHNICAL RANKING — HUMAN DECISION REQUIRED`

## Result

`NO FUNCTIONAL FAMILY CURRENTLY READY`

All functional options below remain `BLOCKED`. The order is a technical aid based on handler count,
material dependencies, sensitivity, mutation criticality, consumer/canonical overlap, capability
and audit gaps, isolation, rollback, frontend impact, and unknown external consumers. Ranking does
not authorize entry or convert a blocker into readiness.

## Option 1 — Company family (6 handlers)

**Status:** `BLOCKED`

**Why ranked first:** smallest P1 family, known `/empresas` consumer, and no PII-heavy employee
record. Complexity remains material because global versus enterprise administration is undecided.

**Benefits**

- small contract surface;
- exercises global/enterprise boundary before broader families;
- establishes a reusable family-level rollout and rollback template.

**Risks**

- accidental `platform.manage` bypass or cross-company administration;
- fiscal identifiers and BDP-012 group semantics;
- no exhaustive external-consumer evidence.

**Blocking decisions:** BDP-012; administrative scope; capability granularity/reuse; projection;
audit events; accountable owner.

**Required human approvals:** Security, Product, accountable operational owner; DP and Jurídico/DPO
when approved scope materially affects payroll/fiscal/privacy behavior.

**Definition of Ready**

- blockers formally resolved or excluded by an approved minimum scope;
- owner and approvers recorded;
- capability, data projection, audit, company scope, consumers, metrics, and rollback approved;
- family gate linked to tests and OpenAPI reconciliation.

**Definition of Done**

- all six handlers explicitly classified and protected;
- two-company `401/403/404` matrix passes;
- no client `companyId` authority, automatic grant, broad projection, or role-name authorization;
- critical writes and rollback proven; consumers and inventory reconciled.

## Option 2 — Payroll parameters and rubrics (8 handlers)

**Status:** `BLOCKED`

**Why ranked second:** bounded contracts and known frontend consumers, but configuration mutations
can affect payroll calculation and require strong segregation.

**Benefits**

- cohesive read/version/write surface;
- clear opportunity to separate view from critical configuration;
- no need to invent legal values when the policy-neutral boundary is preserved.

**Risks**

- privilege escalation into calculation configuration;
- unapproved JSON/metadata projection;
- missing write-event taxonomy and approval segregation;
- external consumers not evidenced.

**Blocking decisions:** capability model; parameter/rubric separation; audit events and metadata;
segregation; projection; owner; confirmation that legal content remains excluded.

**Required human approvals:** Security, Product, DP, accountable operational owner; Jurídico/DPO if
legal or sensitive content is introduced.

**Definition of Ready:** approved capability/projection/audit matrices, owner, segregation,
consumer inventory, rollback, and explicit exclusion of legal formulas/values.

**Definition of Done:** eight handlers isolated and deny-by-default; critical writes atomic with
audit; version history preserved; no automatic grant or legal policy expansion; frontend and
OpenAPI reconciled.

## Option 3 — P4 preservation/reconciliation only

**Status:** `PROPOSED — HUMAN CONFIRMATION REQUIRED`; not a functional rollout.

**Why ranked:** it can produce governance evidence without runtime change or material BDP
dependency, but it does not advance a legacy business family.

**Benefits**

- lowest runtime risk;
- reconciles 165 runtime versus 163 historical handlers transparently;
- confirms public allowlist and protected families remain unchanged.

**Risks**

- may be mistaken for Gate D progress or functional rollout;
- stale OpenAPI/documentation could remain if sources are not explicitly enumerated.

**Blocking decisions:** human confirmation of preservation-only scope; owners for reconciliation;
evidence sources and acceptance boundary.

**Required human approvals:** Security and Product; consult DP/Jurídico/DPO for classification drift.

**Definition of Ready:** ED-06 confirmed, zero-runtime diff gate defined, inventory sources named.

**Definition of Done:** documentation/runtime/OpenAPI inventory reconciled; no runtime, capability,
projection, audit, company, or route-removal change; no Gate D checkbox claimed without its evidence.

## Option 4 — Residual P0 governed sub-scope (15 handlers)

**Status:** `BLOCKED — WAVE ALLOCATION HUMAN DECISION REQUIRED`

**Why ranked fourth:** high-risk surfaces overlap payroll-period, input, and run behavior. The
canonical closure foundation is strong, but ED-01 and multiple material BDPs are unresolved.

**Benefits**

- addresses the highest residual security/domain overlap;
- can prevent parallel period/open/validate and closed-period mutation paths;
- leverages existing canonical closure evidence where semantics truly match.

**Risks**

- accidental broad reuse of narrow closure capabilities;
- parallel domain rules, payroll mutation, and sensitive totals/messages;
- complex consumer and rollback interactions;
- BDP-001/004/005/006/011 dependencies.

**Blocking decisions:** ED-01 for all 15 handlers; capabilities; projections; audit events;
canonical-overlap proof; BDP-dependent field/behavior limits; owner and evidence gate.

**Required human approvals:** Security, Product, DP, accountable operational owner, Jurídico/DPO
for sensitive-data scope.

**Definition of Ready:** every handler assigned a governed destination; all material decisions,
capabilities, projections, audit, isolation, consumers, tests, telemetry, and rollback approved.

**Definition of Done:** single canonical rule where applicable; all 15 handlers classified with
negative/two-company tests; idempotency/locks/immutability preserved; zero unapproved field or grant;
inventory and clients reconciled.

## Human selection constraint

No option may be selected for functional implementation until its Definition of Ready is evidenced
and a separate human entry authorization is recorded. ETP-015.9 remains `NOT STARTED — NOT
AUTHORIZED`.

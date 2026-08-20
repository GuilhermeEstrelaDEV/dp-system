# Full Functional Delivery Plan

## Decision and baseline

The human delivery decision supersedes the earlier permanent-defer assumption for user-facing
business families. Delivery remains incremental and fail-closed: a route leaves
`LEGACY_DEFERRED` only after authentication, an explicit capability, correct company semantics,
minimum projection, audit where required, frontend consumption and tests are available.

- baseline: `develop@75aa22c391bdf849a73a4076e6bb628ae4ad0913`;
- target: local/demonstrative complete functional delivery;
- production, cloud and external deployment remain unauthorized;
- automatic role assignments, role-name authorization, `platform.manage` as a super-capability and
  client-supplied company authority remain prohibited.

## Delivery waves

| Wave        | Families                                                         | Handlers | State                  |
| ----------- | ---------------------------------------------------------------- | -------: | ---------------------- |
| P1          | Company, Employee, Contract, Payroll Parameters, Payroll Rubrics |       33 | Implemented in this PR |
| P2          | Organization, Admission, Leave, Variable Compensation            |       56 | Not started            |
| P3          | Time, Benefit, Vacation                                          |       21 | Not started            |
| P0-RESIDUAL | legacy Payroll Period, Payroll Input and Payroll Run             |       15 | Not started            |

P1 uses independent `Company` entities. It does not create an economic-group model, sibling-company
authority or a legal resolution for BDP-012.

## Invariants for every wave

1. Inventory handlers from runtime metadata before changing classification.
2. Introduce the smallest resource capability model, normally `read` and `manage`.
3. Resolve company authority from the authenticated principal; use a company predicate in lookups.
4. Return `404` for a resource outside the active company and `403` for a missing capability.
5. Select an explicit minimum projection; never return an unrestricted Prisma record.
6. Record critical writes in `AuditLog` in the same transaction with deny-by-default metadata.
7. Keep the canonical seed free of grants; demonstration access is manual, expirable and revocable.
8. Prove API, frontend, negative authorization, isolation and regression behavior before declaring a
   wave ready.

## P1 outcome

P1 migrates exactly 33 handlers to ten resource capabilities and adds fourteen produced audit event
types. No migration is required: all functional requirements fit the current schema. The canonical
seed expands only the capability catalog; it creates zero `RolePermission` assignments. The local
demo command grants the sixteen approved demo capabilities only to the fictitious administrator,
with `MANUAL` provenance and a maximum eight-hour window.

Detailed evidence and known limitations are in [P1_ACCEPTANCE.md](P1_ACCEPTANCE.md).

## Exit and continuation

P1 acceptance does not declare the system complete. P2, P3 and P0-RESIDUAL require separate
branches, inventories, capabilities, projections, audit decisions, tests and human review. No later
wave is initiated by this delivery.

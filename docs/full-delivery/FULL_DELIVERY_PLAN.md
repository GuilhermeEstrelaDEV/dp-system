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

| Wave        | Families                                                         | Handlers | State          |
| ----------- | ---------------------------------------------------------------- | -------: | -------------- |
| P1          | Company, Employee, Contract, Payroll Parameters, Payroll Rubrics |       33 | Implemented    |
| P2          | Organization, Admission, Leave, Variable Compensation            |       56 | Implemented    |
| P3          | Time, Benefit, Vacation                                          |       21 | Ready to merge |
| P0-RESIDUAL | legacy Payroll Period, Payroll Input and Payroll Run             |       15 | Not started    |

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

## P2 outcome

P2 migrates exactly 56 handlers to eight family-level read/manage capabilities and adds nineteen
produced audit event types. The implementation reuses the existing schema and therefore creates no
migration. Organization is limited to the current company-local structure; Admission and Leave keep
unnecessary sensitive fields omitted; Variable Compensation only operates the records already
modeled and adds no calculation or legal rule.

The canonical seed remains assignment-free. The manual demo access mechanism is extended only for
the fictitious administrator and remains expirable, revocable and audited. P2 frontend tables reuse
the shared PR #94 standard. Detailed evidence is in [P2_ACCEPTANCE.md](P2_ACCEPTANCE.md).

## P3 outcome

P3 migrates exactly 21 handlers to six family-level read/manage capabilities and adds fourteen
produced audit event types. Time, Benefit and Vacation derive authority from the authenticated
principal's active company, use explicit projections and return `404` for foreign-company resources.
All critical writes persist the domain mutation and restricted audit evidence in the same
transaction.

No migration is required. The canonical seed remains assignment-free; the local demonstration
command grants the 30 approved demo capabilities only to the fictitious administrator with
`MANUAL` provenance and an eight-hour maximum. The functional frontend reuses the shared PR #94
table standard. Detailed evidence is in [P3_ACCEPTANCE.md](P3_ACCEPTANCE.md).

## Exit and continuation

P3 acceptance does not declare the system complete. P0-RESIDUAL retains fifteen legacy payroll
handlers and requires a separate branch, inventory, capability, projection, audit decision, tests
and human review. No later wave is initiated by this delivery.

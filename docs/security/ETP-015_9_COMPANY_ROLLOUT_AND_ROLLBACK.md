# ETP-015.9 — Company Rollout and Rollback Proposal

**Status:** `PROPOSAL — HUMAN APPROVAL REQUIRED`

## Future rollout boundary

A future rollout must be family-level but may enable only the operations explicitly authorized by
CD-01 through CD-09. It must preserve contract compatibility through a documented adapter/version
strategy, deny-by-default, JWT, explicit context, SQL scope before lookup, approved projection,
atomic audit for critical writes, no role-name fallback, and no broad `platform.manage` fallback.

Suggested controlled order after authorization:

1. freeze inventory, consumers, OpenAPI, metrics, and approved operation matrix;
2. add negative/two-company tests before changing classification;
3. introduce the approved scoped application boundary without changing public contract;
4. activate one approved read subset before writes only if the human decision permits it;
5. activate writes/actions separately with transaction/audit evidence;
6. observe aggregated route/result/latency metrics without payload, names, tax ID, token, or query;
7. reconcile consumers and OpenAPI; do not remove aliases/routes in this initiative.

## Compatibility expectations

- known web and shared types require an explicit projection compatibility decision;
- unknown external callers remain a residual risk and require communication/telemetry evidence;
- status idempotency and the active-dependency inactivation rule cannot silently change;
- a minimum scope must not imply group, Organization, or fiscal policy.

## Rollback boundary

Rollback may disable a newly approved Company adapter/classification or restore the prior compatible
envelope while keeping security controls. It must never restore anonymous access, remove JWT or
company isolation, trust client-supplied target IDs/company IDs as authority, add role-name or
`platform.manage` fallback, expand projection, discard critical audit, create grants, or weaken
deny-by-default.

If an approved write has produced state/audit records, rollback must preserve history and use an
explicit compensating/compatibility procedure; it must not delete audit evidence.

## Stop conditions

- any cross-company visibility or mutation outside the approved scope;
- `401`/`403`/`404` semantic regression or resource enumeration;
- capability/assignment not in the approved decision record;
- projection includes an omitted field or tax identifier outside the approved operation;
- critical state changes without atomic audit, actor, target, company/context, and trace evidence;
- consumer failure above the approved threshold or unknown high-impact consumer detected;
- OpenAPI differs from effective security/projection;
- telemetry contains PII, tax ID, payload, token, or free text;
- database lock/error/latency exceeds the approved gate;
- BDP-012 or owner/approver evidence becomes contradictory or absent.

Rollback and stop authority remain `PENDING HUMAN DECISION`.

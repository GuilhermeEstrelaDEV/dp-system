# Active Company Context

## Status

ETP-015.2 — `IN PROGRESS`.

## Contract

The opt-in active-company context is immutable and contains only `userId`, `companyId`, active
assignment identifiers, `selectionSource`, and `resolvedAt`. It contains no role, capability,
permission, company payload, or authorization decision.

## Sources and precedence

The existing surfaces are mapped as follows:

1. `AUTH_CONTEXT_BODY`: the explicit `/auth/context` selection command establishes the company for
   the next token. It is validated independently so that an authenticated user can switch company.
2. `SESSION_TOKEN`: `activeCompanyId` in a validated JWT is a persisted preference candidate. It is
   never trusted as authority and must be passed explicitly to the resolver by a future opt-in
   consumer before becoming a context.

When sources are evaluated together, equal values use the order above and different values fail
with `COMPANY_SELECTION_CONFLICT`. Missing, empty, non-string, and non-UUID values fail before
persistence access. Legacy `companyId` path, query, and DTO fields are not silently promoted to
active-company context.

## Resolution invariants

The resolver requires an authenticated principal and queries only current `UserCompanyRole`
assignments for that user/company whose status is `ACTIVE`, validity window includes the resolution
instant, and company status is `ACTIVE`. Missing, inactive, expired, unlinked, or spoofed selections
return the same 403 contract. The resolver is stateless and creates a fresh deeply frozen context,
preventing request-to-request and concurrent-request leakage.

The current schema has no dedicated assignment revocation timestamp or soft-delete marker. This
delivery therefore uses the approved status and validity fields and records dedicated revocation,
provenance, and temporal uniqueness as follow-ups rather than inventing semantics.

## HTTP integration and compatibility

Integration remains opt-in. The existing `/auth/context` command is the only production consumer in
this delivery; the resolver also exposes `SESSION_TOKEN` for explicitly migrated consumers without
changing `JwtAuthGuard`. Public, legacy, and protected routes do not acquire a new global company
requirement. No capability evaluation, resource authorization, endpoint migration, DTO change,
schema change, or frontend change belongs to this delivery.

Stable errors are: 401 for absent identity, 400 for malformed/missing/conflicting selection, and 403
when the identity cannot select the company. A 404 remains reserved for later resource lookup under
an already established company context.

## Follow-ups

- ETP-015.3 owns capability catalog and assignments.
- Endpoint-family migration owns resource isolation and 404 semantics.
- A future approved data-model change may add explicit revocation/provenance and temporal uniqueness.
- Multiple active assignments are returned in deterministic identifier order; a future approved
  policy may replace this projection if a single canonical membership identifier becomes necessary.
- Session hardening remains tracked separately (issuer/audience, refresh, backend logout, global
  revocation, cleanup, and technical identities).

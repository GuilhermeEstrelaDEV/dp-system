# ETP-015.6 — Cache Policy Decision Matrix

**Status:** `APPROVED`

**Approver:** `PROJECT_OWNER`

**Decision date:** `2026-08-08`

**Runtime/cache changes in this branch:** none

## Homologated decisions

| Decision | FC range       | Policy        | Storage                                                                                      | Required key/scope                                                                  | Required invalidation                                                                                        | FULL cache | Approver      | Date       |
| -------- | -------------- | ------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------- | ------------- | ---------- |
| CP-01    | FC-001..FC-015 | CACHE MINIMAL | `sessionStorage` only; never `localStorage`                                                  | current actor/session and selected company                                          | logout removes session; company switch replaces context and clears queries; revocation must prevent reuse    | PROHIBITED | PROJECT_OWNER | 2026-08-08 |
| CP-02    | FC-016..FC-018 | CACHE MINIMAL | current `sessionStorage` session only                                                        | current actor/session membership set                                                | replace after material membership/context change; clear on logout                                            | PROHIBITED | PROJECT_OWNER | 2026-08-08 |
| CP-03    | FC-020..FC-035 | NO CACHE      | none                                                                                         | not applicable                                                                      | no client copy may survive expiry or revocation                                                              | PROHIBITED | PROJECT_OWNER | 2026-08-08 |
| CP-04    | FC-036..FC-052 | CACHE MINIMAL | React Query memory only                                                                      | companyId + actorId + resource + `profile=MINIMAL`                                  | company switch, logout and material authorization change                                                     | PROHIBITED | PROJECT_OWNER | 2026-08-08 |
| CP-05    | FC-053..FC-080 | CACHE MINIMAL | React Query memory only                                                                      | companyId + actorId + resource + `profile=MINIMAL`                                  | company switch, logout, material authorization change and relevant mutations                                 | PROHIBITED | PROJECT_OWNER | 2026-08-08 |
| CP-06    | FC-081..FC-110 | MIXED         | readiness/token: transient memory only; history/version/manifest MINIMAL: React Query memory | companyId + actorId + payrollPeriodId + version when applicable + `profile=MINIMAL` | company switch, logout, authorization change, close and reopen invalidate related readiness/history/manifest | PROHIBITED | PROJECT_OWNER | 2026-08-08 |

## Mandatory field limits

### CP-01 and CP-02

- FC-005, FC-007..FC-012 and FC-015 must never be stored in the public session contract.
- The access token remains limited to the existing authenticated session contract and is never written to logs or audit metadata.
- Available companies may remain only for the current session and must remain membership-filtered.

### CP-03

- No grant-list payload is cached by the client.
- A future cache requires a new human gate and must prove immediate expiry/revocation invalidation.

### CP-04

- FC-052 never enters cache while blocked.
- Static/system-controlled FC-043 may be cached only in the MINIMAL profile.
- No payload is persisted in `sessionStorage` or `localStorage`.

### CP-05

- Only the homologated MINIMAL projection may enter memory.
- Cache identity must not rely solely on run/review IDs; company, actor and profile are mandatory.
- No FULL profile may reuse a MINIMAL cache entry.

### CP-06

- Readiness must be revalidated before critical close/reopen execution.
- `consistencyToken` is retained only for the lifetime needed by the active operation and is not persistently cached.
- Close/reopen invalidates readiness, history, version, event and manifest entries for the affected period.

No runtime cache is altered by this document.

## Implementation evidence

CP-01..CP-06 are now applied by session sanitization, scoped React Query keys and scope-wide
invalidation after mutations. No response cache is introduced for access grants, and consistency
tokens remain in memory only.

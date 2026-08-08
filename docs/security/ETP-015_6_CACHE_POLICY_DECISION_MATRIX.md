# ETP-015.6 — Cache Policy Decision Matrix

**Status:** `PENDING HUMAN DECISION`

**Runtime/cache changes:** none

## Current evidence

- Authentication persists the token and principal/company summaries in `sessionStorage` key `dp-system.session.v1`.
- Company selection and logout call `queryClient.clear()`, which is the current cross-company cleanup mechanism.
- Dashboard uses `['dashboard-summary', activeCompanyId]`.
- Payroll review uses resource keys such as `['review-cycles', runId]`, `['review-cycle', reviewId]` and `['review-history', reviewId]`; company is not embedded in those keys.
- Payroll-period history uses resource/version keys such as `['period-history', payrollPeriodId]`, `['period-readiness', payrollPeriodId]`, `['period-history-version', payrollPeriodId, version]`, `['period-history-events', payrollPeriodId, version]` and `['period-manifest', payrollPeriodId, version]`; company is not embedded in those keys.
- No dedicated policy for profile (minimal/masked/full), TTL, revocation invalidation or grant expiry was found.

These facts are implementation evidence, not approved cache policy.

## Family matrix

| Decision | FC range       | Flow                 | Existing cache                       | Key / scope                                 | User                | Session               | Profile     | TTL                                  | Current invalidators                        | Company switch                               | Logout             | Revocation / grant expiry                                        | Human options                                                            | Risk                                                                       | Human decision |
| -------- | -------------- | -------------------- | ------------------------------------ | ------------------------------------------- | ------------------- | --------------------- | ----------- | ------------------------------------ | ------------------------------------------- | -------------------------------------------- | ------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------- | -------------- |
| CP-01    | FC-001..FC-015 | identity context     | `sessionStorage`                     | `dp-system.session.v1`; browser tab         | implicit in payload | current token/session | not encoded | browser-tab lifetime                 | login/context writes; local logout removes  | replaces session and clears QueryClient      | removes and clears | no proactive invalidation evidenced                              | NO CACHE; CACHE MINIMAL; CACHE MASKED; CACHE FULL; FULL CACHE PROHIBITED | token/identity exposure and stale authorization                            | PENDING        |
| CP-02    | FC-016..FC-018 | selectable companies | `sessionStorage` within auth session | same key; browser tab                       | implicit            | current token/session | not encoded | browser-tab lifetime                 | auth flow writes                            | replaces and clears QueryClient              | removes and clears | no proactive invalidation evidenced                              | same five options                                                        | stale membership/company visibility                                        | PENDING        |
| CP-03    | FC-020..FC-035 | grants/assignments   | no canonical web cache found         | none evidenced                              | undecided           | undecided             | absent      | absent                               | absent                                      | global clear would apply if QueryClient used | global clear       | critical: expiry/revocation must invalidate any future FULL copy | same five options                                                        | stale grant can preserve excess visibility                                 | PENDING        |
| CP-04    | FC-036..FC-052 | dashboard            | React Query                          | company included                            | principal implicit  | token implicit        | not encoded | library default; no policy evidenced | refetch/invalidation lifecycle              | global clear plus new company key            | global clear       | no targeted capability/grant invalidation                        | same five options                                                        | aggregates/activity may survive authorization changes until invalidated    | PENDING        |
| CP-05    | FC-053..FC-080 | payroll review       | React Query                          | run/review resource IDs; company absent     | principal implicit  | token implicit        | not encoded | library default; no policy evidenced | workflow mutations invalidate cycle/history | global clear is relied upon                  | global clear       | no targeted grant expiry/revocation invalidation                 | same five options                                                        | resource-only keys and stale FULL profile could cross authorization epochs | PENDING        |
| CP-06    | FC-081..FC-110 | payroll periods      | React Query                          | period/version resource IDs; company absent | principal implicit  | token implicit        | not encoded | library default; no policy evidenced | close/reopen invalidate history/readiness   | global clear is relied upon                  | global clear       | no targeted grant expiry/revocation invalidation                 | same five options                                                        | history/manifest data may remain after access changes                      | PENDING        |

## Decisions required before caching masked or FULL data

For each CP item, homologate whether caching is allowed, the exact projection profile in the key, company/actor/session components, TTL, garbage-collection duration, invalidators, behavior on company switch/logout, immediate response to user/session revocation, substitution/emergency expiry and whether persistent browser storage is prohibited.

Any `CACHE FULL` alternative that depends on a capability or temporary grant has a stale-authorization risk. The conservative proposal is `FULL CACHE PROHIBITED` until all invalidators are proven, but this is `PROPOSAL ONLY — REQUIRES HUMAN APPROVAL`.

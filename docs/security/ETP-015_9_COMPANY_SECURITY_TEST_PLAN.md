# ETP-015.9 — Company Security Test Plan

**Status:** `PLAN READY — NO RUNTIME TEST IMPLEMENTATION`

## Required matrix

| Area                      | Scenario                                                                           | Expected future evidence                                                                |
| ------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 401                       | no token; malformed/invalid/expired token                                          | no service/Prisma call, no state effect, stable authenticated error                     |
| 403                       | missing capability; inactive/expired/revoked assignment; forbidden global action   | deny-by-default with no lookup/state effect; no role-name or `platform.manage` fallback |
| 404                       | nonexistent ID; other-company resource when approved semantics require concealment | indistinguishable response, scope included in first query, no enumeration               |
| two companies             | actor linked to A attempts read/write/action against B                             | no B data or mutation; target ID never grants authority                                 |
| horizontal escalation     | Company-scoped actor changes sibling Company                                       | denied before lookup/update                                                             |
| vertical escalation       | enterprise actor attempts global list/create/status                                | denied without separately approved global authority                                     |
| spoofing                  | path ID, query/body/header company selectors conflict with active context          | selector cannot become authority; deny with approved 400/403/404 semantics              |
| role-name bypass          | privileged-looking role name without capability                                    | 403; role names never authorize                                                         |
| broad capability fallback | only `platform.manage`/`platform.read` present                                     | 403 unless a later decision explicitly and narrowly approves reuse                      |
| projection attack         | request/filter attempts unapproved tax ID/timestamps/relationships                 | only approved allowlist returned; no expansion via error/log/cache                      |
| stale company             | inactive Company or inactive/expired membership                                    | deny under approved semantics; no stale cache leakage                                   |
| lifecycle                 | activate/inactivate idempotency and active-dependency conflicts                    | approved 404/409 behavior and no partial update                                         |
| transaction/audit         | audit persistence fails during create/update/status                                | full rollback; no state without critical audit                                          |
| consumer regression       | web list/detail/create/edit/status against approved adapter                        | versioned contract passes; unknown risk recorded and monitored                          |
| OpenAPI                   | generated operation security, responses, DTO/projection                            | exactly matches effective JWT/context/capability and fields                             |

## Test layers

- unit: scope/capability decision ports, projection allowlist, audit metadata sanitizer;
- integration: controller/guard/service with negative matrix and zero Prisma call on denial;
- PostgreSQL: two-company predicates, write atomicity, uniqueness/conflict, dependency counts;
- frontend: `401` logout behavior, `403`, `404`, approved controls/projection and cache isolation;
- contract/OpenAPI: all six operations and any compatibility adapter;
- telemetry: only aggregate route/result/latency, never payload or identifying fields.

No test in this plan authorizes the implementation it describes.

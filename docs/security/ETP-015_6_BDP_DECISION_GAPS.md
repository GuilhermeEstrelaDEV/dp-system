# ETP-015.6 — BDP Decision Gap Reconciliation

**Status:** `RECONCILED FOR APPROVED MINIMAL IMPLEMENTATION`

**Approver:** `PROJECT_OWNER`

**Decision date:** `2026-08-08`

**BDP-001:** `PENDING`

**BDP-011:** `PENDING`

The field homologation does not resolve either BDP globally. It only determines whether each dependency is needed to produce the approved MINIMAL contracts.

## BDP-001 reconciliation

| Decision / field                                           | MINIMAL outcome                                    | Reconciliation classification           | Residual dependency                              |
| ---------------------------------------------------------- | -------------------------------------------------- | --------------------------------------- | ------------------------------------------------ |
| FC-061 `payrollCalculationItemId`                          | OMIT                                               | RESOLVED BY OMIT DECISION               | future exposure remains STILL BLOCKED BY BDP-001 |
| FC-061 `employmentContractId`                              | OMIT                                               | RESOLVED BY OMIT DECISION               | future exposure remains STILL BLOCKED BY BDP-001 |
| FC-106 `employees[]`                                       | OMIT                                               | RESOLVED BY OMIT DECISION               | future exposure remains STILL BLOCKED BY BDP-001 |
| Future CPF, birth date, address, bank and dependant fields | absent from the approved 33-endpoint MINIMAL scope | OUT OF APPROVED IMPLEMENTATION SCOPE    | STILL BLOCKED BY BDP-001                         |
| FC-106 `payrollRunId` and `reviewCycleId`                  | structural references only                         | RESOLVED BY MINIMAL STRUCTURAL DECISION | no person expansion is authorized                |

BDP-001 therefore does not block implementation of the approved MINIMAL projections. It remains a mandatory gate for any future source resolution, person-reference expansion or new personal-data field.

## BDP-011 reconciliation

| Decision / field                                                 | MINIMAL outcome                                                                   | Reconciliation classification           | Residual dependency                                                                            |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------- |
| FC-030, FC-033 grant reasons                                     | OMIT                                                                              | RESOLVED BY OMIT DECISION               | future exposure remains STILL BLOCKED BY BDP-011                                               |
| FC-052 activity description                                      | OMIT                                                                              | RESOLVED BY OMIT DECISION               | future content exposure remains STILL BLOCKED BY BDP-011                                       |
| FC-064, FC-067 finding text/reason                               | OMIT                                                                              | RESOLVED BY OMIT DECISION               | future exposure remains STILL BLOCKED BY BDP-011                                               |
| FC-071, FC-073, FC-074 actor/text/metadata                       | OMIT as recorded in each mixed decision                                           | RESOLVED BY OMIT DECISION               | future exposure remains STILL BLOCKED BY BDP-011                                               |
| FC-077, FC-079 decision/invalidation actor and reason            | OMIT as recorded                                                                  | RESOLVED BY OMIT DECISION               | future exposure remains STILL BLOCKED BY BDP-011                                               |
| FC-088, FC-089, FC-091, FC-092 messages, entity IDs and metadata | OMIT as recorded                                                                  | RESOLVED BY OMIT DECISION               | future exposure remains STILL BLOCKED BY BDP-011                                               |
| FC-098, FC-101, FC-102 actors/reasons/trace                      | OMIT as recorded                                                                  | RESOLVED BY OMIT DECISION               | future exposure remains STILL BLOCKED BY BDP-011                                               |
| FC-103, FC-104 manifest content                                  | structural/aggregate allowlist only                                               | RESOLVED BY MINIMAL STRUCTURAL DECISION | free text, actors and metadata remain STILL BLOCKED BY BDP-011                                 |
| FC-105 financial totals                                          | OMIT                                                                              | OUT OF APPROVED IMPLEMENTATION SCOPE    | future financial/privacy decision required; BDP-011 remains applicable                         |
| FC-109 reason and actor                                          | OMIT                                                                              | RESOLVED BY OMIT DECISION               | future exposure remains STILL BLOCKED BY BDP-011                                               |
| CP-01..CP-06                                                     | minimal/no-cache policies approved; FULL cache prohibited                         | RESOLVED BY MINIMAL STRUCTURAL DECISION | final retention/export/disposal remains STILL BLOCKED BY BDP-011                               |
| AR-03                                                            | semantics and minimal metadata approved; existing append-only preservation reused | RESOLVED BY MINIMAL STRUCTURAL DECISION | automated retention, disposal, export or richer event content remains STILL BLOCKED BY BDP-011 |
| AR-01/02/04..10                                                  | not activated for MINIMAL                                                         | OUT OF APPROVED IMPLEMENTATION SCOPE    | any future activation requires the applicable privacy/retention gate                           |

BDP-011 does not block the approved MINIMAL implementation because every unresolved content category is omitted or outside scope. AR-03 can be emitted through the existing ETP-015.7 append-only writer without introducing a retention, disposal or export policy. This conclusion does not approve a retention period.

## Residual material blockers

There is no residual material decision required to produce the five approved MINIMAL contracts. Residual BDP dependencies apply only to future exposure, FULL/cache expansion, masking, retention, disposal, export or fields explicitly marked blocked.

## Guardrails

- An approved OMIT/BLOCKED decision is an implementation requirement, not an authorization for later exposure.
- No generic taxonomy, mask, legal basis or retention rule is inferred.
- Any future change to a blocked subfield requires a new human decision and the applicable BDP evidence.
- BDP-001 and BDP-011 remain pending in [Business Decisions Pending](../project-management/BUSINESS_DECISIONS_PENDING.md).

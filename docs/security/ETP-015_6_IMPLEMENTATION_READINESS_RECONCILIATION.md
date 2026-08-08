# ETP-015.6 — Implementation Readiness Reconciliation

**Result:** `HUMAN DECISIONS APPROVED — READY FOR APPROVED MINIMAL IMPLEMENTATION`

**Assessment date:** `2026-08-08`

**Decision source:** [Human approval record](ETP-015_6_HUMAN_APPROVAL_RECORD.md)

**ETP-015.8:** `NOT STARTED`

## Readiness criterion

A family is ready only when runtime can produce exactly its approved MINIMAL contract without inferring classification, masking, capability, audit, cache or BDP policy. A future-exposure question is not a blocker when the approved contract explicitly omits that field.

## Family reconciliation

| Family               | FCs            | Approved projection / omissions                                                                                      | Capability                                                            | Audit                                                  | Cache                  | BDP-001                                                           | BDP-011                                                                                                              | Runtime readiness                         |
| -------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------ | ---------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| AUTH / CONTEXT       | FC-001..FC-019 | own-principal identity, permissions and membership companies; session/trace/network/grant/role details omitted       | authentication/membership; no artificial FULL capability              | AR-01/02 not activated; existing auth events           | CP-01/02 CACHE MINIMAL | not needed for approved fields                                    | technical/content fields omitted; future policy pending                                                              | READY FOR APPROVED MINIMAL IMPLEMENTATION |
| GRANTS / ASSIGNMENTS | FC-020..FC-035 | explicit administrative DTO; tenant/provenance/reasons/general timestamps omitted                                    | matching `delegation.manage` or `emergency_access.manage` only        | AR-03 semantics approved; existing writes preserved    | CP-03 NO CACHE         | not needed                                                        | final retention remains pending, but existing append-only preservation supports AR-03 without new retention behavior | READY FOR APPROVED MINIMAL IMPLEMENTATION |
| DASHBOARD            | FC-036..FC-052 | controlled aggregates/presentation; FC-052 omitted; FC-043 static-only                                               | `platform.read` for MINIMAL only                                      | AR-04 not activated                                    | CP-04 CACHE MINIMAL    | not needed                                                        | dynamic/free content excluded                                                                                        | READY FOR APPROVED MINIMAL IMPLEMENTATION |
| PAYROLL REVIEW       | FC-053..FC-080 | structural workflow/history; personal refs, actors, reasons, text, metadata and traces omitted                       | `payroll.review.view` for reads; action capabilities for own response | AR-05..07 not activated; write events preserved        | CP-05 CACHE MINIMAL    | FC-061 personal references omitted; future exposure still blocked | all unresolved content omitted; future exposure still blocked                                                        | READY FOR APPROVED MINIMAL IMPLEMENTATION |
| PAYROLL PERIODS      | FC-081..FC-110 | structural readiness/history/manifest/action responses; messages, actors, metadata, totals and person arrays omitted | matching view/readiness/history/action capability                     | AR-08..10 not activated; close/reopen events preserved | CP-06 MIXED MINIMAL    | FC-106 employees omitted; future exposure still blocked           | free text/actors/metadata/totals omitted; future policy still blocked                                                | READY FOR APPROVED MINIMAL IMPLEMENTATION |

## AR-03 and BDP-011 determination

AR-03 is ready to be added during the approved MINIMAL implementation. The repository already has the ETP-015.7 append-only `AuditLog`, closed event catalog, allowlisted metadata and single writer. Implementing one new approved event through those mechanisms does not require selecting a retention period, deletion policy or export behavior. No such behavior may be introduced.

BDP-011 remains mandatory before automated retention/disposal/export or richer sensitive-read content. If implementation cannot preserve the approved AR-03 envelope/metadata exactly with the existing writer, it must fail closed and return to a technical review; it must not broaden metadata.

## Residual dependencies

There are no residual material decisions required for the approved MINIMAL implementation. The residual items are future-scope blockers:

- BDP-001: official source and exposure of personal data/person references;
- BDP-011: content exposure, final retention, disposal, export and FULL cache;
- future masking rules;
- future FULL profile/capability semantics;
- activation of AR-01/02/04..10;
- financial totals and expanded manifest/reference content.

## Authorized next increment

The next authorized increment is the functional implementation of ETP-015.6 strictly against the homologated MINIMAL matrix. This documentary branch does not start that implementation. ETP-015.8 remains `NOT STARTED` until ETP-015.6 runtime is implemented and accepted.

## Global gate

All five families are `READY FOR APPROVED MINIMAL IMPLEMENTATION`; zero families are blocked for the approved profile.

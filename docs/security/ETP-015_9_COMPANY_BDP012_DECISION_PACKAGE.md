# ETP-015.9 — Company BDP-012 Decision Package

**Status:** `BDP-012 PENDING — HUMAN DECISION REQUIRED`

## Authoritative record

**Title:** “Definir organização raiz e regra definitiva de unicidade fiscal entre empresas do mesmo
grupo.”

**State:** `PENDING`. **Business problem:** the repository does not define the root organization,
economic-group hierarchy, or final fiscal-uniqueness boundary. **Recorded validators:** Administração
and TI. **Impact:** multi-company isolation and data evolution; Organization is affected because its
hierarchy is rooted directly in Company today.

The current schema has independent Company rows and a globally unique `taxId`, with no group/root
entity or grouping reference. This is evidence of current behavior, not an approved BDP alternative.

## Non-binding alternatives

| Alternative                                    | Description                                                                                                           | Impact and risk                                                                    | Active-company compatibility                                            | Global administration compatibility                                       | Organization effect                                 | Isolation                                                        | Data change                                                | Rollback                                               | Human decision                        |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------- |
| A — preserve independent legal entities        | retain Company as root and current global tax-ID uniqueness; explicitly exclude group semantics                       | lowest immediate change; may not satisfy future economic-group policy              | direct assignment to one Company remains compatible                     | global create/list/status authority still needs approval                  | current direct company links retained               | company boundary stays independent                               | none if policy only; future constraints may differ         | preserve current schema/runtime                        | required                              |
| B — explicit organizational group/root         | introduce approved root/group and define fiscal uniqueness within/across it                                           | represents group policy; greatest migration and cross-company escalation risk      | active Company must remain the operational tenant beneath group context | needs explicit group administrator and non-transitive authority           | Organization hierarchy/root rules must be versioned | requires group/Company predicates and no implicit sibling access | likely additive migration/backfill after separate approval | app-first compatibility plus reversible migration plan | required                              |
| C — external group reference without authority | store a reference/classification only; never use it as authorization scope                                            | supports reporting/integration but can be mistaken for access authority            | active Company remains sole authority                                   | global operations still separate                                          | may label structures without changing ownership     | group reference cannot grant sibling access                      | likely additive field/entity after approval                | ignore reference while preserving tenant controls      | required                              |
| D — minimum delimited Company scope            | authorize only an explicitly selected subset with no group semantics, no tax-ID policy change, and minimum projection | may unblock limited read/self-context operations; risks fragmenting administration | compatible only for approved membership/self-context operations         | create or cross-company status remains blocked unless separately approved | no Organization behavior change                     | active-company predicate mandatory for enterprise subset         | none expected for a projection-only subset                 | revert endpoint adapter while retaining JWT/isolation  | `CANDIDATE — HUMAN APPROVAL REQUIRED` |
| E — defer                                      | leave all six handlers `LEGACY_DEFERRED`                                                                              | no new privilege; business functionality remains unavailable after enforcement     | unchanged                                                               | unchanged                                                                 | unchanged                                           | unchanged                                                        | none                                                       | not applicable                                         | required                              |

## Decisions that may be delimited

A human may delimit a minimum operation/projection that explicitly excludes economic-group
semantics, fiscal-uniqueness changes, Organization hierarchy, global creation, and sibling-company
authority. That does not resolve BDP-012 and cannot silently authorize the remaining handlers.

## Decisions that require human approval

- root/group model and canonical source;
- fiscal uniqueness boundary and duplicate treatment;
- global versus active-company authority per operation;
- whether group membership grants any visibility (default proposal: no implicit authority);
- Company/Organization migration and backfill ownership;
- minimum delimited scope, if any, including explicit omissions and rollback.

No alternative is approved by this document.

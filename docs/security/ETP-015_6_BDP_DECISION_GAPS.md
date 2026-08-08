# ETP-015.6 — BDP Decision Gaps

**BDP-001:** `PENDING`

**BDP-011:** `PENDING`

**ETP-015.6:** `BLOCKED_PENDING_DECISION`

This document identifies material decisions that cannot be inferred from code or general practice. It neither resolves nor changes either BDP.

## BDP MATERIAL DECISIONS REQUIRED

### BDP-001 — official personal-data sources

The current decision asks DP to confirm the official source of CPF, date of birth, address, bank data and dependants. The 33 canonical response surfaces do not currently expose named fields for those datasets, but references, free text and metadata can become carriers as the modules evolve.

| Dependent FC items             | Decision that can be made now                                         | Decision requiring BDP-001                                                              | Impossible with current evidence                                         |
| ------------------------------ | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| FC-061..FC-068                 | decide whether opaque employment/calculation references are needed    | whether dereferencing may expose official employee/personal data                        | field-level projection of future CPF/birth/address/bank/dependant values |
| FC-073..FC-074, FC-076..FC-079 | decide whether event/decision/invalidation provenance is required     | whether free-text reasons or metadata may contain personal data from an official source | a safe mask for unspecified free text                                    |
| FC-087..FC-092                 | decide structural readiness/blocker projection                        | whether related entity references/metadata may identify a person                        | masking unknown metadata values                                          |
| FC-102, FC-105..FC-106         | decide whether warning/manifest references are operationally required | whether employee/reference arrays may be resolved to personal data                      | presentation of future official personal-data sources                    |

Affected decisions must remain blocked if they would expose or derive BDP-001 datasets. No generic personal-data assumption closes this dependency.

### BDP-011 — LGPD, sensitive access and retention

BDP-011 requires a human policy for document retention, medical-data access, disposal, export and LGPD. It directly affects field visibility, read audit retention and client-side storage.

| Dependent FC/items | Decision that can be made now                          | Decision requiring BDP-011                                                     | Impossible with current evidence                                      |
| ------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| FC-003..FC-015     | document current identity/session fields and consumers | retention/cache/export constraints for identity and network metadata           | final retention/erasure schedule                                      |
| FC-020..FC-035     | document grant provenance and validity fields          | retention and access to grant reasons and actor history                        | final archival/disposal rule                                          |
| FC-050..FC-052     | document aggregate/recent-activity use                 | whether activity text is sensitive and how long it may remain cached           | final masked representation for unconstrained descriptions            |
| FC-053..FC-080     | document workflow evidence and current UI use          | visibility/retention/export of actor names, reasons and event metadata         | definitive treatment of variable metadata and free text               |
| FC-081..FC-110     | document closure/history/manifest contracts            | retention/export and cache policy for timeline, totals, references and reasons | final retention of immutable evidence versus data-subject obligations |
| AR-01..AR-10       | propose event boundaries and allowlisted metadata      | which reads are mandatory to audit and event retention                         | retention period and disposal/export process                          |
| CP-01..CP-06       | document current client storage/cache                  | permitted cache profiles, TTL and persistence                                  | legal/privacy acceptance of FULL client cache                         |

## Decisions not blocked solely by the BDPs

Humans can still decide structural necessities for opaque IDs, booleans, enums, timestamps and version counters when the decision does not claim a personal-data classification or retention policy. They can also reject a field, keep FULL blocked, or request a narrower DTO. Such decisions must not be represented as resolving BDP-001 or BDP-011.

## Decisions that remain impossible now

- final masks for document, phone, email, address, bank, salary, name or financial values;
- a universal field-classification taxonomy derived from the permission taxonomy;
- final sensitive-read retention and export policy;
- authorization of integral payloads from an action capability without explicit semantic approval;
- safe allowlists for unconstrained `metadata` or free-text content without source/content governance.

## Exit conditions

Every affected FC, AR and CP decision must either cite a resolved BDP/version or remain explicitly blocked. BDP-001 and BDP-011 continue in [Business Decisions Pending](../project-management/BUSINESS_DECISIONS_PENDING.md) and are not approved by this package.

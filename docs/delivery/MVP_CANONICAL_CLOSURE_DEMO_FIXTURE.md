# Fixture canônico de fechamento para demonstração

## Purpose

Fixture fictício exclusivamente local para satisfazer as pré-condições reais do fluxo canônico de fechamento de competência.

## Environment

`local-demo` only. O gate rejeita produção, hosts remotos e bancos diferentes de `dp_system_demo`.

## Diagnóstico canônico

| Blocker                       | Condição canônica                                          | Dado ausente no demo    | Mudança do fixture                      |
| ----------------------------- | ---------------------------------------------------------- | ----------------------- | --------------------------------------- |
| `REQUIRED_TOTALS_UNAVAILABLE` | PayrollRun precisa possuir participantes para agregação    | zero PayrollRunEmployee | dois participantes fictícios concluídos |
| `REVIEW_CYCLE_NOT_CLOSED`     | ciclo mais recente deve estar `CLOSED`                     | nenhum ciclo fechado    | um ciclo alvo fechado                   |
| `REVIEW_ROUND_OUTDATED`       | `REVIEW_CLOSED.metadata.round` deve coincidir com o round  | evento coerente ausente | evento de round 1                       |
| `REVIEW_DECISIONS_INVALID`    | cada stage requer decisão aprovada, atual e não invalidada | decisões ausentes       | duas decisões determinísticas           |

## Fixture

- Company: Horizonte Demo;
- PayrollPeriod: uma competência `OPEN` determinística;
- PayrollRun: `COMPLETED`, com engine e parameter version;
- PayrollRunEmployee: dois contratos fictícios da Horizonte;
- totais canônicos fictícios: gross `12050.00`, net `9809.00`;
- review: `CLOSED`, round 1, submission 1;
- approval stages: 2;
- decisions: 2 `APPROVED`, sem invalidation;
- finding associado: informativo, sem blocker aberto.

## Ausência de resultado pré-semeado

Antes do endpoint de close, o período possui:

- zero `PayrollPeriodClosureVersion`;
- zero `PayrollPeriodClosureManifest`;
- zero eventos finais de fechamento;
- zero idempotency `COMPLETED` da demonstração.

**CLOSE / REPLAY / HISTORY / REOPEN ARE EXECUTED BY THE REAL RUNTIME FLOW.**

**THIS FIXTURE DOES NOT BYPASS READINESS.**

**THIS FIXTURE DOES NOT MODIFY BUSINESS RULES.**

**THIS FIXTURE DOES NOT AUTHORIZE PRODUCTION DATA SEEDING.**

## P0-03 — contrato interno de auditoria

O produtor de `PAYROLL_PERIOD_CLOSED` utilizava aliases divergentes do catálogo. Ele foi alinhado a `selectedPayrollRunId`, `linkedReviewCycleId` e `warnings`; a metadata não homologada `hashAlgorithmVersion` foi removida somente do AuditLog.

O manifesto canônico continua persistindo `payloadHash` e `hashAlgorithmVersion`. O catálogo não foi expandido e o sanitizador continua fail-closed.

## Estados aceitos pelo verifier

- `PREPARED`: período aberto e nenhum artefato final;
- `CLOSED`: uma versão fechada com manifesto e `PERIOD_CLOSED`;
- `REOPENED`: versão 1 superseded e sucessor 2 `OPEN`, com eventos de invalidação e reabertura.

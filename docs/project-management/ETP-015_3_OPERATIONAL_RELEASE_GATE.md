# ETP-015.3 — Operational Release Gate

## Estado

**ETP-015.3 OPERATIONAL GATE:** `NOT READY — TARGET ENVIRONMENT AND DBA/OPERATIONS APPROVAL REQUIRED`

- **PR #61:** `OPEN — DRAFT — BLOCKED BY DBA/OPERATIONS`;
- **develop:** ETP-015.3 `READY TO START`;
- **branch do PR #61:** ETP-015.3 `IN PROGRESS — NOT MERGED`;
- **ETP-015.4:** `NOT STARTED`.

| Dimensão                 | Estado                                            |
| ------------------------ | ------------------------------------------------- |
| Técnica/funcional        | `VALIDATED IN PR #61`                             |
| Segurança/privacidade    | `VALIDATED IN PR #61`                             |
| Catálogo GA/PC           | GA-01..GA-14 e PC-01..PC-21 `COMPLIANT IN PR #61` |
| GA-15/DBA/Infraestrutura | `PENDING`                                         |
| Backup/restore/rollback  | `EVIDENCED LOCALLY — TARGET ENVIRONMENT PENDING`  |
| Compatibilidade/ensaio   | `EVIDENCED LOCALLY — TARGET ENVIRONMENT PENDING`  |
| Decisão final            | `PENDING`                                         |

Evidências técnicas locais estão em
[`evidence/etp-015-3`](evidence/etp-015-3/local-environment-summary.md). Elas não homologam qualquer
destino nem alteram o bloqueio.

## Condições bloqueadoras

Qualquer item DBA bloqueador pendente; ausência de prova por ambiente; extensão/privilégio não
homologado; locks/duração/janela não medidos; backup ou restore não comprovado; rollback não aprovado;
compatibilidade não ensaiada; ausência de responsável; ou checks vermelhos.

## Condição para retirar o PR #61 de Draft

Todos os itens bloqueadores devem estar `APPROVED`, com anexos verificáveis; ensaio representativo,
`btree_gist`, locks, duração, janela, backup, restore, rollback e compatibilidade devem estar
homologados por DBA/Operação, e os checks do PR #61 devem estar verdes. Este documento não concede a
aprovação.

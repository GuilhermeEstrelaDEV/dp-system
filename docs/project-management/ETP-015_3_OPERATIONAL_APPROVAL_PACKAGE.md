# ETP-015.3 — Pacote de homologação operacional

## Estado e objetivo

**Operational Gate:** `NOT READY — DBA/OPERATIONS EVIDENCE REQUIRED`.

Este pacote prepara a decisão humana sobre o deploy da migration `0016`. A implementação candidata
está no [PR #61](https://github.com/GuilhermeEstrelaDEV/dp-system/pull/61): **IMPLEMENTED IN PR #61 —
NOT MERGED**. `develop` permanece com ETP-015.3 `READY TO START`; a branch do PR registra `IN
PROGRESS`; ETP-015.4 está `NOT STARTED`.

| Dimensão                | Estado                                               |
| ----------------------- | ---------------------------------------------------- |
| Implementação funcional | `VALIDATED IN PR #61`                                |
| Segurança e privacidade | `VALIDATED IN PR #61`                                |
| PC-01..PC-21            | `COMPLIANT IN PR #61`                                |
| GA-01..GA-14            | `COMPLIANT IN PR #61`                                |
| GA-15                   | `PARTIALLY COMPLIANT — OPERATIONAL EVIDENCE PENDING` |
| DBA/Operação            | `PENDING`                                            |
| PR #61                  | `OPEN — DRAFT — BLOCKED BY DBA/OPERATIONS`           |

## Contexto e escopo

A candidata 0016 enriquece `Permission`, `RolePermission` e `UserCompanyRole`, preserva IDs e
relações, realiza backfill sem grants, troca a PK composta de `RolePermission` por UUID, recria FKs e
índices e instala `btree_gist` para exclusion constraints temporais. Não ativa guards, endpoints ou
assignments automáticos.

O bloqueio decorre da ausência de evidência dos ambientes de destino: privilégio/extensão, volume,
locks, duração, janela, réplicas, múltiplas instâncias, backup/restore e compatibilidade entre versões.

## Dependências, riscos e estratégia

- PostgreSQL compatível e `CREATE EXTENSION btree_gist` autorizado;
- lock potencialmente `ACCESS EXCLUSIVE` em `ALTER TABLE`, PK, FKs e constraints;
- espera por transações antigas e impacto de escrita/leitura em tabelas grandes;
- backup íntegro e restore ensaiado dentro de RPO/RTO aprovados;
- observação de locks, sessões, erros, latência e replica lag;
- rollout coordenado conforme a [matriz de compatibilidade](ETP-015_3_MIGRATION_RUNBOOK.md#compatibilidade-entre-versões);
- rollback somente conforme o [runbook de recuperação](ETP-015_3_ROLLBACK_AND_RECOVERY_RUNBOOK.md).

Não há estimativa de duração sem ensaio representativo. A proteção contra overlap não pode ser
removida para contornar indisponibilidade da extensão.

## Responsáveis e evidências

| Responsabilidade        | Responsável            | Evidência obrigatória           | Estado    |
| ----------------------- | ---------------------- | ------------------------------- | --------- |
| Banco/extensão/locks    | DBA                    | matriz, ensaio e aprovação      | `PENDING` |
| Infraestrutura/réplicas | Infraestrutura         | topologia, métricas e limites   | `PENDING` |
| Deploy/rollout          | Responsável por deploy | plano, janela e comunicação     | `PENDING` |
| Backup/restore          | DBA/Operação           | backup íntegro e restore medido | `PENDING` |
| Go/no-go                | DBA/Operação + Produto | matriz assinada                 | `PENDING` |

## Critérios de aprovação e bloqueio

Aprovar somente quando todos os itens bloqueadores da [matriz DBA](ETP-015_3_DBA_APPROVAL_MATRIX.md)
estiverem `APPROVED`, cada ambiente de destino tiver evidência, o ensaio for representativo, backup e
restore estiverem comprovados, rollback e janela estiverem aprovados e os checks do PR #61 estiverem
verdes.

Bloquear diante de extensão/privilégio indisponível, medição ausente, lock ou lag acima do limite
aprovado, backup irrecuperável, restore não testado, incompatibilidade de versões, ausência de
responsável ou risco de perda histórica.

**Decisão humana final:** `PENDING` — nenhuma aprovação é presumida por este documento.

# ETP-015.3 — Operational Release Gate

## Estado

**ETP-015.3 OPERATIONAL GATE:**
`NOT READY — TARGET ENVIRONMENT OR DBA/OPERATIONS EVIDENCE REQUIRED`

- **PR #63:** `MERGED`, evidência operacional local incorporada;
- **PR #61:** `MERGED`; o merge não representa aprovação operacional;
- **ETP-015.4:** `NOT STARTED`.

| Dimensão                             | Estado          |
| ------------------------------------ | --------------- |
| Evidência técnica local              | `EVIDENCED`     |
| Ambiente de destino                  | `NOT EVIDENCED` |
| `btree_gist` e privilégio no destino | `NOT EVIDENCED` |
| Volume, locks e duração no destino   | `NOT EVIDENCED` |
| Janela e rollout                     | `PENDING`       |
| Backup/restore de destino e RPO/RTO  | `PENDING`       |
| Monitoramento e critérios de aborto  | `NOT EVIDENCED` |
| Responsáveis e aprovadores           | `PENDING`       |
| Decisão final                        | `PENDING`       |

Permanecem bloqueadores todos os elementos de destino, owners e aprovações listados acima. Nenhuma
aprovação foi presumida. A incorporação do PR #61 antes da conclusão deste gate é uma divergência de
governança; ela não autoriza deploy em destino.

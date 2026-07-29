# ETP-015.3 — Questionário de homologação operacional

Respostas e evidências humanas permanecem `PENDING`.

| ID    | Área           | Pergunta                                                          | Resposta  | Evidência | Aprovador | Data      | Bloqueadora |
| ----- | -------------- | ----------------------------------------------------------------- | --------- | --------- | --------- | --------- | ----------- |
| OQ-01 | DBA            | Quais destinos e versões PostgreSQL existem?                      | `PENDING` | `PENDING` | `PENDING` | `PENDING` | SIM         |
| OQ-02 | DBA/Infra      | `btree_gist` está disponível e autorizada em cada destino?        | `PENDING` | `PENDING` | `PENDING` | `PENDING` | SIM         |
| OQ-03 | DBA            | A instalação foi ensaiada com o privilégio real?                  | `PENDING` | `PENDING` | `PENDING` | `PENDING` | SIM         |
| OQ-04 | DBA            | Quais são contagens e tamanhos das tabelas/índices?               | `PENDING` | `PENDING` | `PENDING` | `PENDING` | SIM         |
| OQ-05 | DBA            | Qual duração, maior lock e espera foram medidos?                  | `PENDING` | `PENDING` | `PENDING` | `PENDING` | SIM         |
| OQ-06 | DBA            | Quais timeouts e critérios de cancelamento/retry foram aprovados? | `PENDING` | `PENDING` | `PENDING` | `PENDING` | SIM         |
| OQ-07 | Produto/Deploy | Qual janela e impacto de tráfego foram aceitos?                   | `PENDING` | `PENDING` | `PENDING` | `PENDING` | SIM         |
| OQ-08 | Infra          | Existem réplicas; qual limite de lag?                             | `PENDING` | `PENDING` | `PENDING` | `PENDING` | SIM         |
| OQ-09 | Infra/Deploy   | Como drenar instâncias, workers, jobs, pools e conexões?          | `PENDING` | `PENDING` | `PENDING` | `PENDING` | SIM         |
| OQ-10 | DBA            | Existe backup íntegro, criptografado e retido?                    | `PENDING` | `PENDING` | `PENDING` | `PENDING` | SIM         |
| OQ-11 | DBA/Produto    | Restore foi testado e RPO/RTO são aceitáveis?                     | `PENDING` | `PENDING` | `PENDING` | `PENDING` | SIM         |
| OQ-12 | Engenharia/DBA | Os dois cenários de rollback foram aprovados?                     | `PENDING` | `PENDING` | `PENDING` | `PENDING` | SIM         |
| OQ-13 | Operação       | Locks, lag, erros e performance serão observados como?            | `PENDING` | `PENDING` | `PENDING` | `PENDING` | SIM         |
| OQ-14 | Segurança      | Evidências/logs evitam credenciais e dados pessoais?              | `PENDING` | `PENDING` | `PENDING` | `PENDING` | SIM         |
| OQ-15 | Deploy         | Compatibilidade e ordem de rollout foram ensaiadas?               | `PENDING` | `PENDING` | `PENDING` | `PENDING` | SIM         |
| OQ-16 | Produto        | Comunicação, owner e escalonamento estão aprovados?               | `PENDING` | `PENDING` | `PENDING` | `PENDING` | SIM         |
| OQ-17 | DBA/Operação   | A decisão final é GO ou NO-GO?                                    | `PENDING` | `PENDING` | `PENDING` | `PENDING` | SIM         |

## Subsídios locais, sem resposta humana

- OQ-01–OQ-06: PostgreSQL 16.14, `btree_gist` 1.7, privilégio restrito negado, volumes sintéticos,
  duração e locks constam nos [relatórios locais](evidence/etp-015-3/local-environment-summary.md).
- OQ-10–OQ-12: backup/restore e dois cenários de rollback foram ensaiados apenas localmente.
- OQ-15: builds A–D foram avaliados; runtime completo permanece parcial.

Todas as respostas, aprovadores e datas continuam `PENDING` para decisão humana e destinos reais.

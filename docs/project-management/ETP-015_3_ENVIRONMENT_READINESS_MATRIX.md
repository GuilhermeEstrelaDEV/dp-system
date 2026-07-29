# ETP-015.3 — Matriz de prontidão dos ambientes

## Ambientes comprovadamente identificados

O repositório documenta apenas o **ambiente local de desenvolvimento**, com contêiner PostgreSQL 16.
Não há inventário objetivo de homologação, staging ou produção; por isso esses nomes não são criados
como ambientes reais. Local não substitui qualquer destino operacional futuro.

| Campo                                    | Local de desenvolvimento                                  |
| ---------------------------------------- | --------------------------------------------------------- |
| Finalidade                               | desenvolvimento e ensaio local                            |
| Provedor                                 | Docker local                                              |
| PostgreSQL                               | 16                                                        |
| `CREATE EXTENSION`                       | evidenciado no ensaio local do PR #61                     |
| `btree_gist` disponível/instalada        | evidenciado localmente / durante ensaio                   |
| Responsável DBA                          | `NOT EVIDENCED`                                           |
| `permissions` — registros/tamanho        | 19 / 81.920 bytes antes; 139.264 depois                   |
| `role_permissions` — registros/tamanho   | 133 / 57.344 bytes antes; 212.992 depois                  |
| `user_company_roles` — registros/tamanho | 20.000 / 7.028.736 bytes antes; 21.839.872 depois         |
| FKs/índices afetados                     | constraints 9→31; índices 7→19 nas três tabelas           |
| Réplicas                                 | nenhuma no ensaio; destino `NOT EVIDENCED`                |
| Instâncias da aplicação                  | não representativo; destino `NOT EVIDENCED`               |
| `statement_timeout` / `lock_timeout`     | 0 / 0; prova concorrente usou 10s por sessão              |
| Backup / restore                         | 1.769.533 bytes, 490 ms / 1.977 ms; contagens preservadas |
| Janela de manutenção                     | `NOT EVIDENCED`                                           |
| Status                                   | `EVIDENCED LOCALLY — TARGET ENVIRONMENT PENDING`          |
| Aprovador/data                           | `PENDING` / `PENDING`                                     |

## Registro para cada futuro ambiente de destino

Antes de incluí-lo no release gate, preencher: nome, finalidade, provedor, PostgreSQL, privilégio e
estado de `btree_gist`, DBA, contagem/tamanho das três tabelas, FKs/índices, réplicas, instâncias,
timeouts, backup, restore, janela, evidências, aprovador e data. Campos sem prova permanecem `NOT
EVIDENCED`.

Evidência: [ambiente local](evidence/etp-015-3/local-environment-summary.md),
[upgrade](evidence/etp-015-3/upgrade-results.md) e
[backup/restore](evidence/etp-015-3/backup-restore-results.md).

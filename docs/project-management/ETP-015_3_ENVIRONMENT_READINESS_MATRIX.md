# ETP-015.3 — Matriz de prontidão dos ambientes

## Ambientes comprovadamente identificados

O repositório documenta apenas o **ambiente local de desenvolvimento**, com contêiner PostgreSQL 16.
Não há inventário objetivo de homologação, staging ou produção; por isso esses nomes não são criados
como ambientes reais. Local não substitui qualquer destino operacional futuro.

| Campo                                    | Local de desenvolvimento                                 |
| ---------------------------------------- | -------------------------------------------------------- |
| Finalidade                               | desenvolvimento e ensaio local                           |
| Provedor                                 | Docker local                                             |
| PostgreSQL                               | 16                                                       |
| `CREATE EXTENSION`                       | evidenciado no ensaio local do PR #61                    |
| `btree_gist` disponível/instalada        | evidenciado localmente / durante ensaio                  |
| Responsável DBA                          | `NOT EVIDENCED`                                          |
| `permissions` — registros/tamanho        | 19 após seed / `NOT EVIDENCED`                           |
| `role_permissions` — registros/tamanho   | 0 no banco limpo / `NOT EVIDENCED`                       |
| `user_company_roles` — registros/tamanho | 0 no banco limpo / `NOT EVIDENCED`                       |
| FKs/índices afetados                     | conforme migration 0016 / medição `NOT EVIDENCED`        |
| Réplicas                                 | `NOT EVIDENCED`                                          |
| Instâncias da aplicação                  | `NOT EVIDENCED`                                          |
| `statement_timeout` / `lock_timeout`     | `NOT EVIDENCED`                                          |
| Backup / restore                         | `NOT EVIDENCED` / `NOT EVIDENCED`                        |
| Janela de manutenção                     | `NOT EVIDENCED`                                          |
| Status                                   | evidência técnica local; aprovação operacional `PENDING` |
| Aprovador/data                           | `PENDING` / `PENDING`                                    |

## Registro para cada futuro ambiente de destino

Antes de incluí-lo no release gate, preencher: nome, finalidade, provedor, PostgreSQL, privilégio e
estado de `btree_gist`, DBA, contagem/tamanho das três tabelas, FKs/índices, réplicas, instâncias,
timeouts, backup, restore, janela, evidências, aprovador e data. Campos sem prova permanecem `NOT
EVIDENCED`.

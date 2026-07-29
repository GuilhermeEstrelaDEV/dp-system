# ETP-015.3 — Matriz de prontidão dos ambientes

## Ambiente declarado

| Campo                  | Desenvolvimento Local                                                 | Classificação                                |
| ---------------------- | --------------------------------------------------------------------- | -------------------------------------------- |
| Nome/finalidade        | desenvolvimento e validação técnica local                             | `DECLARED — LOCAL ONLY`                      |
| Provedor/PostgreSQL    | Docker; PostgreSQL 16.14 (`postgres:16-alpine`)                       | `EVIDENCED` localmente                       |
| `btree_gist`           | disponível; instalada pela migration 0016                             | `EVIDENCED` localmente                       |
| `CREATE EXTENSION`     | usuário administrativo e usuário da migration autorizados localmente  | `EVIDENCED` localmente                       |
| Restrições do provedor | destinos não informados                                               | `NOT EVIDENCED`                              |
| DBA/Infra/Deploy       | não identificados                                                     | `PENDING`                                    |
| Registros              | Permission 19; RolePermission 133; UserCompanyRole 20.000, sintéticos | `EVIDENCED` localmente                       |
| Tabelas/índices        | medidas somente no ensaio local                                       | destino `NOT EVIDENCED`                      |
| Réplicas               | nenhuma local                                                         | `NOT APPLICABLE` localmente                  |
| Aplicação/jobs         | 1 instância; sem jobs concorrentes identificados                      | `DECLARED — LOCAL ONLY`                      |
| Deploy                 | estratégia não informada                                              | `PENDING`                                    |
| Timeouts               | `statement_timeout=0`; `lock_timeout=0`                               | `DECLARED — LOCAL ONLY`                      |
| Monitoramento/lag      | observação local; lag não aplicável                                   | `DECLARED — LOCAL ONLY`                      |
| Janela                 | todos os campos não informados                                        | `PENDING`                                    |
| Backup/restore         | `pg_dump`; restore no ensaio local                                    | `EVIDENCED` localmente                       |
| RPO/RTO/owner          | não informados para destinos                                          | `PENDING`                                    |
| Rollback               | permitido sob as condições documentadas                               | evidência técnica local; aprovação `PENDING` |
| Aprovadores/decisão    | todos não identificados                                               | `PENDING`                                    |

Não foi identificado ambiente de homologação, staging ou produção. A declaração é consistente com os
[relatórios locais sanitizados](evidence/etp-015-3/local-environment-summary.md), mas não constitui
evidência observada em destino nem aprovação humana formal.

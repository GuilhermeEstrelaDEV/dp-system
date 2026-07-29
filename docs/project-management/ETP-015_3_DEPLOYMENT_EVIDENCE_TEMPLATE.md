# ETP-015.3 — Template de evidência de ensaio

Não preencher para um destino sem ensaio representativo real.

O ensaio local preenchido está nos relatórios sanitizados em
[`evidence/etp-015-3`](evidence/etp-015-3/local-environment-summary.md). Este template permanece
`NOT EVIDENCED` para cada ambiente de destino real.

## Registro recebido — Desenvolvimento Local

| Campo                                        | Informação declarada                                                  | Classificação                          |
| -------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------- |
| Ambiente/provedor                            | Desenvolvimento Local / Docker                                        | `DECLARED — LOCAL ONLY`                |
| PostgreSQL                                   | 16.14 (`postgres:16-alpine`)                                          | `EVIDENCED` localmente                 |
| Extensão/privilégio                          | `btree_gist` instalada pela 0016; usuário local autorizado            | `EVIDENCED` localmente                 |
| Volumes                                      | 19 Permission; 133 RolePermission; 20.000 UserCompanyRole, sintéticos | `EVIDENCED` localmente                 |
| Infraestrutura                               | sem réplicas; 1 instância; sem jobs concorrentes identificados        | `DECLARED — LOCAL ONLY`                |
| Timeouts/monitoramento                       | 0/0; observação local                                                 | `DECLARED — LOCAL ONLY`                |
| Backup/restore                               | `pg_dump`; restore no ensaio local                                    | `EVIDENCED` localmente                 |
| Rollback                                     | permitido sob as condições documentadas                               | evidência técnica; aprovação `PENDING` |
| Owners, janela, RPO/RTO, deploy, aprovadores | não fornecidos                                                        | `PENDING`                              |

Não foram fornecidas credenciais, tokens, connection strings, IPs privados ou dados pessoais.

| Campo                          | Resultado             |
| ------------------------------ | --------------------- |
| Ambiente/provedor              | `NOT EVIDENCED`       |
| PostgreSQL/configuração        | `NOT EVIDENCED`       |
| CPU/memória/storage            | `NOT EVIDENCED`       |
| Registros por tabela           | `NOT EVIDENCED`       |
| Tamanho das tabelas/índices    | `NOT EVIDENCED`       |
| Migration inicial/final        | `NOT EVIDENCED`       |
| Início/fim/duração             | `NOT EVIDENCED`       |
| Locks/waits/espera máxima      | `NOT EVIDENCED`       |
| Queries bloqueadas             | `NOT EVIDENCED`       |
| Replica lag                    | `NOT EVIDENCED`       |
| Erros/warnings                 | `NOT EVIDENCED`       |
| Contagens antes/depois         | `NOT EVIDENCED`       |
| Assignments antes/depois       | `NOT EVIDENCED`       |
| Grants antes/depois            | `NOT EVIDENCED`       |
| IDs/codes/relações preservados | `NOT EVIDENCED`       |
| Constraints e extensão         | `NOT EVIDENCED`       |
| Rollback testado               | `NOT EVIDENCED`       |
| Restore testado                | `NOT EVIDENCED`       |
| Evidências anexas              | `NOT EVIDENCED`       |
| Responsável/aprovador          | `PENDING` / `PENDING` |
| Decisão/data                   | `PENDING` / `PENDING` |

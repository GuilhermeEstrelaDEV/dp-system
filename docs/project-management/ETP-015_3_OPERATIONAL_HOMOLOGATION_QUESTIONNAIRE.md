# ETP-015.3 — Questionário de homologação operacional

As respostas recebidas referem-se somente a Desenvolvimento Local. `DECLARED — LOCAL ONLY` não
representa aprovação de destino.

| ID    | Área           | Resposta registrada                                        | Evidência/estado                                | Aprovador |
| ----- | -------------- | ---------------------------------------------------------- | ----------------------------------------------- | --------- |
| OQ-01 | DBA            | Docker, PostgreSQL 16.14                                   | `EVIDENCED` local; destinos `NOT EVIDENCED`     | `PENDING` |
| OQ-02 | DBA/Infra      | `btree_gist` disponível e instalada                        | `EVIDENCED` local                               | `PENDING` |
| OQ-03 | DBA            | usuário local da migration autorizado                      | `EVIDENCED` local; destino `NOT EVIDENCED`      | `PENDING` |
| OQ-04 | DBA            | 19/133/20.000 sintéticos; tamanhos locais                  | `EVIDENCED` local; volume real `NOT EVIDENCED`  | `PENDING` |
| OQ-05 | DBA            | duração e locks nos relatórios locais                      | `EVIDENCED` local                               | `PENDING` |
| OQ-06 | DBA            | timeouts 0/0; cancelamento não definido                    | `DECLARED — LOCAL ONLY`; política `PENDING`     | `PENDING` |
| OQ-07 | Produto/Deploy | janela e impacto não informados                            | `PENDING`                                       | `PENDING` |
| OQ-08 | Infra          | sem réplica local; destino não informado                   | local `NOT APPLICABLE`; destino `NOT EVIDENCED` | `PENDING` |
| OQ-09 | Infra/Deploy   | 1 instância; sem jobs identificados; deploy não definido   | local declarado; destino `PENDING`              | `PENDING` |
| OQ-10 | DBA            | `pg_dump` recuperável somente localmente                   | `EVIDENCED` local; destino `NOT EVIDENCED`      | `PENDING` |
| OQ-11 | DBA/Produto    | restore local; RPO/RTO não informados                      | local evidenciado; aceitação `PENDING`          | `PENDING` |
| OQ-12 | Engenharia/DBA | rollback condicionado à ausência de histórico incompatível | local evidenciado; aprovação `PENDING`          | `PENDING` |
| OQ-13 | Operação       | somente observação local                                   | destino `NOT EVIDENCED`                         | `PENDING` |
| OQ-14 | Segurança      | evidências sanitizadas                                     | `EVIDENCED` local; aprovação `PENDING`          | `PENDING` |
| OQ-15 | Deploy         | estratégia não informada                                   | `PENDING`                                       | `PENDING` |
| OQ-16 | Produto        | comunicação, owners e escalonamento não informados         | `PENDING`                                       | `PENDING` |
| OQ-17 | DBA/Operação   | decisão final não fornecida                                | `PENDING`                                       | `PENDING` |

Não há data nem decisão formal de DBA/Operações, Infraestrutura, Segurança ou Produto.

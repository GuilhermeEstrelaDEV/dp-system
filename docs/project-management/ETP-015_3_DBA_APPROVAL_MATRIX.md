# ETP-015.3 — Matriz de aprovação DBA/Operações

Nenhum aprovador é presumido. A declaração recebida descreve exclusivamente Desenvolvimento Local;
evidência local não aprova um ambiente de destino.

| ID     | Requisito                           | Evidência e ambiente                                   | Responsável                 | Estado           | Observação                  |
| ------ | ----------------------------------- | ------------------------------------------------------ | --------------------------- | ---------------- | --------------------------- |
| DBA-01 | versão PostgreSQL compatível        | PostgreSQL 16.14 (`postgres:16-alpine`), local         | DBA `PENDING`               | `EVIDENCED`      | destino `NOT EVIDENCED`     |
| DBA-02 | `btree_gist` disponível             | instalada pela 0016, local                             | DBA `PENDING`               | `EVIDENCED`      | destino `NOT EVIDENCED`     |
| DBA-03 | privilégio de instalação autorizado | usuário local da migration possui privilégio           | DBA/Infra `PENDING`         | `EVIDENCED`      | destino `NOT EVIDENCED`     |
| DBA-04 | instalação da extensão ensaiada     | ensaio local da 0016                                   | DBA `PENDING`               | `EVIDENCED`      | não homologa destino        |
| DBA-05 | contagem e tamanho das tabelas      | 19/133/20.000 sintéticos; tamanhos locais              | DBA `PENDING`               | `EVIDENCED`      | volume real `NOT EVIDENCED` |
| DBA-06 | duração representativa medida       | tempos do ensaio local                                 | DBA/Deploy `PENDING`        | `EVIDENCED`      | destino `NOT EVIDENCED`     |
| DBA-07 | locks e waits observados            | relatório local                                        | DBA `PENDING`               | `EVIDENCED`      | destino `NOT EVIDENCED`     |
| DBA-08 | timeouts aprovados                  | `statement_timeout=0`; `lock_timeout=0`, local         | DBA `PENDING`               | `PENDING`        | sem aprovação               |
| DBA-09 | janela aprovada                     | dados e autoridades `PENDING`                          | Operação/Produto `PENDING`  | `PENDING`        | bloqueador                  |
| DBA-10 | backup recuperável                  | `pg_dump` recuperável apenas localmente                | DBA `PENDING`               | `EVIDENCED`      | destino `NOT EVIDENCED`     |
| DBA-11 | restore ensaiado                    | ensaio local                                           | DBA `PENDING`               | `EVIDENCED`      | destino `NOT EVIDENCED`     |
| DBA-12 | RPO/RTO aceitos                     | `PENDING` para destinos                                | Operação/Produto `PENDING`  | `PENDING`        | bloqueador                  |
| DBA-13 | topologia de réplicas               | nenhuma réplica local                                  | Infra/DBA `PENDING`         | `NOT APPLICABLE` | destino `NOT EVIDENCED`     |
| DBA-14 | limite e medição de lag             | não aplicável localmente                               | DBA `PENDING`               | `NOT APPLICABLE` | destino `NOT EVIDENCED`     |
| DBA-15 | instâncias/jobs inventariados       | 1 instância; sem jobs identificados, local             | Infra `PENDING`             | `EVIDENCED`      | destino `NOT EVIDENCED`     |
| DBA-16 | compatibilidade ensaiada            | builds locais; runtime parcial                         | Engenharia/Deploy `PENDING` | `EVIDENCED`      | destino pendente            |
| DBA-17 | rollout e drenagem aprovados        | estratégia `PENDING`                                   | Deploy `PENDING`            | `PENDING`        | bloqueador                  |
| DBA-18 | monitoramento e aborto              | somente observação local                               | Operação `PENDING`          | `NOT EVIDENCED`  | bloqueador                  |
| DBA-19 | rollback/forward fix aprovados      | comportamento local evidenciado; autorizador `PENDING` | DBA/Engenharia `PENDING`    | `PENDING`        | bloqueador                  |
| DBA-20 | owner operacional nomeado           | owners `PENDING`                                       | Operação `PENDING`          | `PENDING`        | bloqueador                  |
| DBA-21 | comunicação e escalonamento         | `PENDING`                                              | Deploy/Produto `PENDING`    | `PENDING`        | bloqueador                  |
| DBA-22 | autorização final                   | decisão e aprovadores `PENDING`                        | DBA/Operação `PENDING`      | `PENDING`        | bloqueador                  |

Resultado: 11 itens `EVIDENCED`, 2 `NOT APPLICABLE`, 1 `NOT EVIDENCED` e 8 `PENDING`.
Nenhum item está `APPROVED` ou `APPROVED WITH CONDITION`.

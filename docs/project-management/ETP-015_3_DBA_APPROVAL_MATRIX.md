# ETP-015.3 — Matriz de aprovação DBA/Operações

Todos os itens dependentes de ambiente iniciam `PENDING`; nenhum aprovador é presumido.

| ID     | Requisito                               | Evidência       | Ambiente             | Responsável       | Decisão   | Data      | Observação  |
| ------ | --------------------------------------- | --------------- | -------------------- | ----------------- | --------- | --------- | ----------- |
| DBA-01 | versão PostgreSQL compatível            | `NOT EVIDENCED` | destino              | DBA               | `PENDING` | `PENDING` | —           |
| DBA-02 | `btree_gist` disponível                 | `NOT EVIDENCED` | cada destino         | DBA               | `PENDING` | `PENDING` | bloqueador  |
| DBA-03 | privilégio de instalação autorizado     | `NOT EVIDENCED` | cada destino         | DBA/Infra         | `PENDING` | `PENDING` | bloqueador  |
| DBA-04 | instalação da extensão ensaiada         | `NOT EVIDENCED` | representativo       | DBA               | `PENDING` | `PENDING` | —           |
| DBA-05 | contagem e tamanho das tabelas          | `NOT EVIDENCED` | cada destino         | DBA               | `PENDING` | `PENDING` | —           |
| DBA-06 | duração representativa medida           | `NOT EVIDENCED` | representativo       | DBA/Deploy        | `PENDING` | `PENDING` | não estimar |
| DBA-07 | locks e waits observados                | `NOT EVIDENCED` | representativo       | DBA               | `PENDING` | `PENDING` | —           |
| DBA-08 | statement/lock timeouts aprovados       | `NOT EVIDENCED` | cada destino         | DBA               | `PENDING` | `PENDING` | —           |
| DBA-09 | janela de manutenção aprovada           | `NOT EVIDENCED` | destino              | Operação/Produto  | `PENDING` | `PENDING` | —           |
| DBA-10 | backup íntegro e recuperável            | `NOT EVIDENCED` | destino              | DBA               | `PENDING` | `PENDING` | bloqueador  |
| DBA-11 | restore ensaiado                        | `NOT EVIDENCED` | representativo       | DBA               | `PENDING` | `PENDING` | bloqueador  |
| DBA-12 | RPO/RTO aceitos                         | `NOT EVIDENCED` | destino              | Operação/Produto  | `PENDING` | `PENDING` | —           |
| DBA-13 | topologia de réplicas inventariada      | `NOT EVIDENCED` | destino              | Infra/DBA         | `PENDING` | `PENDING` | —           |
| DBA-14 | limite e medição de replica lag         | `NOT EVIDENCED` | destino              | DBA               | `PENDING` | `PENDING` | —           |
| DBA-15 | múltiplas instâncias/jobs inventariados | `NOT EVIDENCED` | destino              | Infra             | `PENDING` | `PENDING` | —           |
| DBA-16 | compatibilidade entre versões ensaiada  | `NOT EVIDENCED` | representativo       | Engenharia/Deploy | `PENDING` | `PENDING` | —           |
| DBA-17 | rollout e drenagem aprovados            | `NOT EVIDENCED` | destino              | Deploy            | `PENDING` | `PENDING` | —           |
| DBA-18 | monitoramento e critérios de abortar    | `NOT EVIDENCED` | destino              | Operação          | `PENDING` | `PENDING` | —           |
| DBA-19 | rollback/forward fix aprovados          | `NOT EVIDENCED` | destino              | DBA/Engenharia    | `PENDING` | `PENDING` | bloqueador  |
| DBA-20 | owner operacional nomeado               | `NOT EVIDENCED` | destino              | Operação          | `PENDING` | `PENDING` | —           |
| DBA-21 | comunicação e escalonamento aprovados   | `NOT EVIDENCED` | destino              | Deploy/Produto    | `PENDING` | `PENDING` | —           |
| DBA-22 | autorização final de produção           | `NOT EVIDENCED` | produção, se existir | DBA/Operação      | `PENDING` | `PENDING` | bloqueador  |

# ETP-015 Gate A — Rollback Plan

## Estado

**PROPOSAL — HUMAN APPROVAL REQUIRED.** O plano não executa rollback e não autoriza migration.

## Princípios

- nenhuma coluna/tabela legada é removida na primeira migration;
- rollback nunca concede acesso nem desabilita identidade, empresa ativa ou deny-by-default existente;
- dados históricos não são apagados; restauração usa backup verificado ou forward fix;
- cada ativação funcional futura possui flag/adaptador independente da expansão do schema.

## Plano por etapa

| Etapa                         | Classe                       | Sinal de rollback                     | Ação segura                                                            | Evidência                 |
| ----------------------------- | ---------------------------- | ------------------------------------- | ---------------------------------------------------------------------- | ------------------------- |
| enums/colunas aditivas vazias | Reversível                   | erro de DDL antes do backfill         | remover somente objetos sem dados após confirmar consumidores          | catálogo do schema        |
| backfill                      | Reversível com restauração   | divergência de contagem/classificação | restaurar snapshot das colunas novas ou executar script inverso por ID | hashes e relatório        |
| índices B-tree                | Reversível                   | regressão de escrita/plano            | `DROP INDEX` controlado                                                | explain antes/depois      |
| extension/GiST                | Reversível com restrição     | incompatibilidade operacional         | remover constraint/índice; extension só se não compartilhada           | dependências PostgreSQL   |
| checks/FKs                    | Reversível                   | dados legítimos rejeitados            | retirar constraint, preservar dados e corrigir desenho                 | query de violações        |
| troca de PK RolePermission    | Reversível com restauração   | FK/consumer incompatível              | manter ID, restaurar PK composta a partir de pares únicos              | fixture de upgrade        |
| leitura sombra                | Reversível                   | diferença entre resolvedores          | desligar flag; resolvedor atual permanece autoridade                   | telemetria segura         |
| dupla escrita futura          | Reversível com reconciliação | divergência                           | desligar writer novo e reconciliar pelo ledger                         | relatório de equivalência |
| ativação futura               | Reversível                   | negação/regressão inesperada          | voltar leitura via adapter sem remover autenticação/empresa/isolamento | runbook e métricas        |
| remoção legada futura         | Destrutiva                   | não aplicável nesta etapa             | proibida até iniciativa própria e backup homologado                    | nova decisão              |

## Pontos de não retorno

Nenhum ponto irreversível é aceito na ETP-015.3 inicial. Alterar códigos, apagar assignments, inventar
proveniência ou eliminar estrutura legada é destrutivo e proibido. Caso um deploy parcial ocorra, a
preferência é forward fix aditivo; restore exige backup testado, janela aprovada e reconciliação.

## Procedimento operacional candidato

1. congelar writers administrativos futuros, sem afetar operação atual;
2. capturar schema, contagens, pares, vínculos e checksums técnicos;
3. aplicar uma etapa por vez e executar smoke/read-only comparison;
4. diante de falha, impedir ativação, coletar evidência e executar a ação da tabela;
5. validar que acessos efetivos não aumentaram e que consumidores atuais funcionam;
6. registrar decisão, executor, trace operacional e resultado; reabrir rollout apenas após revisão.

## Aprovações necessárias

Arquitetura aprova reversibilidade lógica; Segurança valida que rollback não seja permissivo;
DBA/Operação aprova locks, backup/restore e extensão; Produto aceita janela somente quando houver
impacto operacional. GA-14 permanece `PENDING`.

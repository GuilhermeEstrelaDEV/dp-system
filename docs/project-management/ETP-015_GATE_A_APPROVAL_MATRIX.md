# ETP-015 Gate A — Approval Matrix

## Instruções

Cada decisão exige aprovador identificado e evidência. `Decisão`, `justificativa`, `evidência` e
`data` permanecem vazios; nenhuma recomendação abaixo equivale a aprovação.

| ID    | Questão                                | Recomendação técnica                                      | Alternativas                 | Risco                           | Impacto                | Aprovador requerido                | Decisão | Justificativa | Evidência | Data | Status  |
| ----- | -------------------------------------- | --------------------------------------------------------- | ---------------------------- | ------------------------------- | ---------------------- | ---------------------------------- | ------- | ------------- | --------- | ---- | ------- |
| GA-01 | Qual estratégia Permission/Capability? | Evolução gradual de `Permission`, preservando IDs/códigos | A/B/C/D                      | Ambiguidade ou duplicidade      | Schema e consumidores  | Arquitetura + Segurança            |         |               |           |      | PENDING |
| GA-02 | Quais campos formam o catálogo?        | Campos exatos do pacote                                   | Reduzido/completo            | Metadado insuficiente/excessivo | Migration e governança | Arquitetura + Segurança            |         |               |           |      | PENDING |
| GA-03 | Qual taxonomia?                        | `resource.action`, enums fechados e strings controladas   | Tabelas/enums/strings        | Incompatibilidade               | Catálogo e API interna | Arquitetura + Segurança            |         |               |           |      | PENDING |
| GA-04 | Como versionar RolePermission?         | ID próprio, proveniência, vigência e histórico            | PK composta/ID histórico     | Perda de evidência              | RBAC                   | Arquitetura + Segurança            |         |               |           |      | PENDING |
| GA-05 | Como evoluir UserCompanyRole?          | Preservar vínculo e acrescentar proveniência/revogação    | Membership separado/composto | Migração e compatibilidade      | Contexto empresarial   | Arquitetura + Segurança            |         |               |           |      | PENDING |
| GA-06 | Quais dados de proveniência?           | Source técnico, ator opcional, razão e correlação         | Mínimo/completo              | Auditoria falsa ou PII          | Dados e auditoria      | Segurança + DPO                    |         |               |           |      | PENDING |
| GA-07 | Como revogar?                          | Registro imutável; reativação cria novo                   | Atualizar/recriar            | Perda histórica                 | Resolução e auditoria  | Segurança                          |         |               |           |      | PENDING |
| GA-08 | Qual vigência?                         | UTC `[validFrom, validTo)`                                | Limites alternativos         | Divergência ETP-015.2           | Queries e testes       | Arquitetura                        |         |               |           |      | PENDING |
| GA-09 | Como impedir sobreposição?             | Exclusion GiST + validação transacional                   | Unique/parcial/aplicação     | Corrida concorrente             | PostgreSQL/operação    | Arquitetura + DBA/Operação         |         |               |           |      | PENDING |
| GA-10 | Quais constraints?                     | Checks/FKs RESTRICT/exclusion do pacote                   | Conjunto reduzido            | Dados inválidos/lock            | Banco                  | Arquitetura + DBA/Operação         |         |               |           |      | PENDING |
| GA-11 | Quais índices?                         | Índices de resolução e governança do pacote               | Adiar/ampliar                | Custo de escrita/performance    | Banco                  | Arquitetura + DBA/Operação         |         |               |           |      | PENDING |
| GA-12 | Como fazer backfill?                   | Marcador legado, sem atores inventados ou grants          | Manual/automático            | Ampliação de acesso             | Dados existentes       | Arquitetura + Segurança + Operação |         |               |           |      | PENDING |
| GA-13 | Como liberar?                          | Expandir, backfill, sombra, comparar, ativar depois       | Big bang/fases               | Regressão                       | Deploy e consumidores  | Arquitetura + Segurança + Produto  |         |               |           |      | PENDING |
| GA-14 | Como reverter?                         | Rollback por fase, sem remoção legada                     | Restore/forward fix          | Perda de dados                  | Operação               | Arquitetura + DBA/Operação         |         |               |           |      | PENDING |
| GA-15 | Como provar zero grants?               | Checks de contagem, diff e deny-by-default                | Revisão manual apenas        | Acesso indevido                 | Segurança              | Segurança + Arquitetura            |         |               |           |      | PENDING |

## Regra de aprovação

Todos os 15 itens precisam estar `APPROVED` ou `APPROVED WITH CONDITIONS` sem condição bloqueadora.
Rejeição ou ausência de evidência mantém o Gate A fechado.

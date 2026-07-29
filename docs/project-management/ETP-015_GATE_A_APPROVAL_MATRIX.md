# ETP-015 Gate A — Approval Matrix

## Homologação

As recomendações técnicas GA-01..GA-15 foram aprovadas integralmente pelo responsável autorizado
para Arquitetura, Segurança, Privacidade/DPO, DBA/Operação e Produto.

- **Aprovador:** Guilherme Estrela
- **Data:** 29/07/2026
- **Evidência:** declaração humana de aprovação registrada em 29/07/2026
- **Condições bloqueadoras:** nenhuma

| ID    | Questão                                | Recomendação técnica                                      | Alternativas                 | Risco                           | Impacto                | Aprovador requerido                | Decisão  | Justificativa                                 | Evidência                        | Data       | Status   |
| ----- | -------------------------------------- | --------------------------------------------------------- | ---------------------------- | ------------------------------- | ---------------------- | ---------------------------------- | -------- | --------------------------------------------- | -------------------------------- | ---------- | -------- |
| GA-01 | Qual estratégia Permission/Capability? | Evolução gradual de `Permission`, preservando IDs/códigos | A/B/C/D                      | Ambiguidade ou duplicidade      | Schema e consumidores  | Arquitetura + Segurança            | APPROVED | Aprovação da recomendação técnica documentada | Declaração humana desta execução | 29/07/2026 | APPROVED |
| GA-02 | Quais campos formam o catálogo?        | Campos exatos do pacote                                   | Reduzido/completo            | Metadado insuficiente/excessivo | Migration e governança | Arquitetura + Segurança            | APPROVED | Aprovação da recomendação técnica documentada | Declaração humana desta execução | 29/07/2026 | APPROVED |
| GA-03 | Qual taxonomia?                        | `resource.action`, enums fechados e strings controladas   | Tabelas/enums/strings        | Incompatibilidade               | Catálogo e API interna | Arquitetura + Segurança            | APPROVED | Aprovação da recomendação técnica documentada | Declaração humana desta execução | 29/07/2026 | APPROVED |
| GA-04 | Como versionar RolePermission?         | ID próprio, proveniência, vigência e histórico            | PK composta/ID histórico     | Perda de evidência              | RBAC                   | Arquitetura + Segurança            | APPROVED | Aprovação da recomendação técnica documentada | Declaração humana desta execução | 29/07/2026 | APPROVED |
| GA-05 | Como evoluir UserCompanyRole?          | Preservar vínculo e acrescentar proveniência/revogação    | Membership separado/composto | Migração e compatibilidade      | Contexto empresarial   | Arquitetura + Segurança            | APPROVED | Aprovação da recomendação técnica documentada | Declaração humana desta execução | 29/07/2026 | APPROVED |
| GA-06 | Quais dados de proveniência?           | Source técnico, ator opcional, razão e correlação         | Mínimo/completo              | Auditoria falsa ou PII          | Dados e auditoria      | Segurança + DPO                    | APPROVED | Aprovação da recomendação técnica documentada | Declaração humana desta execução | 29/07/2026 | APPROVED |
| GA-07 | Como revogar?                          | Registro imutável; reativação cria novo                   | Atualizar/recriar            | Perda histórica                 | Resolução e auditoria  | Segurança                          | APPROVED | Aprovação da recomendação técnica documentada | Declaração humana desta execução | 29/07/2026 | APPROVED |
| GA-08 | Qual vigência?                         | UTC `[validFrom, validTo)`                                | Limites alternativos         | Divergência ETP-015.2           | Queries e testes       | Arquitetura                        | APPROVED | Aprovação da recomendação técnica documentada | Declaração humana desta execução | 29/07/2026 | APPROVED |
| GA-09 | Como impedir sobreposição?             | Exclusion GiST + validação transacional                   | Unique/parcial/aplicação     | Corrida concorrente             | PostgreSQL/operação    | Arquitetura + DBA/Operação         | APPROVED | Aprovação da recomendação técnica documentada | Declaração humana desta execução | 29/07/2026 | APPROVED |
| GA-10 | Quais constraints?                     | Checks/FKs RESTRICT/exclusion do pacote                   | Conjunto reduzido            | Dados inválidos/lock            | Banco                  | Arquitetura + DBA/Operação         | APPROVED | Aprovação da recomendação técnica documentada | Declaração humana desta execução | 29/07/2026 | APPROVED |
| GA-11 | Quais índices?                         | Índices de resolução e governança do pacote               | Adiar/ampliar                | Custo de escrita/performance    | Banco                  | Arquitetura + DBA/Operação         | APPROVED | Aprovação da recomendação técnica documentada | Declaração humana desta execução | 29/07/2026 | APPROVED |
| GA-12 | Como fazer backfill?                   | Marcador legado, sem atores inventados ou grants          | Manual/automático            | Ampliação de acesso             | Dados existentes       | Arquitetura + Segurança + Operação | APPROVED | Aprovação da recomendação técnica documentada | Declaração humana desta execução | 29/07/2026 | APPROVED |
| GA-13 | Como liberar?                          | Expandir, backfill, sombra, comparar, ativar depois       | Big bang/fases               | Regressão                       | Deploy e consumidores  | Arquitetura + Segurança + Produto  | APPROVED | Aprovação da recomendação técnica documentada | Declaração humana desta execução | 29/07/2026 | APPROVED |
| GA-14 | Como reverter?                         | Rollback por fase, sem remoção legada                     | Restore/forward fix          | Perda de dados                  | Operação               | Arquitetura + DBA/Operação         | APPROVED | Aprovação da recomendação técnica documentada | Declaração humana desta execução | 29/07/2026 | APPROVED |
| GA-15 | Como provar zero grants?               | Checks de contagem, diff e deny-by-default                | Revisão manual apenas        | Acesso indevido                 | Segurança              | Segurança + Arquitetura            | APPROVED | Aprovação da recomendação técnica documentada | Declaração humana desta execução | 29/07/2026 | APPROVED |

## Resultado

GA-01..GA-15 estão `APPROVED`, sem condições bloqueadoras. Esta homologação aprova o desenho, mas não
inicia a ETP-015.3, não cria migration e não ativa autorização funcional.

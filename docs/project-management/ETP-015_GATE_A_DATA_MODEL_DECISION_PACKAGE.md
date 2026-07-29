# ETP-015 Gate A — Capability Catalog and Assignments Data Model

## Estado

**PENDING HUMAN APPROVAL.** Este pacote fecha as alternativas técnicas necessárias para homologar o
Gate A. Não aprova decisões, não inicia a ETP-015.3 e não autoriza migration ou mudança funcional.

## Objetivo e referências

Homologar o modelo exato de catálogo e assignments antes da ETP-015.3. O pacote deriva da
[especificação da ETP-015](ETP-015_AUTHORIZATION_FOUNDATION_AND_ENTERPRISE_ISOLATION.md), do
[technical design](../architecture/AUTHORIZATION_FOUNDATION_TECHNICAL_DESIGN.md), da
[proposta de dados](../architecture/AUTHORIZATION_DATA_MODEL_PROPOSAL.md), da
[resolução BDP-AUTH-LEGACY](BDP-AUTH-LEGACY_RESOLUTION_V1.md), da
[matriz DAL](LEGACY_API_AUTHORIZATION_DECISION_MATRIX.md), do
[ADR-007](../architecture/decisions/ADR-007-identity-authorization-context.md), da
[BDP-009 v1](BDP-009_RESOLUTION_V1.md) e do [Active Company Context](../architecture/ACTIVE_COMPANY_CONTEXT.md).

Documentos de decisão complementares: [matriz de aprovação](ETP-015_GATE_A_APPROVAL_MATRIX.md),
[blueprint de migration](ETP-015_GATE_A_MIGRATION_BLUEPRINT.md), [rollback](ETP-015_GATE_A_ROLLBACK_PLAN.md),
[questionário](ETP-015_GATE_A_HOMOLOGATION_QUESTIONNAIRE.md) e [gate técnico](ETP-015_GATE_A_TECHNICAL_RELEASE_GATE.md).

## Baseline comprovada

- `Permission(code)` é o catálogo consumido hoje; `RolePermission` associa papel e código.
- `UserCompanyRole` associa usuário, empresa e papel com `status`, `validFrom` e `validTo`.
- `ApplicationContextService` resolve códigos globais `platform.*`, empresariais e grants temporários.
- o seed cria sete papéis e dezenove códigos, mas não cria `RolePermission` nem `UserCompanyRole`;
- a janela vigente da ETP-015.2 é `[validFrom, validTo)` em UTC;
- faltam metadados de catálogo, proveniência/revogação e proteção completa contra sobreposição temporal.

## GA-01 — Estratégia Permission/Capability

| Alternativa              | Benefícios                     | Riscos e dívida                          | Código/dados/migration                         | Compatibilidade e rollback               | DAL-02/ambiguidade                           |
| ------------------------ | ------------------------------ | ---------------------------------------- | ---------------------------------------------- | ---------------------------------------- | -------------------------------------------- |
| A. `Permission` canônica | Menor mudança                  | Nome legado permanece                    | Evolução aditiva; migration necessária         | Consumidores preservados; rollback baixo | Aderente se significado for formalizado      |
| B. Nova `Capability`     | Vocabulário explícito          | Dois catálogos e sincronização           | Nova tabela, FKs e migração de consumidores    | Rollback alto; dupla fonte               | Aderente, mas grande ambiguidade transitória |
| C. Evolução por etapas   | Compatibilidade e saída futura | Adapter temporário                       | Expansão de `Permission`, API chama capability | Rollback por etapa                       | Melhor equilíbrio; ambiguidade documentada   |
| D. Catálogo externo      | Governança independente        | Disponibilidade, consistência e operação | Integração e cache novos                       | Rollback muito alto                      | Desproporcional ao monólito atual            |

**Recomendação técnica, não aprovada:** alternativa C, tratando a tabela `permissions` como catálogo
canônico na v1, mantendo IDs e códigos e usando “capability” na aplicação. Não renomear tabela, coluna
ou códigos nesta fase. Um rename físico futuro dependerá de evidência de benefício e migration própria.

## GA-02 — Campos exatos propostos para o catálogo

| Campo                     | Tipo / nulabilidade / default  | Validação e origem                                           | Mutabilidade e compatibilidade              | Índice/constraint                                            |
| ------------------------- | ------------------------------ | ------------------------------------------------------------ | ------------------------------------------- | ------------------------------------------------------------ |
| `id`                      | UUID, não nulo, gerado         | Identidade técnica                                           | Imutável; existente                         | PK                                                           |
| `code`                    | varchar(100), não nulo         | `^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$`; catálogo homologado | Imutável após uso; existente                | unique + check                                               |
| `name`                    | varchar(120), não nulo         | Nome humano não autorizador                                  | Editável; backfill pelo `code`              | nenhum                                                       |
| `description`             | varchar(500), não nulo         | Finalidade sem dado sensível                                 | Editável; amplia varchar atual              | nenhum                                                       |
| `resource`                | varchar(80), não nulo          | Segmentos anteriores à ação                                  | Imutável após ativação                      | índice composto com `action`                                 |
| `action`                  | varchar(50), não nulo          | Último segmento do código                                    | Imutável após ativação                      | unique `(resource, action)` somente se equivalência validada |
| `scope`                   | enum `PLATFORM                 | COMPANY`, não nulo                                           | Homologação; `platform.*` inicia `PLATFORM` | Mudança exige revisão                                        | índice `(scope,status)`                          |
| `riskLevel`               | enum `LOW                      | MEDIUM                                                       | HIGH                                        | CRITICAL`, não nulo                                          | Segurança                                        | Alterável com trilha de catálogo | índice opcional `(risk_level,status)` |
| `sensitivity`             | enum `STANDARD                 | SENSITIVE                                                    | RESTRICTED`, não nulo                       | Segurança/DPO                                                | Alterável com revisão                            | sem índice inicial               |
| `status`                  | enum `ACTIVE                   | DEPRECATED                                                   | RETIRED`, não nulo, `ACTIVE`                | Governança                                                   | Transição progressiva; sem reativação automática | índice `(status,scope)`          |
| `introducedAt`            | timestamptz, não nulo, `now()` | Sistema/migration                                            | Imutável                                    | nenhum                                                       |
| `deprecatedAt`            | timestamptz, nulo              | Obrigatório em `DEPRECATED/RETIRED`                          | Preenchimento único                         | check temporal                                               |
| `retiredAt`               | timestamptz, nulo              | Obrigatório em `RETIRED`                                     | Preenchimento único                         | check temporal                                               |
| `replacementCapabilityId` | UUID, nulo                     | Capability ativa substituta, sem autorreferência             | Alterável antes de retirada                 | FK RESTRICT + índice                                         |
| `metadata`                | jsonb, não nulo, `{}`          | Allowlist versionada; sem regra de acesso                    | Editável com auditoria futura               | check objeto JSON; sem GIN inicial                           |
| `createdAt`               | timestamptz, não nulo, `now()` | Sistema                                                      | Imutável; existente                         | nenhum                                                       |
| `updatedAt`               | timestamptz, não nulo          | Sistema                                                      | Automático; existente                       | nenhum                                                       |

Campos de classificação não concedem acesso. `metadata` não substitui colunas decisórias e não pode
conter PII, matriz de grants ou política executável.

## GA-03 — Taxonomia

- código canônico: `resource.action`, preservando códigos existentes com recursos compostos, como
  `payroll.review.finding.create`; o último segmento é `action` e o prefixo completo é `resource`;
- `scope`, `riskLevel`, `sensitivity` e `status`: enums PostgreSQL/Prisma fechados e versionados por migration;
- `resource` e `action`: strings controladas derivadas do código, pois o vocabulário cresce por módulo;
- metadata: JSON allowlisted e versionado apenas para atributos não decisórios;
- códigos existentes não serão renomeados; exceção fica registrada em relatório de backfill.

## GA-04 e GA-05 — Assignments

O recorte recomendado da ETP-015.3 abrange somente `RolePermission` e `UserCompanyRole`.
Grant direto e deny explícito ficam fora do escopo; substituição e emergência existentes continuam
fontes temporárias separadas e não são redesenhadas aqui.

### RolePermission

Preservar chave `(roleId, permissionId)` e acrescentar `assignedAt`, `assignedByUserId?`, `sourceType`,
`sourceId?`, `reason`, `correlationId`, `importBatchId?`, `approvedByUserId?`, `approvalReference?`,
`validFrom`, `validTo?`, `status`, `revokedAt?`, `revokedByUserId?`, `revokeReason?` e
`replacementAssignmentId?`. Como a PK atual impede histórico, a recomendação é adicionar `id` UUID
como PK e trocar a duplicidade pela proteção temporal homologada.

### UserCompanyRole

Preservar `id`, FKs e janela; acrescentar os mesmos campos de proveniência e revogação. `assignedAt`
é o instante de concessão e `validFrom` o início de eficácia. Reativação cria novo registro; registros
revogados não são apagados ou reativados.

## GA-06 — Proveniência

`sourceType` é enum `MIGRATION|ADMINISTRATION|IMPORT|SYSTEM|MANUAL`; `sourceId`, `importBatchId` e
`approvalReference` são identificadores técnicos opacos. `assignedByUserId`/`approvedByUserId` são
FKs opcionais RESTRICT e nunca recebem ator inventado.

| Origem             | Obrigatórios além dos campos comuns                                                        |
| ------------------ | ------------------------------------------------------------------------------------------ |
| migration/backfill | `sourceType=MIGRATION`, `sourceId=migration-id`, `reason=LEGACY_BACKFILL`, `correlationId` |
| seed de catálogo   | não cria assignment                                                                        |
| administração      | `assignedBy`, `reason`, `correlationId`; aprovação conforme fluxo futuro                   |
| importação         | `assignedBy`, `importBatchId`, `reason`, `correlationId`                                   |
| sistema            | `sourceId`, `reason`, `correlationId`; identidade técnica depende de etapa futura          |
| manual futura      | `assignedBy`, `reason`, `correlationId`; `approvedBy` quando política exigir               |

## GA-07 e GA-08 — Revogação e vigência

- status proposto: `ACTIVE|REVOKED|EXPIRED`; `INACTIVE` legado é mapeado conforme evidência, nunca ativado;
- revogação exige `revokedAt`, `revokedByUserId` quando humana, `revokeReason` e correlação;
- expiração deriva de `validTo`, sem reescrever histórico; materialização de `EXPIRED` é opcional futura;
- substituição usa `replacementAssignmentId`, sem apagar o predecessor;
- reativação do mesmo registro é proibida; cria-se novo assignment;
- janela UTC é `[validFrom, validTo)`, `validTo > validFrom`; `null` representa fim aberto;
- revogação antecipada torna ineficaz a partir de `revokedAt`, ainda que `validTo` seja posterior.

## GA-09 — Unicidade temporal

Para `UserCompanyRole`, o banco deve impedir sobreposição não revogada para
`(userId, companyId, roleId)` usando `tstzrange(valid_from, valid_to, '[)')` e exclusion constraint
GiST, após habilitar `btree_gist`. Para `RolePermission`, aplicar a mesma regra a
`(roleId, permissionId)`. Índice unique simples não cobre intervalos; índice parcial sozinho não
resolve concorrência. A aplicação valida para mensagem útil, mas o banco é a autoridade concorrente.
Revogados permanecem históricos e são excluídos do predicado de eficácia. Duplicatas exatas são
subconjunto da sobreposição. Registros futuros também participam da constraint.

## GA-10 e GA-11 — Constraints e índices propostos

| Estrutura            | Regra                                                                            | Objetivo / impacto / risco                                       |
| -------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `permissions`        | PK `id`; unique `code`; FK replacement RESTRICT                                  | Identidade e compatibilidade; baixo risco aditivo                |
| `permissions`        | checks código, status/datas, replacement diferente                               | Coerência; validação prévia obrigatória                          |
| `permissions`        | `(scope,status)`, `(resource,action)`                                            | Resolução/governança; pequeno custo de escrita                   |
| `role_permissions`   | PK `id`; FKs RESTRICT                                                            | Preserva histórico; exige migração da PK atual                   |
| `role_permissions`   | checks janela/revogação/origem                                                   | Coerência; risco médio por backfill                              |
| `role_permissions`   | GiST exclusion temporal                                                          | Evita sobreposição concorrente; requer extensão e lock planejado |
| `role_permissions`   | `(role_id,status,valid_from,valid_to)` e `permission_id`                         | Resolução eficiente; custo moderado                              |
| `user_company_roles` | FKs atuais RESTRICT                                                              | Evita apagar evidência                                           |
| `user_company_roles` | checks janela/revogação/origem                                                   | Coerência; risco médio por legado                                |
| `user_company_roles` | GiST exclusion temporal                                                          | Unicidade real; substitui unique parcial insuficiente            |
| `user_company_roles` | preservar índices de resolução; adicionar `(user_id,status,valid_from,valid_to)` | Contexto ativo; custo moderado                                   |

Constraints novas entram `NOT VALID` quando PostgreSQL permitir, são verificadas após backfill e só
depois validadas. Nenhum `CASCADE` é permitido em assignments históricos.

## GA-12 — Backfill

1. inventariar contagens, códigos consumidores, duplicatas e intervalos;
2. preservar IDs/códigos de `Permission`; derivar resource/action; preencher nome/descrição sem renomear;
3. classificar scope: somente `platform.*` como `PLATFORM`; demais `COMPANY`; risco/sensibilidade exigem matriz homologada;
4. converter `RolePermission` atual para registros com ID e `sourceType=MIGRATION`, sem criar novas linhas;
5. completar `UserCompanyRole` com marcador `LEGACY_BACKFILL`; não inventar ator, aprovação ou motivo humano;
6. isolar conflitos em relatório e interromper, nunca escolher vencedor automaticamente;
7. comparar antes/depois: IDs, códigos, vínculos e conjunto efetivo por fixtures; validar zero ampliação;
8. validar constraints e registrar evidência reproduzível.

Origem não comprovável usa somente marcadores técnicos `MIGRATION`/`LEGACY_BACKFILL`, com campos de
ator/aprovador nulos. Roles existentes são preservadas; nenhum vínculo novo é inferido.

## GA-13 e GA-14 — Rollout e rollback

Rollout proposto: expansão aditiva; metadados nulos/transitórios; backfill; validação; leitura sombra;
comparação; resolvedor futuro sob flag; migração por família; retirada posterior. Migration não ativa
guard, resolvedor ou autorização. O rollback detalhado está no documento próprio e proíbe remoção de
estrutura legada na primeira migration.

## GA-15 — Zero assignments automáticos

É obrigatório comprovar que migration/seed não criam `RolePermission` ou `UserCompanyRole`, backfill
não aumenta acesso, ausência nega, nenhuma role recebe tudo, nenhum usuário recebe role por inferência
e nome de role nunca concede capability. Checks automatizados devem comparar contagens/chaves antes e
depois, inspecionar seed/migration e testar deny-by-default com catálogo ou assignment ausente.

## Recomendação e decisão humana necessária

A recomendação é **C**, com migration aditiva e controlada após GA-01..GA-15 serem homologadas. Os
aprovadores humanos devem preencher a matriz/questionário. Até então, Gate A permanece pendente e a
ETP-015.3 permanece `NOT STARTED`.

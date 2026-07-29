# Capability Catalog and Assignments

## Estado

**ETP-015.3 — IN PROGRESS.** Esta fundação interna implementa o catálogo homologado e assignments
históricos. Ela não adiciona rota, guard, decorator, UI, grant automático nem enforcement em nova
superfície.

## Catálogo canônico

`Permission` preserva `id` e `code` e passa a registrar nome, descrição, recurso, ação, escopo,
risco, sensibilidade, ciclo de vida, substituição e metadata. Os 19 códigos de PC-01..PC-19 são a
allowlist da migration e do seed. `platform.read` e `platform.manage` possuem escopo `PLATFORM`; os
demais possuem escopo `COMPANY`.

PC-20 e PC-21 são fail-closed: upgrade com código extra, ausente, duplicado ou não classificado é
bloqueado antes do backfill. Banco limpo pode permanecer sem catálogo até o seed homologado. Código
futuro exige classificação humana anterior; nome, verbo ou papel nunca geram classificação.

## Assignments

`RolePermission` e `UserCompanyRole` possuem:

- identidade própria e preservação histórica;
- proveniência (`sourceType`, `sourceId`, razão, correlação, lote, ator e aprovação);
- janela UTC semiaberta `[validFrom, validTo)`;
- estados `ACTIVE`, `REVOKED` e `EXPIRED`, preservando `INACTIVE` somente para compatibilidade legada;
- revogação lógica e referência opcional ao assignment substituto;
- FKs `RESTRICT`, checks de coerência, índices de resolução e exclusion constraints GiST.

A exclusion constraint impede janelas `ACTIVE` sobrepostas para o mesmo papel/capability ou
usuário/empresa/papel, inclusive sob concorrência. Reativação cria novo registro; eventos históricos
não são apagados. A camada interna `AssignmentGovernanceService` exige proveniência, grava a decisão e
o `AuditLog` na mesma transação. Nenhum controller a expõe nesta etapa.

## Compatibilidade e backfill

A migration `0016_capability_catalog_assignments`:

1. valida o inventário existente antes de escrever;
2. enriquece os 19 códigos sem mudar IDs ou códigos;
3. enriquece apenas relações já existentes com `MIGRATION` e `LEGACY_BACKFILL`;
4. não inventa ator ou aprovador;
5. não insere `RolePermission`, `UserCompanyRole`, grant ou associação;
6. substitui a unicidade parcial pela garantia temporal na mesma migration.

O seed cria ou atualiza somente os sete papéis e as 19 capabilities homologadas. Contagens de
assignments devem permanecer zero em banco limpo.

## Leitura compatível

Os resolvedores existentes continuam sendo a autoridade. Eles filtram catálogo e assignments ativos
e vigentes, o que preserva os acessos existentes e impede que registros revogados, expirados ou
futuros sejam efetivos. Nenhuma rota nova é protegida ou migrada pela ETP-015.3.

## Evidências e riscos residuais

- testes unitários: catálogo, proveniência, vigência, revogação, auditoria e rollback transacional;
- testes PostgreSQL 16: clean install, upgrade, seed, checks, FKs, sobreposição concorrente e histórico;
- testes estáticos: conjunto homologado, PC-20/PC-21 e zero assignments no seed/migration;
- risco operacional: `btree_gist`, troca da PK de `RolePermission` e locks exigem janela controlada;
- risco funcional: ativação de guards e migração de endpoints pertencem à ETP-015.4 ou posterior.

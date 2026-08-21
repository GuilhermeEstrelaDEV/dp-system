# Capability Catalog and Assignments

## Estado

**Estado atual:** a fundação histórica da ETP-015.3 permanece preservada e a Full Delivery P3
expande controladamente o catálogo para 43 capabilities. O seed canônico continua sem grant
automático.

## Catálogo canônico

`Permission` preserva `id` e `code` e registra nome, descrição, recurso, ação, escopo, risco,
sensibilidade, ciclo de vida, substituição e metadata. Os 19 códigos de PC-01..PC-19 continuam sendo
a allowlist imutável da migration `0016`. O seed adiciona dez códigos P1 aprovados, sem alterar os
19 existentes: `company.read/manage`, `employee.read/manage`, `contract.read/manage`,
`payroll.parameter.read/manage` e `payroll.rubric.read/manage`. `platform.read` e `platform.manage`
possuem escopo `PLATFORM`; os outros 41 possuem escopo `COMPANY`. A P2 adiciona os pares
`organization.read/manage`, `admission.read/manage`, `leave.read/manage` e
`variable_compensation.read/manage`. A P3 adiciona `time.read/manage`, `benefit.read/manage` e
`vacation.read/manage`, sem alterar código ou semântica dos 37 anteriores.

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

O seed cria ou atualiza somente os sete papéis e as 43 capabilities aprovadas. Contagens de
assignments permanecem zero em banco limpo. Os acréscimos P2 e P3 são catalog-only e não requerem migration,
pois `Permission` já suporta a classificação aprovada.

## Acesso demonstrativo P3

`demo:access:grant` concede temporariamente as capabilities aprovadas do MVP essencial, da P1, os
oito códigos P2 e os seis códigos P3
somente ao papel fictício `ADMINISTRATOR`. Esse mecanismo não usa o seed canônico: a origem é
`MANUAL`, a validade máxima é oito horas, operações são idempotentes, revogáveis e auditadas. A
conta `HR` não recebe esses assignments e permanece controle negativo.

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

### Gate operacional antes do deploy

A revisão técnica do PR #61 validou o fluxo em PostgreSQL 16 local, mas isso não substitui a
aprovação do ambiente de destino. DBA/Operação deve registrar, antes do merge/deploy:

- disponibilidade e privilégio para `CREATE EXTENSION btree_gist` em cada ambiente gerenciado;
- volume real de `permissions`, `role_permissions` e `user_company_roles`, janela e timeout para os
  locks de `ALTER TABLE`, troca da PK, FKs, índices e exclusion constraints;
- backup recuperável, teste de restore, observação de locks/replica lag e procedimento de abortar;
- compatibilidade do rollout com instâncias antigas e execução transacional do rollback com
  `ON_ERROR_STOP` quando suas precondições permitirem;
- ensaio no ambiente representativo e evidência de duração. O rollback bloqueia se assignments ou
  histórico posteriores à migration puderem ser perdidos e nunca remove a extensão compartilhada.

Sem essas evidências, a liberação operacional permanece bloqueada, embora os testes locais estejam
aprovados.

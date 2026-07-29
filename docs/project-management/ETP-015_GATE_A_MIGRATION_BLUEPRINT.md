# ETP-015 Gate A — Migration Blueprint

## Estado e limites

**PROPOSAL — NOT AUTHORIZED.** Nenhuma migration foi criada. Este blueprint somente torna a futura
alteração revisável; não ativa autorização nem concede acesso.

## Estruturas afetadas

- evolução aditiva inicial: `permissions`, `role_permissions`, `user_company_roles` e enums associados;
- preservadas: `roles`, `user_roles`, códigos existentes, consumidores e grants temporários;
- fora do escopo: grant direto, deny explícito, UI administrativa e migração de endpoints.

## Sequência proposta

### M1 — Expansão reversível

1. habilitar `btree_gist` somente após validação operacional;
2. criar enums de catálogo, origem e assignment sem alterar defaults funcionais;
3. adicionar colunas novas como nullable ou com default técnico seguro;
4. adicionar `id` UUID em `role_permissions`, mantendo a PK composta durante a transição;
5. adicionar FKs `NOT VALID` quando suportado e índices não exclusivos;
6. não criar, copiar ou associar capability a qualquer papel/usuário.

### M2 — Backfill idempotente

- preservar IDs/códigos e preencher catálogo conforme tabela homologada;
- atribuir `MIGRATION`/`LEGACY_BACKFILL` somente a linhas existentes;
- não preencher ator/aprovador desconhecido;
- gerar relatório de conflitos e falhar diante de sobreposição/duplicidade não resolvida;
- registrar contagens e hashes/chaves antes e depois.

### M3 — Validação e constraints

- validar nulabilidade e checks;
- criar exclusion constraints GiST para janelas não revogadas;
- promover `role_permissions.id` a PK somente após todas as FKs/consumidores serem validados;
- remover o unique parcial atual de `user_company_roles` somente na mesma transação em que a garantia
  temporal substituta ficar ativa;
- validar plano de lock e janela operacional em PostgreSQL 16.

### M4 — Leitura compatível futura

Não pertence à migration: leitura sombra compara resolvedor atual e projeção nova. Ativação requer PR
funcional separado, feature flag, testes negativos e Gate A aprovado.

## Backfill detalhado

| Fonte           | Transformação permitida                                         | Proibição                          | Evidência               |
| --------------- | --------------------------------------------------------------- | ---------------------------------- | ----------------------- |
| Permission      | manter ID/code; derivar resource/action; classificar com matriz | renomear ou criar grant            | inventário antes/depois |
| Role            | nenhuma alteração funcional                                     | inferir acesso pelo nome           | contagem/hash           |
| RolePermission  | somente enriquecer linhas existentes                            | inserir novos pares                | conjunto de pares igual |
| UserCompanyRole | enriquecer linhas existentes                                    | criar vínculo ou escolher vencedor | conjunto de IDs igual   |

Dados sem origem comprovada usam `sourceType=MIGRATION`, `sourceId` da migration e razão técnica
`LEGACY_BACKFILL`. Conflitos são bloqueadores, não corrigidos automaticamente.

## Constraints e índices candidatos

- checks: formato do código; coerência status/datas; `validTo > validFrom`; revogação completa;
- FKs: todas `RESTRICT` para evidências; replacement não pode apontar para si;
- unique: `permissions.code`; não impor `(resource,action)` até validar os códigos compostos;
- GiST exclusion: pares de assignment + `tstzrange(..., '[)')`, somente não revogados;
- B-tree: caminhos de resolução ativa e lookup das FKs;
- criação concorrente de índices apenas fora de transação e conforme ferramenta de deploy permitir.

## Verificações obrigatórias

- migrations em PostgreSQL 16 limpo e fixture de upgrade;
- seed resulta em zero `RolePermission` e zero `UserCompanyRole` novos;
- pares e vínculos antes/depois são idênticos;
- conjunto efetivo do resolvedor legado não aumenta;
- duplicidade/sobreposição concorrente falha no banco;
- expiração, revogação, futuro e `[validFrom,validTo)` testados;
- Prisma generate/validate, rollback ensaiado e plano de forward fix documentado.

## Critério para autorização

M1–M3 só podem ser implementadas depois de GA-01..GA-15 aprovadas, riscos de lock aceitos e
[release gate](ETP-015_GATE_A_TECHNICAL_RELEASE_GATE.md) marcado por aprovadores humanos.

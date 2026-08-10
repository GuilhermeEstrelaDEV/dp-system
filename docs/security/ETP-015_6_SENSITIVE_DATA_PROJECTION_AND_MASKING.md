# ETP-015.6 — Sensitive Data Projection and Masking

**Status:** `IMPLEMENTED — APPROVED MINIMAL DATA PROJECTION AVAILABLE`

## Resultado

A etapa implementa literalmente as 110 decisões `FC-001..FC-110` homologadas em
[ETP-015_6_HUMAN_APPROVAL_RECORD.md](ETP-015_6_HUMAN_APPROVAL_RECORD.md). As 33 rotas canônicas das
cinco famílias retornam apenas o perfil `MINIMAL`; campos não aprovados são omitidos na origem e não
existe perfil `FULL`.

| Família            |    Decisões | Rotas | Política de cache                                 |
| ------------------ | ----------: | ----: | ------------------------------------------------- |
| Auth/context       | FC-001..019 |     5 | CP-01/02, sessão local saneada                    |
| Grants/assignments | FC-020..035 |     6 | CP-03, sem cache de resposta                      |
| Dashboard          | FC-036..052 |     1 | CP-04, empresa + ator + recurso + perfil          |
| Payroll review     | FC-053..080 |    14 | CP-05, empresa + ator + recurso + perfil          |
| Payroll periods    | FC-081..110 |     7 | CP-06, empresa + ator + período + versão + perfil |

O catálogo executável fica em
`apps/api/src/modules/auth/approved-minimal-projection.catalog.ts`; o verificador exige 110 IDs
únicos, 33 rotas únicas, perfil `MINIMAL`, masking `NONE` e catálogo de auditoria com 27 eventos.

## Limites preservados

- os 129 handlers `LEGACY_DEFERRED` não foram alterados;
- BDP-001 e BDP-011 continuam pendentes;
- nenhuma migration, alteração Prisma, seed, capability, grant ou assignment foi criada;
- nenhum dado é inferido, mascarado ou substituído por placeholder;
- nenhum nome de papel concede acesso;
- isolamento empresarial, deny-by-default e semântica 401/403/404 permanecem vigentes;
- ETP-015.8, ETP-015.9 e ETP-015.10 permanecem `NOT STARTED`.

## Implementação

Presenters explícitos impedem retorno cru do Prisma. A autenticação omite contexto técnico; grants
omitem justificativas e autoria; dashboard exige `platform.read`; review omite textos livres e
identidades; readiness, histórico, manifesto, close e reopen omitem conteúdo, atores, trace e totais
não homologados. O frontend mantém somente os mesmos campos e limpa o cache ao trocar empresa,
identidade ou após mutações.

## Auditoria sensível

Somente AR-03 foi ativado: `ACCESS_GRANTS_VIEWED`. Cada leitura bem-sucedida das listas de
substituição ou acesso emergencial grava um evento com empresa, ator, trace, capability efetiva,
tipo do grant e perfil `MINIMAL`. Falha na escrita impede resposta bem-sucedida. AR-01, AR-02 e
AR-04..AR-10 continuam não ativados.

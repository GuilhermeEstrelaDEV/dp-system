# ETP-015.4 — Inventário de classificação de rotas

**Base:** `develop@e3a8feb7e3c1c1aba10623b2770bc41b9e516809`

**Data:** 31/07/2026

**Natureza:** descoberta anterior à implementação dos guards

**Escopo:** 26 controllers e 165 handlers NestJS

## Resultado quantitativo

| Classificação inicial  |      Handlers | Decisão nesta etapa                                                     |
| ---------------------- | ------------: | ----------------------------------------------------------------------- |
| `PUBLIC_EXPLICIT`      |             4 | classificar nominalmente e manter em allowlist mínima                   |
| `AUTHENTICATED`        |             5 | aplicar metadata canônica; quatro rotas de sessão e dashboard           |
| `CAPABILITY_PROTECTED` |            27 | preservar os guards e capabilities já existentes                        |
| `LEGACY_DEFERRED`      |           129 | preservar comportamento, registrar nominalmente e não declarar proteção |
| `INTERNAL_TECHNICAL`   |             0 | nenhuma rota de controller em produção recebeu esta classificação       |
| `BLOCKED_UNCLASSIFIED` | 0 na baseline | qualquer handler novo fora das listas deve falhar fechado               |

O [inventário legado completo](../architecture/LEGACY_API_AUTHORIZATION_ROUTE_INVENTORY.md) registra
individualmente os 163 handlers da baseline anterior. A diferença atual é composta por
`POST /auth/logout` e `GET /dashboard/summary`. As 129 linhas sem proteção canônica continuam
identificadas pelo arquivo, controller e handler naquela matriz e herdam, para esta etapa, os campos:

- classificação: `LEGACY_DEFERRED`;
- autenticação atual: ausente;
- empresa ativa: não estabelecida canonicamente;
- capability: não homologada para ativação nesta entrega;
- público legítimo: não;
- legado: sim;
- estado de migração: adiado para a etapa posterior da família (ETP-015.8/015.9);
- risco: o risco do perfil registrado na matriz histórica;
- decisão: compatibilidade nominal, sem falsa proteção e sem migração funcional.

## Allowlist pública explícita

| Módulo | Controller#handler           | Verbo e rota        | Motivo                                           | Empresa | Capability | Risco                                      |
| ------ | ---------------------------- | ------------------- | ------------------------------------------------ | ------- | ---------- | ------------------------------------------ |
| auth   | `AuthController#login`       | `POST /auth/login`  | emissão de identidade mediante credencial válida | não     | não        | alto; rate limit e sanitização preservados |
| health | `HealthController#check`     | `GET /health`       | diagnóstico técnico local                        | não     | não        | baixo                                      |
| health | `HealthController#liveness`  | `GET /health/live`  | liveness técnico                                 | não     | não        | baixo                                      |
| health | `HealthController#readiness` | `GET /health/ready` | readiness técnico sem segredo                    | não     | não        | baixo                                      |

Swagger/OpenAPI não é handler de controller. `/api/docs` e `/api/docs-json` permanecem superfícies
técnicas condicionadas a `SWAGGER_ENABLED`; não existe wildcard público nem liberação por prefixo.

## Rotas autenticadas canônicas

| Módulo    | Controller#handler             | Verbo e rota             | Empresa ativa                   | Capability                      | Decisão                         |
| --------- | ------------------------------ | ------------------------ | ------------------------------- | ------------------------------- | ------------------------------- |
| auth      | `AuthController#me`            | `GET /auth/me`           | não                             | não                             | `AUTHENTICATED`                 |
| auth      | `AuthController#companies`     | `GET /auth/companies`    | não                             | não                             | `AUTHENTICATED`                 |
| auth      | `AuthController#selectCompany` | `POST /auth/context`     | seleção validada no caso de uso | não                             | `AUTHENTICATED`                 |
| auth      | `AuthController#logout`        | `POST /auth/logout`      | não                             | não                             | `AUTHENTICATED`                 |
| dashboard | `DashboardController#summary`  | `GET /dashboard/summary` | sim                             | projeção interna por capability | `AUTHENTICATED` + empresa ativa |

Ausência ou invalidade de identidade retorna `401`. Ausência, conflito ou invalidade do vínculo
empresarial em rota que exige empresa retorna a negação homologada sem confiar em `companyId` livre.

## Rotas já protegidas por capability

| Controller                 | Handlers | Capability(s)                                                       | Empresa ativa | Decisão                 |
| -------------------------- | -------: | ------------------------------------------------------------------- | ------------- | ----------------------- |
| `AccessGrantsController`   |        6 | `delegation.manage`, `emergency_access.manage`                      | sim           | preservar e classificar |
| `PayrollReviewsController` |       14 | família `payroll.review.*`                                          | sim           | preservar e classificar |
| `PayrollPeriodsController` |        7 | `payroll.period.close.readiness`, `.history`, `.execute`, `.reopen` | sim           | preservar e classificar |

As 27 rotas exigem todas as capabilities declaradas (`ALL`), JWT e empresa ativa. Não existe
semântica `ANY`, inferência por papel, e-mail, controller, modo demo ou prefixo.

## Compatibilidade e bloqueio

A compatibilidade será uma lista imutável de pares `Controller#handler`, não um wildcard por rota ou
controller. Um handler legado listado mantém o comportamento anterior, continua sem homologação de
segurança e não é contabilizado como migrado. Um handler sem metadata canônica e ausente dessa lista
recebe `BLOCKED_UNCLASSIFIED`, não executa o caso de uso e produz apenas diagnóstico sanitizado.

## Estado de migração

- handlers canônicos classificados nesta entrega: 36 (4 públicos, 5 autenticados e 27 com capability);
- handlers legados adiados: 129;
- famílias de negócio migradas nesta entrega: 0;
- endpoints novos: 0;
- migrations ou alterações Prisma: 0.

O inventário executável e os testes de reconciliação são a autoridade para impedir divergência futura
entre esta fotografia, os controllers e a classificação em runtime.

A ETP-015.5 não altera esta classificação nem a contagem de handlers. Ela aplica isolamento às
superfícies canônicas selecionadas; os 129 handlers acima continuam `LEGACY_DEFERRED` e não são
declarados seguros por essa fundação.

A ETP-015.7 também não altera rotas ou classificações. Os 36 handlers canônicos continuam sob as
mesmas políticas; seus produtores de escrita crítica passam a usar o catálogo e writer atômico. Os
129 handlers legados não recebem cobertura implícita de auditoria.

## Reconciliação da implementação ETP-015.6

A implementação da projeção MINIMAL aprovada não altera a classificação de rotas nem as contagens de
handlers. Seu manifesto fechado cobre 33 endpoints canônicos de auth/context, grants, dashboard,
payroll review e payroll periods; todos continuam usando as políticas de JWT, empresa ativa e
capability registradas aqui. Os 129 handlers `LEGACY_DEFERRED` permanecem inalterados, e nenhum perfil
ou lista de campos fornecido pelo cliente pode ampliar uma resposta.

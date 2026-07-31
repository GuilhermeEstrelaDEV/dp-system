# ETP-015.4 — Allowlist pública

## Handlers públicos

| Handler                      | Verbo e rota               | Justificativa                          | Controle preservado                     |
| ---------------------------- | -------------------------- | -------------------------------------- | --------------------------------------- |
| `AuthController#login`       | `POST /api/v1/auth/login`  | obter identidade com credencial válida | rate limit, auditoria e sanitização     |
| `HealthController#check`     | `GET /api/v1/health`       | diagnóstico local agregado             | resposta técnica mínima                 |
| `HealthController#liveness`  | `GET /api/v1/health/live`  | liveness                               | `SkipThrottle`, sem dado de negócio     |
| `HealthController#readiness` | `GET /api/v1/health/ready` | readiness do banco                     | falha sanitizada, sem connection string |

A implementação compara o par exato `Controller#handler`; não há wildcard, prefixo, ambiente, e-mail,
papel ou modo demo capaz de tornar rota pública.

## Superfícies técnicas fora dos controllers

`/api/docs` e `/api/docs-json` são middlewares do Swagger e só existem quando `SWAGGER_ENABLED` está
ativo. A exposição é técnica e configurável, não uma inferência de `@PublicRoute`. Não foram
identificados assets, webhooks ou callbacks públicos na API.

## Regra de alteração

Nova entrada exige decisão explícita, atualização deste documento e do manifesto, teste sem token e
revisão de dados expostos. Na dúvida, a rota permanece bloqueada.

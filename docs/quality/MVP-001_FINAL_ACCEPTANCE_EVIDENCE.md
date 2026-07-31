# MVP-001.8 — Evidência de aceite final

**Estado:** `IMPLEMENTED — PROTOTYPE STABILIZED`

**Baseline inicial:** `ac225cf8ffd6946f3518f9eaea8e8cc6cf258c1a`
**Data:** 31/07/2026

## Evidências

- reset confirmado recriou PostgreSQL 16 e aplicou 16 migrations em banco limpo;
- seeds canônico e demo concluíram com duas empresas, dois usuários, três vínculos e zero grants;
- `demo:data:verify`, `demo:verify -- --report`, `demo:rehearse`, stop/start e status aprovaram;
- fluxo real validou Admin/Horizonte/Atlas, RH/Horizonte, dashboard restrito, 403, logout e 401;
- ensaio de 30 minutos concluiu sete checkpoints sem 5xx, restart ou degradação funcional;
- Edge foi inspecionado em 1024, 1280, 1366, 1440 e 1920 px, com zoom 100/125/150%;
- lint, typecheck, testes, coverage, build, Prisma generate/validate, Prettier e diff check aprovaram;
- cobertura: API 70,34% linhas/69,75% branches; web 77,50% linhas/74,15% branches;
- logs após o roteiro contêm somente rejeições esperadas em `warn`, com `correlationId`;
- migrations, schema, seed, endpoints, DTOs, grants e capabilities não foram alterados.

## Decisão

Não há falha P0/P1 aberta. MVP-001.8 está estabilizada e libera somente a MVP-001.9 documental de
apresentação. O protótipo completo continua `IN PROGRESS` até esse pacote; ETP-015.4 continua
`NOT STARTED`.

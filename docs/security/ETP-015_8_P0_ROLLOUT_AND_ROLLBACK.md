# ETP-015.8 — P0 Rollout and Rollback

## Rollout controlado

1. validar contrato, OpenAPI, matriz negativa e consumidor interno;
2. aplicar o adapter aos quatro aliases como uma única família P0;
3. confirmar 16 migrations e catálogos inalterados;
4. executar PostgreSQL 16 limpo, concorrência e replay;
5. observar telemetria local segura;
6. submeter evidências a Segurança, Produto e DP;
7. somente após aprovação e merge avaliar uma janela posterior.

Não há deploy de produção nesta etapa. O frontend interno migra diretamente às URIs canônicas; aliases
continuam disponíveis para consumidores potenciais.

## Rollback permitido

O rollback pode restaurar presenter/envelope ou uma versão anterior do adapter desde que permaneçam:

- JWT e deny-by-default;
- empresa ativa e `404` cross-company;
- capability por operação;
- projeção `MINIMAL`;
- delegação exclusiva aos mesmos serviços canônicos;
- telemetria sanitizada e depreciação.

## Rollback proibido

É proibido restaurar o `PayrollClosuresService` com Prisma/regra própria, confiar em `companyId` do
cliente, sintetizar evidência, auto-acknowledge, remover autenticação ou reexpor raw entities. Não há
downgrade de banco porque esta entrega não possui migration.

## Evidência do ensaio

Testes caracterizam que erros canônicos são propagados sem fallback e que a indisponibilidade do
logger não interfere na operação. Os testes PostgreSQL executam alias e canônico simultaneamente com
o mesmo lock/key; há um resultado e um replay, sem fechamento/reabertura duplicados. O rollback é,
portanto, de código do adapter, não de dados ou controles de segurança.

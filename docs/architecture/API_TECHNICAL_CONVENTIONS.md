# Convenções Técnicas da API

## Endereçamento

Endpoints usam `/api/v1`. Swagger é opcional por `SWAGGER_ENABLED` e fica em `/api/docs`; o documento OpenAPI JSON fica em `/api/docs-json`.

## Contratos HTTP

Sucesso: `data` e `meta`. Erro: `error` e `meta`. Todo `meta` possui `correlationId`, `timestamp` e `path`. O header `x-correlation-id` é aceito somente em formato limitado e seguro; valores inválidos recebem um identificador novo.

## Saúde e segurança

`/health/live` não acessa banco. `/health/ready` verifica Prisma e retorna 503 quando indisponível. Helmet, CORS, limite de body e rate limit em memória são globais. Health é isento de rate limit; ambientes com múltiplas instâncias precisarão de armazenamento distribuído.

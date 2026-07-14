# ADR-005 — Serviços técnicos da plataforma

**Status:** Aceita

## Decisão

Centralizar bootstrap em app factory reutilizável, adotar `/api/v1`, contratos HTTP com correlation ID, health separado em liveness/readiness, Helmet, CORS configurável e rate limit em memória.

## Consequências

Swagger é configurável e não anuncia autenticação inexistente. Logs evitam dados sensíveis e stack traces ficam restritos ao desenvolvimento. O rate limit atual não é distribuído e deverá evoluir antes de múltiplas réplicas.

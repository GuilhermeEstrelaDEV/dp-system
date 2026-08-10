# ETP-015.6 — Rollout and Rollback

## Rollout

1. validar catálogo FC e manifesto das 33 rotas;
2. executar lint, typecheck, testes, cobertura e build;
3. validar OpenAPI e respostas negativas;
4. executar a demonstração local com PostgreSQL 16;
5. liberar as cinco famílias juntas, pois a allowlist já é o contrato aprovado;
6. observar 401/403/404, falhas AR-03 e erros de desserialização do frontend.

## Rollback

Rollback é exclusivamente de aplicação. Não há migration, backfill nem alteração persistida. A
reversão restaura o código anterior, limpa caches de cliente e reinicia API/web. Eventos AR-03 já
gravados permanecem append-only e não são removidos.

Rollback não pode remover JWT, empresa ativa, isolamento, deny-by-default, guards nem auditoria
existente. Os 129 handlers legados permanecem adiados em ambos os sentidos.

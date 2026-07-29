# ETP-015.3 — Ambiente local do ensaio

**Execução técnica:** Codex, 29/07/2026, ambiente descartável local. Sem aprovação humana.

- Docker Engine 29.6.1; imagem `postgres:16-alpine`, image ID sanitizado terminado em `07777`;
- PostgreSQL 16.14, x86_64, Alpine; usuário técnico do ensaio `postgres`;
- Docker: 12 CPUs, 8.131.919.872 bytes de memória; host C: 721.758.601.216 bytes livres;
- storage Docker `overlayfs`; `statement_timeout=0`, `lock_timeout=0`;
- sem réplica (`replica lag: NOT APPLICABLE`) e sem topologia multi-instância representativa;
- antes da 0016: `plpgsql` e `pgcrypto`; `btree_gist` ausente;
- depois: `btree_gist` 1.7; segunda criação retornou aviso idempotente;
- usuário restrito isolado falhou com `permission denied`/necessidade de `CREATE` no database.

Limitação: configuração local não representa provedor, volume, privilégios, timeout, réplica ou janela
de qualquer ambiente de destino.

# ETP-015.7 — Evidências de aceite

**Status:** evidência técnica local preparada para revisão

## Entrega

- catálogo fechado v1 com 26 códigos;
- envelope tipado e contexto efetivo imutável;
- writer único com atomicidade obrigatória para escritas críticas;
- sanitizer deny-by-default com allowlist por evento e limites estruturais;
- AST verifier e manifesto explícito de sete produtores;
- uso de grant incorporado ao evento crítico, sem evento separado no guard;
- mapas estáticos nos eventos de payroll review;
- zero migration, zero capability, zero endpoint e zero frontend.

## Evidências automatizadas

| Evidência                             | Resultado                                            |
| ------------------------------------- | ---------------------------------------------------- |
| catálogo, imutabilidade e comprimento | aprovado                                             |
| contexto efetivo e grants             | aprovado                                             |
| metadata proibida/oversized/deep      | aprovado                                             |
| atomicidade e rollback                | aprovado                                             |
| manifesto e escrita única             | aprovado                                             |
| regressão payroll review/period       | aprovado                                             |
| PostgreSQL 16 real                    | 2 testes aprovados; fixtures revertidas              |
| `pnpm check`                          | aprovado                                             |
| cobertura                             | API 73,62% linhas/72,01% branches; web 77,50%/74,15% |

As seis suítes PostgreSQL foram executadas em bases isoladas para evitar colisão entre fixtures
históricas de IDs fixos: **25 testes de banco aprovados**. A regressão sem banco executou 333 testes
de API; portanto, o conjunto validado soma 358 testes de API, além da suíte de frontend e dos 28
testes operacionais do demo/presentation.

## Performance local

Ensaio em PostgreSQL 16 local, com `EXPLAIN (ANALYZE, BUFFERS)` dentro de transação revertida:

| Medida                                                          |       Resultado local |
| --------------------------------------------------------------- | --------------------: |
| insert canônico com FKs e índices                               |              0,893 ms |
| update mínimo + insert crítico no mesmo statement/commit lógico |              1,376 ms |
| eventos preexistentes na base demo                              |                   124 |
| metadata dos eventos preexistentes                              | ausente; média 0 byte |
| metadata do envelope canônico de amostra                        |             228 bytes |
| consulta recente por empresa, 126 linhas no plano               |              0,126 ms |

O planner escolheu sequential scan no conjunto diminuto, apesar do índice existente por empresa e
instante. Isso não evidencia necessidade de índice ou migration. As métricas são baseline local, não
SLO nem homologação de produção.

## Limitações e riscos aceitos

- append-only no banco depende de privilégios; a aplicação e o verifier proíbem update/delete;
- consulta administrativa e retenção aguardam iniciativa aprovada;
- leituras sensíveis aguardam ETP-015.6 e BDP-001/011;
- 129 handlers legados continuam fora da cobertura declarada;
- métricas locais não equivalem a homologação de ambiente-alvo.

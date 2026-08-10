# ETP-015.8 — P0 Acceptance Evidence

**Baseline:** `origin/develop@437bdc35cb5c6dc8d050a7b2eef22eb9b24c6ec0`

**Status:** `IMPLEMENTED IN PR — GATE C HUMAN APPROVAL PENDING`

## Diff controlado

- quatro handlers convertidos de `LEGACY_DEFERRED` para `CAPABILITY_PROTECTED`;
- contagem: 4 public, 5 authenticated, 31 capability, 125 deferred, 165 total;
- 19 capabilities, zero nova, zero grant/assignment;
- 27 audit events, zero novo;
- 16 migrations, schema/seed/migrations inalterados;
- nenhuma rota removida, nenhum perfil `FULL`, masking, ETP-015.9/015.10 ou deploy.

## Evidências funcionais e de segurança

- unit: controller, adapter, history company lookup e telemetry sanitizer;
- HTTP E2E: matriz 401/403/404/sucesso para os quatro aliases e DTO fail-closed;
- frontend: capability visual, readiness, run/ack/key explícitos, close/reopen canônicos;
- PostgreSQL: fechamento, reabertura, append-only, atomicidade, replay e concorrência alias/canônico;
- OpenAPI: bearer, capabilities, depreciação, contratos reais e códigos de erro.

## Validação final

- `pnpm check`: aprovado, incluindo lint, typecheck, testes, build e Prisma validate;
- API: 79 suítes e 371 testes aprovados; 6 suítes e 27 testes PostgreSQL condicionais ficam omitidos
  quando `TEST_DATABASE_URL` não está definido;
- frontend: 22 arquivos e 80 testes aprovados;
- scripts de readiness/apresentação: 28 testes aprovados;
- cobertura API: 74,86% de linhas, 72,21% de branches, 51,69% de funções e 74,86% de statements;
- cobertura frontend: 78,43% de linhas, 74,58% de branches, 63,91% de funções e 78,43% de statements;
- PostgreSQL 16 limpo: 16/16 migrations, seed e 3 suítes/16 testes P0 aprovados em duas execuções,
  cobrindo close, reopen, append-only, concorrência, replay idempotente e rollback transacional;
- Prisma Client gerado e schema validado, sem diff em schema, migration ou seed;
- ambiente demonstrativo: `status`, `data:verify`, `verify` e `rehearse` aprovados com `DEMO STATUS: GO`;
- apresentação: 15 slides e 15 notas validados, sem placeholder, segredo, dado pessoal ou URL externa.

A evidência não converte o Gate C em aprovado: a revisão humana permanece pendente.

## Performance

O microbenchmark local aqueceu cada caminho por 100 iterações e mediu 1.000 iterações. Os tempos
acumulados foram: history canônico 15,83 ms e adapter 39,49 ms; close canônico 31,08 ms e adapter
26,16 ms; reopen canônico 18,15 ms e adapter 12,58 ms. A variação de JIT torna os valores adequados
somente para detectar regressão estrutural, não para estimar latência de rede ou banco.

Cada operação do adapter realizou exatamente uma chamada ao serviço canônico e zero query adicional.
Os payloads serializados mediram 314/352 bytes para history canônico/adapter, 44/44 bytes para close e
42/42 bytes para reopen. Não foi identificado N+1 e nenhum índice ou migration foi criado.

# ETP-015.6 — Acceptance Evidence

**Estado:** `IMPLEMENTED — APPROVED MINIMAL DATA PROJECTION AVAILABLE`

## Escopo comprovado

- 110/110 decisões FC implementadas sem reinterpretação;
- 33/33 rotas canônicas inventariadas;
- cinco famílias cobertas;
- um único perfil `MINIMAL`;
- zero regras de masking;
- AR-03 ativo e catálogo com 27 eventos;
- CP-01..CP-06 aplicadas;
- OpenAPI alinhado às respostas mínimas;
- frontend sem persistência técnica e com cache segmentado;
- 129 handlers `LEGACY_DEFERRED` preservados.

## Evidências

As evidências executáveis estão nos testes dos presenters, verificador, serviços de autenticação,
grants, dashboard, review, payroll periods e frontend. A validação final deve registrar `pnpm check`,
testes, cobertura, build, Prisma, demonstração local e `git diff --check` no PR da etapa.

## Validação final — 2026-08-10

- `pnpm check`: aprovado após os últimos ajustes;
- API: 74 suítes e 344 testes aprovados; 6 suítes e 25 testes PostgreSQL condicionais permanecem
  fora do run padrão e foram executados separadamente nos gates abaixo;
- frontend: 22 arquivos e 80 testes aprovados;
- scripts de demonstração/apresentação: 28 testes aprovados;
- cobertura API: 73,73% de linhas/statements, 71,91% de branches e 50,23% de functions;
- cobertura frontend: 77,80% de linhas/statements, 73,91% de branches e 62,37% de functions;
- PostgreSQL 16 limpo com 16 migrations e seed: 3 suítes/11 testes de catálogo, auditoria e
  isolamento aprovados;
- repetição PostgreSQL de AR-03: 1 suíte/5 testes aprovados;
- PostgreSQL 16 limpo sem seed: 3 suítes/14 testes de persistência, fechamento e reabertura
  aprovados;
- HTTP E2E e presenters críticos: 5 suítes/21 testes aprovados;
- OpenAPI: 33/33 endpoints canônicos presentes, zero parâmetro de projeção controlado pelo cliente,
  zero campo bloqueado nos schemas de resposta e zero schema amplo com `additionalProperties`;
- demonstração: status `GO`, integridade de dados `OK`, verificação `GO`, rehearsal `GO` e pacote de
  apresentação válido;
- Prisma Client gerado e schema validado; migrations, schema e seed sem diff;
- segurança: zero segredo, PII real, `any`, TODO/FIXME crítico ou artefato temporário no diff.

## Evidência de projeção e desempenho

- `/auth/me`: 333 bytes e 25,43 ms no ensaio local final; shape restrito a `actorId`,
  `activeCompanyId`, `permissions`, `email` e `displayName`;
- tentativas `profile=FULL`, `fields=*` e `X-Projection-Profile: FULL`: resposta idêntica ao
  `MINIMAL`; campo extra em body validado foi rejeitado com HTTP 400;
- dashboard sem `platform.read`: 318 bytes e 20,63 ms, com apenas contexto e estado `RESTRICTED`;
- descrições de métricas do dashboard: `STATIC/CONTROLLED`; descrição de atividade permanece
  omitida;
- grants usam uma leitura com select explícito de 8 campos para substituição e 7 para acesso
  emergencial, seguida por um único AR-03 por request bem-sucedido; CP-03 permanece `NO CACHE`;
- nenhuma medição privilegiada de grants/review/period foi forçada no dataset demonstrativo, para
  preservar zero grants e zero assignments automáticos.

## Ajustes conclusivos da retomada

- acknowledgements públicos de período receberam DTO OpenAPI fechado para código, instante e
  booleano, sem ator, motivo ou metadata;
- estados de eventos de payroll review passaram a allowlist fail-closed de `status`, `severity`,
  `blocking` e `validApprovals`, impedindo que chaves futuras não homologadas sejam serializadas.

## Exclusões confirmadas

Não houve migration, alteração Prisma, seed, nova capability, grant automático, assignment automático,
perfil `FULL`, ativação de AR-01/02/04..10 ou início da ETP-015.8.

## Próximo gate

Após revisão e merge desta entrega, o próximo recorte permitido é ETP-015.8 — Payroll Closure P0
Migration. BDP-001 e BDP-011 continuam pendentes para exposições futuras.

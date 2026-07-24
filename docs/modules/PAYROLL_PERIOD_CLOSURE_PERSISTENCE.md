# Persistência e auditoria do fechamento de competência

**ETP:** 014 — Fase 3  
**Status:** `COMPLETED` após merge do PR #44
**Migration:** `0015_payroll_period_closure_persistence`

## Objetivo e limites

Esta fundação fornece persistência versionada, evidência imutável, idempotência e composição
transacional para comandos futuros. Ela não fecha nem reabre competências, não cria endpoint público,
não altera o endpoint de readiness, não adapta o legado e não disponibiliza frontend.

`PayrollPeriod` permanece a raiz canônica. A tabela legada `payroll_period_closures` continua sendo
histórico das operações antigas e não foi reinterpretada. O agregado novo usa o nome explícito
`PayrollPeriodClosureVersion`, evitando quebrar consumidores ou duplicar regras do readiness.

## Modelos

`PayrollPeriodClosureVersion` representa uma versão operacional com empresa, competência, versão
numérica, status, execução, review/rodada, token observado, versão otimista, predecessor, ator e
timestamps. Os estados persistíveis são `OPEN`, `CLOSING`, `CLOSED` e `REOPENING`; `READY` continua
dinâmico. Um índice parcial permite somente uma versão não superada por empresa/competência, e um
trigger valida todo o escopo empresa–competência–execução–review–predecessor.

As evidências são:

- `PayrollPeriodClosureManifest`: payload canônico, hash e versão do algoritmo;
- `PayrollPeriodClosureEvent`: catálogo homologado e contexto técnico do ator;
- `PayrollPeriodClosureWarningAcknowledgement`: reconhecimento por warning e versão;
- `PayrollPeriodClosureIdempotency`: reserva empresa + competência + operação + hash da chave.

Triggers PostgreSQL recusam `UPDATE` e `DELETE` em manifesto, evento e acknowledgement. A
idempotência só transita de `IN_PROGRESS` para `COMPLETED` ou `FAILED`; escopo, chave e fingerprint
são imutáveis, registros finalizados não podem mudar e nenhum registro pode ser excluído. Não há
expiração automática, pois retenção e BDP-011 continuam pendentes.

## Manifesto e hash

O builder tipado produz `schemaVersion: 1.0` e inclui somente IDs, referências seguras, totais
textuais, estados, warnings, contexto mínimo do ator e timestamps. Não inclui nome, documento,
e-mail, cálculo detalhado ou headers completos.

A canonicalização ordena recursivamente chaves e listas semanticamente tratadas como conjuntos. O
JSON canônico em UTF-8 recebe SHA-256 hexadecimal, versão `sha256-canonical-json-v1`. Mesmo conteúdo
lógico gera o mesmo hash; mudanças de valor ou schema alteram o hash.

## Eventos disponíveis

- `PERIOD_READINESS_EVALUATED`
- `PERIOD_CLOSURE_STARTED`
- `PERIOD_CLOSED`
- `PERIOD_REOPENING_STARTED`
- `PERIOD_REOPENED`
- `CLOSURE_EVIDENCE_INVALIDATED`
- `VARIABLE_PAY_WARNING_ACKNOWLEDGED`

Consultas normais de readiness continuam sem evento ou `AuditLog`. O primeiro evento só é persistido
quando uma versão é explicitamente materializada pelo serviço interno.

## Serviços internos e atomicidade

`PayrollPeriodClosureRepository` cria e consulta versões, acrescenta evidências, reserva/finaliza
idempotência e atualiza com versão esperada. `PayrollPeriodClosurePersistenceService` deriva a empresa
do principal, aplica capability antes do acesso, valida token/vínculos e compõe versão, manifesto,
evento, acknowledgements e `AuditLog` no mesmo `Prisma.TransactionClient`. Falhas são propagadas para
rollback integral. A atualização otimista condiciona e incrementa `optimisticVersion` atomicamente.

Não há advisory lock nem `SELECT FOR UPDATE`; lock e revalidação operacional pertencem à Fase 4.

## Capabilities

O seed contém as cinco capabilities homologadas, sem associação a papéis:

- `payroll.period.close.view`
- `payroll.period.close.readiness`
- `payroll.period.close.execute`
- `payroll.period.close.reopen`
- `payroll.period.close.history`

As três capabilities novas não ativam endpoint nesta fase.

## Testes e próximas fases

Testes unitários cobrem canonicalização, hash, minimização, idempotência, versão otimista, escopo,
transação e falhas. Testes em PostgreSQL 16 cobrem unicidades, índice ativo, escopo, append-only,
idempotência finalizada e rollback conjunto de evento e `AuditLog`.

A Fase 4 reexecuta readiness dentro da transação, aplica advisory transaction lock e habilita o
[comando canônico](PAYROLL_PERIOD_OPERATIONAL_CLOSURE.md).
A Fase 5 implementa a reabertura e a superação/ligação das versões usando integralmente a migration 0015. Manifestos, eventos e acknowledgements permanecem append-only; não foi necessária migration 0016.

# Reabertura controlada de competência

**ETP:** 014 — Fase 5  
**Status:** `COMPLETED`

**Decisão:** BDP-014 `APPROVED — VERSION 1`

## Contrato canônico

`POST /api/v1/payroll-periods/:payrollPeriodId/reopen` é a única rota pública de reabertura. A URI
legada foi preservada, mas seu comportamento foi substituído pelo contrato canônico: JWT, empresa
ativa, capability `payroll.period.close.reopen`, `Idempotency-Key`, `reason`,
`expectedConsistencyToken` e `expectedClosureVersion` são obrigatórios. Consumidores do DTO antigo
devem migrar; não há fallback para o fluxo anterior.

O controller apenas valida o contrato e delega ao serviço. Recursos de outra empresa retornam `404`
e a autorização permanece deny-by-default. A capability não é associada automaticamente a papéis.

## Transação e histórico

Uma transação PostgreSQL reserva a idempotência, adquire advisory transaction lock por
empresa/competência, recarrega o agregado e valida token, versão, estado `CLOSED`, manifesto e evento
`PERIOD_CLOSED`. A versão fechada transita temporariamente para `REOPENING`, recebe
`PERIOD_REOPENING_STARTED` e `CLOSURE_EVIDENCE_INVALIDATED`, volta a representar historicamente o
fechamento e é marcada como superada. Uma nova versão `OPEN` é criada com predecessor explícito e
sem execução ou review reutilizados. O período passa a `OPEN`; `PERIOD_REOPENED`, `AuditLog` e a
conclusão idempotente são gravados na mesma transação.

Nenhum manifesto, evento ou acknowledgement anterior é atualizado ou removido. A invalidação é
operacional: as evidências continuam íntegres para auditoria, mas não podem sustentar novo fechamento.
Falhas provocam rollback integral, sem estado `REOPENING` residual.

## Readiness posterior

A política única de readiness ignora execuções com sequência menor ou igual à execução ligada ao
predecessor. Até uma nova execução e um novo ciclo de conferência completos existirem, ela retorna
blockers. A consulta continua somente leitura e não reabre automaticamente o review anterior.

## Concorrência e idempotência

O operation type persistido é `REOPEN`. A mesma chave e payload retorna replay `200` sem duplicar
versão, eventos ou auditoria; fingerprint diferente e operação em andamento retornam conflito. Chaves
diferentes são serializadas pelo mesmo lock utilizado no fechamento. A primeira execução retorna
`201`.

## Limites

Não há frontend, histórico público completo, manifesto público, scheduler, integração externa ou
adaptação de outras rotas legadas. Nenhuma migration foi criada: a migration 0015 representa todas as
invariantes necessárias.

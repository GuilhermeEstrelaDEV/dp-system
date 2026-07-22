# Readiness de fechamento de competência

**ETP:** 014 — Fase 2  
**Status:** `READY FOR REVIEW`  
**Natureza:** consulta somente leitura

## Contrato HTTP

`GET /api/v1/payroll-periods/:payrollPeriodId/closure-readiness?payrollRunId=:runId`

A rota exige JWT, empresa ativa e a capability empresarial
`payroll.period.close.readiness`. O identificador da empresa nunca é recebido do cliente. Uma
competência inexistente ou pertencente a outra empresa retorna `404`.

`payrollRunId` é opcional. Quando informado, a execução é avaliada explicitamente. Sem ele, o
backend seleciona somente a execução `COMPLETED` de maior sequência quando ela é inequívoca. Um
empate na maior sequência produz `PAYROLL_RUN_AMBIGUOUS`; uma execução anterior nunca se torna
canônica quando há uma posterior válida.

A resposta tipada contém:

- competência, empresa, referência, estado observado e instante da avaliação;
- execução selecionada e ciclo de conferência vinculado, por referências seguras;
- `isReady`, blockers, warnings e acknowledgements futuros exigidos;
- `consistencyToken`, derivado de `PayrollPeriod.updatedAt`, sem inventar versão otimista;
- `traceId` do principal autenticado;
- `unavailableWarningChecks`, para fontes ainda inexistentes.

Não são expostos dados pessoais de colaboradores.

## Blockers estáveis v1

- `PERIOD_ALREADY_CLOSED`
- `CLOSURE_IN_PROGRESS`
- `PAYROLL_RUN_NOT_FOUND`
- `PAYROLL_RUN_NOT_COMPLETED`
- `PAYROLL_RUN_NOT_CANONICAL`
- `PAYROLL_RUN_CANCELLED_OR_INVALIDATED`
- `PAYROLL_RUN_AMBIGUOUS`
- `REVIEW_CYCLE_NOT_FOUND`
- `REVIEW_CYCLE_RUN_MISMATCH`
- `REVIEW_CYCLE_NOT_CLOSED`
- `REVIEW_ROUND_OUTDATED`
- `REVIEW_DECISIONS_INVALID`
- `OPEN_BLOCKING_FINDINGS`
- `COMPANY_PERIOD_RUN_REVIEW_MISMATCH`
- `REQUIRED_TOTALS_UNAVAILABLE`
- `CONCURRENT_OPERATION_DETECTED`

O catálogo é estável, mas um código somente é emitido quando existe fonte real. O modelo atual não
persiste fechamento em andamento, cancelamento/invalidação de execução ou versão otimista. Assim,
`CLOSURE_IN_PROGRESS` não é inferido artificialmente; uma execução visivelmente `RUNNING` é
reportada como operação concorrente. O estado atual da execução e erros bloqueantes observáveis são
avaliados sem alterar dados.

## Review elegível

O ciclo deve pertencer à mesma empresa, competência e execução, estar `CLOSED`, referenciar a rodada
vigente, possuir decisões finais válidas, não ter reabertura posterior e não conter achado `BLOCKING`
aberto. Decisões invalidadas sem substituição e divergências de escopo tornam a resposta não pronta.

## Warnings v1

- `VARIABLE_PAY_PENDING`
- `EXTERNAL_INTEGRATIONS_PENDING`
- `NON_CRITICAL_OPERATIONAL_ALERTS`
- `AUXILIARY_INFORMATION_INCOMPLETE`

Pendências reais de eventos de remuneração variável, adiantamentos ou pagamentos fora de ciclo são
emitidas como `VARIABLE_PAY_PENDING`, exigindo reconhecimento futuro e sem bloquear por si só. Os
alertas operacionais não críticos e informações auxiliares incompletas usam fontes atuais da execução.

Não existe fonte persistente para integrações externas nesta fase. Por isso,
`EXTERNAL_INTEGRATIONS_PENDING` aparece em `unavailableWarningChecks`, não como warning simulado.
Nenhuma pendência é movida, excluída ou submetida a alçada.

## Ausência de efeitos colaterais

A aplicação executa exclusivamente `findFirst` e `count`. Não abre transação de fechamento, não usa
lock, não escreve `PayrollPeriod`, `PayrollRun`, `PayrollReviewCycle`, achados, decisões, eventos ou
`AuditLog`, e não persiste `READY`. As duas capabilities da fase são apenas cadastradas no catálogo;
nenhuma é associada automaticamente a papel.

Não há migration, entidade, manifesto, hash, chave idempotente, endpoint de fechamento, reabertura,
histórico, adaptação do legado ou frontend neste incremento.

## Exemplo seguro

```json
{
  "payrollPeriodId": "11111111-1111-4111-8111-111111111111",
  "companyId": "22222222-2222-4222-8222-222222222222",
  "referenceDate": "2026-07-01T00:00:00.000Z",
  "currentStatus": "OPEN",
  "isReady": true,
  "evaluatedAt": "2026-07-22T12:00:00.000Z",
  "selectedPayrollRun": {
    "id": "33333333-3333-4333-8333-333333333333",
    "sequence": 2,
    "status": "COMPLETED"
  },
  "linkedReviewCycle": {
    "id": "44444444-4444-4444-8444-444444444444",
    "round": 1,
    "status": "CLOSED"
  },
  "blockers": [],
  "warnings": [],
  "acknowledgementsRequired": [],
  "consistencyToken": "2026-07-22T11:59:00.000Z",
  "traceId": "trace-safe-example",
  "unavailableWarningChecks": ["EXTERNAL_INTEGRATIONS_PENDING"]
}
```

## Testes

Os testes de domínio cobrem o catálogo, seleção explícita/automática, ambiguidade, evidência obsoleta,
review, blockers, warnings e determinismo. Os testes de aplicação cobrem isolamento empresarial,
`404`, deny-by-default, resposta e ausência de métodos de escrita. O teste de controller valida a
capability e a operação OpenAPI.

## Gate seguinte

A Fase 2 permanece `READY FOR REVIEW` até revisão e merge. A Fase 3 continua `NOT STARTED` e não pode
usar esta consulta como autorização para persistência ou fechamento.

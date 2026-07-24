# Histórico público de fechamento de competência

**ETP:** 014 — Fase 6  
**Status:** `COMPLETED`

Quatro endpoints somente leitura expõem versões, detalhes, eventos e uma projeção segura do manifesto:

- `GET /api/v1/payroll-periods/:payrollPeriodId/history`;
- `GET /api/v1/payroll-periods/:payrollPeriodId/history/:closureVersion`;
- `GET /api/v1/payroll-periods/:payrollPeriodId/history/:closureVersion/events`;
- `GET /api/v1/payroll-periods/:payrollPeriodId/history/:closureVersion/manifest`.

Todos exigem JWT, empresa ativa e `payroll.period.close.history`, aplicam deny-by-default e retornam
`404` entre empresas. As consultas não criam auditoria nem alteram evidências.

O histórico ordena versões e eventos, identifica predecessor, sucessor e versão ativa e apresenta
ator, execução, review e resumo criptográfico. O manifesto público usa allowlist: schema, resumo,
warnings, acknowledgements, totais e referências seguras. Payload bruto, sessão, headers, tokens,
contexto interno e PII desnecessária não são retornados.

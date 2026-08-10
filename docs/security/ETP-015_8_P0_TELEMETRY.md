# ETP-015.8 — P0 Safe Telemetry

`PayrollClosureLegacyTelemetryService` emite um registro local por uso do alias com allowlist fechada:

- `routeTemplate`;
- `method`;
- `operationAlias` (`LIST`, `DETAIL`, `CLOSE`, `REOPEN`);
- `resultClass` (`SUCCESS`, `HTTP_4XX`, `HTTP_5XX` ou `UNEXPECTED_ERROR`);
- `correlationId` já sanitizado pela política vigente;
- `adapterVersion` (`p0-v1`);
- `deprecation` (`true`).

São proibidos body, query integral, headers, token, cookie, reason, conteúdo de acknowledgement,
valores financeiros, IDs de recurso, resposta, nome/e-mail de ator e PII. Exceções são reduzidas à
classe HTTP; mensagem e stack não são emitidas.

O logger é observabilidade não crítica e não substitui `AuditLog`. Falha de logging é absorvida sem
alterar resultado ou transação de domínio. Mutações continuam auditadas somente pelo writer canônico.
Os testes cobrem sucesso, erro e falha do logger e inspecionam as chaves emitidas.

Esta telemetria serve para medir uso residual antes de comunicação e janela de remoção. Não integra
fornecedor externo, cloud ou produção nesta entrega.

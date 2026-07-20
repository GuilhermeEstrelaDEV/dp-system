# Fundação de folha de pagamento

## Escopo da ETP-010

Esta etapa entrega uma fundação técnica configurável para competências, rubricas, parâmetros, lançamentos, execuções e fechamentos. A interface em `/folha` é demonstrativa e identifica explicitamente que não representa uma folha homologada.

Valores monetários são persistidos com `Decimal` no domínio e trafegam como texto decimal nas APIs. Competências fechadas e seus registros históricos permanecem imutáveis; reaberturas exigem justificativa e preservam o histórico.

## Fora de escopo

Não há cálculo de INSS, FGTS, IRRF, encargos, faixas, alíquotas, deduções, guias, integração eSocial ou qualquer alegação de conformidade legal. Parâmetros e incidências são somente configurações técnicas versionadas, sem valores oficiais.

## Rotas

- `/folha/competencias`
- `/folha/rubricas`
- `/folha/parametros`
- `/folha/lancamentos`
- `/folha/execucoes`
- `/folha/fechamentos`

## Garantias técnicas

- UUIDs, timestamps, FKs restritivas, índices e vigências temporais no schema Prisma;
- histórico sem exclusão física para execuções e fechamentos;
- idempotência de lançamentos por chave de origem e competência;
- bloqueio de alterações em competência fechada na API;
- mensagens técnicas de aviso e erro bloqueante no processamento demonstrativo.

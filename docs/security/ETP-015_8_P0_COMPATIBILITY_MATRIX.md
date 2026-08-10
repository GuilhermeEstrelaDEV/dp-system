# ETP-015.8 — P0 Compatibility Matrix

## Contrato deliberadamente preservado ou restringido

| Operação | Compatibilidade segura                                   | Enforcement deliberado                                                       |
| -------- | -------------------------------------------------------- | ---------------------------------------------------------------------------- |
| list     | URI, envelope `items/pagination`, ordenação por versão   | `payrollPeriodId` agora obrigatório; sem scan global ou tabela legada        |
| detail   | URI e UUID legado quando ele é o UUID da versão canônica | `404` para ID ausente/estrangeiro; somente `MINIMAL`                         |
| close    | URI e `reason → note`                                    | exige run, token, acknowledgements e key; não escolhe ou sintetiza evidência |
| reopen   | URI e `reason`                                           | exige token, versão e key; sem reabertura da review                          |

## Shapes canônicos exigidos

Close requer `payrollPeriodId`, `payrollRunId`, `expectedConsistencyToken`,
`warningAcknowledgements`, `Idempotency-Key` e, quando usado, `expectedClosureVersion`. Reopen requer
`reason`, `expectedConsistencyToken`, `expectedClosureVersion` e `Idempotency-Key`.

Requests antigos incompletos falham com erro contratual sanitizado e não executam o serviço anterior.
Não são gerados no servidor: run, token, versão, acknowledgement ou key. Não existe fallback.

## Códigos HTTP

- `400`: UUID, header ou DTO inválido;
- `401`: identidade ausente/inválida;
- `403`: empresa ativa/capability ausente;
- `404`: recurso ausente ou de outra empresa;
- `409`: estado, consistência, versão, concorrência ou idempotência conflitante;
- `422`: readiness ou acknowledgement não atendido;
- `200`: consulta ou replay idempotente;
- `201`: primeira mutação concluída.

As rotas têm `Deprecation: true` e `deprecated: true` no OpenAPI, sem redirecionamento, `410` ou data
de remoção inventada.

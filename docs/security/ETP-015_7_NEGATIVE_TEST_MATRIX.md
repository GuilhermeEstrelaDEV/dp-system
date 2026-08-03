# ETP-015.7 — Matriz negativa

| Cenário                                          | Resultado esperado                           | Evidência                                  |
| ------------------------------------------------ | -------------------------------------------- | ------------------------------------------ |
| código ausente do catálogo                       | runtime e verifier falham                    | catálogo/verifier specs                    |
| código montado livremente                        | verifier AST falha                           | `authorization-audit-verifier.spec.ts`     |
| escrita direta em `AuditLog`                     | verifier AST falha                           | `authorization-audit-verifier.spec.ts`     |
| update/delete de `AuditLog`                      | verifier AST falha                           | `authorization-audit-verifier.spec.ts`     |
| evento crítico sem transaction client            | erro antes do insert                         | `audit-writer.service.spec.ts`             |
| ator, sessão ou correlation ID vazio             | falha fechada antes do insert                | `audit-writer.service.spec.ts`             |
| recurso vazio                                    | falha fechada antes do insert                | `audit-writer.service.spec.ts`             |
| falha do evento crítico                          | mutação inteira faz rollback                 | `authorization-audit.postgres.e2e-spec.ts` |
| metadata fora da allowlist                       | `400`, sem redaction                         | sanitizer/writer specs                     |
| chave sensível aninhada                          | `400`                                        | `audit-metadata-sanitizer.spec.ts`         |
| profundidade, tamanho ou cardinalidade excessiva | `400`                                        | `audit-metadata-sanitizer.spec.ts`         |
| decisão sem capability                           | `403`                                        | `effective-authorization-context.spec.ts`  |
| decisão sem empresa ativa                        | `403`                                        | `effective-authorization-context.spec.ts`  |
| scope e principal divergentes                    | falha fechada                                | writer e isolamento empresarial            |
| capability declarada diverge da decisão efetiva  | falha fechada                                | `audit-writer.service.spec.ts`             |
| grant declarado diverge dos grants efetivos      | falha fechada                                | `audit-writer.service.spec.ts`             |
| grant usado                                      | IDs capturados da decisão já resolvida       | context/writer + PostgreSQL                |
| lookup cross-tenant                              | `404` uniforme, sem ID estrangeiro em audit  | suíte ETP-015.5 reexecutada                |
| approve/reject/close/reopen                      | evento e decisão no mesmo commit             | suítes payroll review/period               |
| replay idempotente de fechamento                 | sem segunda transição                        | suítes de fechamento existentes            |
| `401`/`403`/`404` comum                          | sem evento persistente de alta cardinalidade | desenho + testes HTTP existentes           |

## Critério de bloqueio

Qualquer falha na matriz impede o merge. Não é permitido tornar auditoria best-effort para recuperar
uma escrita crítica. Leituras sensíveis sem classificação material permanecem desativadas.

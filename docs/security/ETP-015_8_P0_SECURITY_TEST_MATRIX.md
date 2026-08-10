# ETP-015.8 — P0 Security Test Matrix

| Controle                                       | Evidência automatizada                            | Resultado |
| ---------------------------------------------- | ------------------------------------------------- | --------- |
| políticas/capabilities dos quatro handlers     | `payroll-closures.controller.spec.ts`             | PASS      |
| bearer, depreciação, schemas e erros OpenAPI   | `payroll-closures.controller.spec.ts`             | PASS      |
| 401/403/404/sucesso em quatro aliases          | `payroll-closure-p0.e2e-spec.ts`                  | PASS      |
| duas empresas e lookup company-scoped          | E2E P0 + `payroll-period-history.service.spec.ts` | PASS      |
| delegação única, principal, key e payload      | `payroll-closures.service.spec.ts`                | PASS      |
| sem fallback e propagação de erros             | `payroll-closures.service.spec.ts`                | PASS      |
| projeção MINIMAL/ausência de campos bloqueados | HTTP E2E e histórico canônico                     | PASS      |
| telemetria sem body/query/token/PII            | telemetry spec                                    | PASS      |
| falha do logger não afeta domínio              | telemetry spec                                    | PASS      |
| lock/replay/different keys                     | suítes PostgreSQL canônicas                       | PASS      |
| alias + canônico concorrentes                  | suítes operational closure/reopening PostgreSQL   | PASS      |
| manifest/event/AuditLog atômicos               | suíte PostgreSQL de fechamento                    | PASS      |
| append-only                                    | suítes PostgreSQL de persistence/closure          | PASS      |
| CLOSED sem bypass                              | regressão canônica de período/folha               | PASS      |
| frontend usa readiness e evidência explícita   | `payroll-closures.test.tsx`                       | PASS      |
| rota frontend sem `platform.manage` bypass     | router + teste de capability                      | PASS      |

Nenhuma autorização por nome de papel, empresa do request, perfil `FULL`, masking novo ou evento de
leitura foi introduzido.

# ETP-015.7 — Inventário de cobertura de auditoria

## Produtores canônicos

| Produtor                                  | Operações | Evento atômico | Contexto                                      | Situação   |
| ----------------------------------------- | --------: | -------------- | --------------------------------------------- | ---------- |
| `AuthController`                          |         3 | não crítico    | principal/sessão                              | catalogado |
| `AssignmentGovernanceService`             |         4 | sim            | principal; `EnterpriseScope` nas empresariais | catalogado |
| `AccessGrantsService`                     |         6 | sim            | principal + `EnterpriseScope` + decisão       | catalogado |
| `PayrollReviewsService`                   |        10 | sim            | principal + escopo empresarial do agregado    | revalidado |
| `PayrollPeriodClosurePersistenceService`  |         1 | sim            | principal + `PayrollPeriod` filtrado          | revalidado |
| `PayrollPeriodOperationalClosureService`  |         1 | sim            | principal + scope canônico da competência     | revalidado |
| `PayrollPeriodControlledReopeningService` |         1 | sim            | principal + scope canônico da competência     | revalidado |

Total runtime após ETP-015.6: **27 códigos**, **7 arquivos produtores**, **1 writer** e **0 escritas diretas adicionais em
`AuditLog`**.

## Consumidores e verificadores

- Persistência: tabela existente `audit_logs` via `AuditWriterService`.
- Correlação: `traceId`, `sessionId`, `actorUserId`, `companyId`, recurso e instante.
- Verificação estática: AST + manifesto em `AuthorizationAuditVerifierService`.
- Consulta administrativa: não existe e permanece fora do escopo.
- Exportação, retenção, SIEM e integrações externas: não iniciadas.

## Revalidação de fluxos existentes

Payroll review mantém evento de domínio append-only e `AuditLog` no mesmo transaction client. Os
dois códigos anteriormente montados por interpolação foram substituídos por mapas fechados.
Fechamento e reabertura mantêm advisory lock, optimistic version, idempotência, hash e histórico no
mesmo commit da auditoria. Não houve reescrita dos agregados nem duplicação de eventos.

## Leituras sensíveis

Cobertura ativada na ETP-015.7: **0**. A ETP-015.6 ativou exclusivamente AR-03 para as duas listas de
grants; AR-01/02/04..10 permanecem inativos. A marcação de sensitivity no catálogo de capability não decide
quais campos são materialmente sensíveis nem autoriza retenção de acesso. Todas as leituras ficam
deferidas para ETP-015.6, condicionadas a DAL-06 e às decisões ainda pendentes BDP-001/011.

## Fora do recorte

- 129 handlers `LEGACY_DEFERRED`;
- endpoints novos ou consulta pública/administrativa de auditoria;
- projeção e masking;
- mudança de schema, índice ou trigger;
- eventos para cada `401`, `403` ou `404`;
- rollout de fechamento legado da ETP-015.8.

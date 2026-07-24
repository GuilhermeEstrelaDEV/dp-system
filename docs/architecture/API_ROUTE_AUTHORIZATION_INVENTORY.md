# Inventário de autorização das rotas

## Classificação atual

| Controller/família    | Rotas                                                                | Classificação             | Estado                                                                   |
| --------------------- | -------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------ |
| Health                | `/health`, `/health/live`, `/health/ready`                           | Pública                   | Mantida pública para operação                                            |
| Auth login            | `POST /auth/login`                                                   | Pública                   | Rate limit; credenciais validadas                                        |
| Auth bootstrap        | `GET /auth/me`, `GET /auth/companies`, `POST /auth/context`          | Autenticada               | JWT; seleção valida assignment                                           |
| Access grants         | seis rotas sob `/access-grants`                                      | Autenticada e empresarial | JWT, capability e validação no serviço                                   |
| Swagger               | `/api/docs`, `/api/docs-json`                                        | Pública/configurável      | Somente quando habilitado                                                |
| Companies             | todas sob `/companies`                                               | Ainda legada              | Sem migração neste incremento                                            |
| Organização           | todas sob `/branches`, `/departments`, `/positions`, `/cost-centers` | Ainda legada              | Recebem companyId do cliente                                             |
| Employees/contracts   | todas sob `/employees`, `/employment-contracts`                      | Ainda legada              | Exige desenho de visibilidade sensível                                   |
| Admission             | `/admission-processes`, checklists e documentos                      | Ainda legada              | Exige capabilities homologadas                                           |
| Time management       | jornadas, feriados, marcações e saldos                               | Ainda legada              | Exige inventário por operação                                            |
| Benefits              | todas sob `/benefits`                                                | Ainda legada              | Exige visibilidade por capability                                        |
| Vacations/leaves      | férias, afastamentos e tipos                                         | Ainda legada              | Exige migração por caso de uso                                           |
| Payroll readiness     | `GET /payroll-periods/:payrollPeriodId/closure-readiness`            | Autenticada e empresarial | JWT, capability, serviço e `404`                                         |
| Payroll period close  | `POST /payroll-periods/:payrollPeriodId/close`                       | Autenticada e empresarial | JWT, `payroll.period.close.execute`, empresa ativa, idempotência e `404` |
| Payroll configuration | demais rotas de competências, rubricas e parâmetros                  | Ainda legada              | Não migrada para evitar quebra                                           |
| Payroll operation     | lançamentos, execuções e fechamentos                                 | Ainda legada              | Prioridade para fase do workflow                                         |
| Payroll review        | quatorze rotas incluindo fechamento, reabertura e histórico          | Autenticada e empresarial | JWT, capability, policy e `404`                                          |
| Variable compensation | todas sob `/variable-compensation`                                   | Ainda legada              | BDP-006 continua pendente                                                |

Não há rota administrativa da plataforma protegida nesta fase; capabilities globais continuam disponíveis apenas como fundação.

## ETP-014 Fase 3

A persistência de fechamento permanece exclusivamente interna. Nenhuma rota pública de `close`,
`reopen`, `history`, manifesto ou acknowledgement foi adicionada. As rotas homônimas existentes em
`payroll-periods` e `payroll-closures` continuam classificadas como legado e não foram adaptadas. As
capabilities `execute`, `reopen` e `history` estão apenas no catálogo, sem assignments.

## ETP-014 Fase 4

A Fase 4 tornou canônica a URI homologada `POST /payroll-periods/:payrollPeriodId/close`. Ela exige

## ETP-014 Fase 5

| Método | Rota                                       | Autenticação        | Capability                    | Isolamento            |
| ------ | ------------------------------------------ | ------------------- | ----------------------------- | --------------------- |
| POST   | `/payroll-periods/:payrollPeriodId/reopen` | JWT + empresa ativa | `payroll.period.close.reopen` | `404` fora da empresa |

A rota exige `Idempotency-Key` e DTO canônico. Não existe associação automática da capability a
papéis nem autorização por nome fixo de papel.
JWT, empresa ativa, `payroll.period.close.execute`, `Idempotency-Key`, readiness transacional e
auditoria atômica. Não foram adicionadas rotas públicas de `reopen`, `history` ou manifesto. As
demais escritas históricas, especialmente `/payroll-closures`, continuam legadas e não foram
redirecionadas. `reopen` e `history` permanecem somente no catálogo, sem assignments.

## Encerramento da ETP-013 v1

As quatorze rotas de payroll review foram revisadas em 22/07/2026. Métodos, capabilities, DTOs e consumo pelo frontend estão compatíveis. Famílias marcadas como legadas permanecem fora do encerramento e exigem migração incremental própria.

## Estratégia progressiva

1. definir capability e sensibilidade de cada caso de uso;
2. adaptar o serviço para receber principal e derivar empresa ativa;
3. filtrar lookup por empresa antes de buscar por ID;
4. aplicar `JwtAuthGuard`, `CapabilitiesGuard` e metadata explícita;
5. repetir autorização no serviço e auditar escritas na mesma transação;
6. adicionar testes `401`, `403`, `404`, multiempresa e regressão;
7. somente após todo o inventário sair de “ainda legada”, avaliar guard global.

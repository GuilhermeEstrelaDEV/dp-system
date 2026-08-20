# Inventário de autorização das rotas

## Classificação atual

| Controller/família    | Rotas                                                                | Classificação             | Estado                                                                   |
| --------------------- | -------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------ |
| Health                | `/health`, `/health/live`, `/health/ready`                           | Pública                   | Mantida pública para operação                                            |
| Auth login            | `POST /auth/login`                                                   | Pública                   | Rate limit; credenciais validadas                                        |
| Auth bootstrap        | `GET /auth/me`, `GET /auth/companies`, `POST /auth/context`          | Autenticada               | JWT; seleção valida assignment                                           |
| Dashboard executivo   | `GET /dashboard/summary`                                             | Autenticada e empresarial | JWT; empresa ativa e seções filtradas por capability                     |
| Access grants         | seis rotas sob `/access-grants`                                      | Autenticada e empresarial | JWT, capability e validação no serviço                                   |
| Swagger               | `/api/docs`, `/api/docs-json`                                        | Pública/configurável      | Somente quando habilitado                                                |
| Companies             | seis rotas sob `/companies`                                          | Autenticada e empresarial | `company.read/manage`; administração global controlada                   |
| Organização           | todas sob `/branches`, `/departments`, `/positions`, `/cost-centers` | Ainda legada              | Recebem companyId do cliente                                             |
| Employees/contracts   | 19 rotas sob `/employees`, `/employment-contracts`                   | Autenticada e empresarial | capabilities próprias, empresa ativa, projeção mínima e `404`            |
| Admission             | `/admission-processes`, checklists e documentos                      | Ainda legada              | Exige capabilities homologadas                                           |
| Time management       | jornadas, feriados, marcações e saldos                               | Ainda legada              | Exige inventário por operação                                            |
| Benefits              | todas sob `/benefits`                                                | Ainda legada              | Exige visibilidade por capability                                        |
| Vacations/leaves      | férias, afastamentos e tipos                                         | Ainda legada              | Exige migração por caso de uso                                           |
| Payroll readiness     | `GET /payroll-periods/:payrollPeriodId/closure-readiness`            | Autenticada e empresarial | JWT, capability, serviço e `404`                                         |
| Payroll period close  | `POST /payroll-periods/:payrollPeriodId/close`                       | Autenticada e empresarial | JWT, `payroll.period.close.execute`, empresa ativa, idempotência e `404` |
| Payroll configuration | oito rotas de rubricas e parâmetros                                  | Autenticada e empresarial | `payroll.parameter.*` e `payroll.rubric.*`; projeções mínimas            |
| Payroll operation P0  | quatro aliases sob `/payroll-closures`                               | Autenticada e empresarial | adapters deprecated, capabilities de history/execute/reopen e `404`      |
| Payroll operation P1+ | lançamentos, execuções e demais operações                            | Ainda legada              | fora da ETP-015.8                                                        |
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
JWT, empresa ativa, `payroll.period.close.execute`, `Idempotency-Key`, readiness transacional e
auditoria atômica. Não foram adicionadas rotas públicas de `reopen`, `history` ou manifesto. As
demais escritas históricas, especialmente `/payroll-closures`, continuam legadas e não foram
redirecionadas. `reopen` e `history` permaneciam somente no catálogo, sem assignments naquele
incremento.

## ETP-014 Fase 5

| Método | Rota                                       | Autenticação        | Capability                    | Isolamento            |
| ------ | ------------------------------------------ | ------------------- | ----------------------------- | --------------------- |
| POST   | `/payroll-periods/:payrollPeriodId/reopen` | JWT + empresa ativa | `payroll.period.close.reopen` | `404` fora da empresa |

A rota exige `Idempotency-Key` e DTO canônico. Não existe associação automática da capability a
papéis nem autorização por nome fixo de papel.

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

## ETP-014 Fase 6

A Fase 6 adicionou quatro `GET` sob `/payroll-periods/:payrollPeriodId/history`, todos protegidos por
JWT, empresa ativa e `payroll.period.close.history`, com `404` entre empresas. Nenhuma capability é
associada automaticamente a papel.

## Continuidade

O [inventário histórico](LEGACY_API_AUTHORIZATION_ROUTE_INVENTORY.md) preserva o diagnóstico de
entrada. O estado runtime atual deve ser obtido pelo verificador de classificação e pelo inventário
P1, sem reclassificar retroativamente a evidência histórica.

## ETP-015.6 — projeção de resposta

As 33 rotas canônicas de auth/contexto, grants, dashboard, payroll review e payroll periods usam o
perfil `MINIMAL` homologado. Esta classificação não altera o estado dos 129 handlers
`LEGACY_DEFERRED`, não cria nova capability e não converte rota legada em canônica.

## ETP-015.8 — fechamento P0

Quatro handlers deixaram `LEGACY_DEFERRED` e agora são `CAPABILITY_PROTECTED`: dois usam
`payroll.period.close.history`, close usa `payroll.period.close.execute` e reopen usa
`payroll.period.close.reopen`. O total atual é 4 public, 5 authenticated, 31 capability e 125
deferred, totalizando 165. A URI é compatível/deprecated; a autoridade é sempre empresa/principal e
serviço canônico. Não houve assignment automático.

## Full Delivery P1

Mais 33 handlers deixaram `LEGACY_DEFERRED`: Company (6), Employee (12), Employment Contract (7),
Payroll Parameter (4) e Payroll Rubric (4). O total runtime passa a 4 public, 5 authenticated, 64
capability-protected e 92 deferred, permanecendo 165 handlers e zero não classificados. As dez
capabilities P1 são específicas por recurso e leitura/escrita; não existe fallback para
`platform.manage`. Consulte o [aceite autoritativo](../full-delivery/P1_ACCEPTANCE.md).

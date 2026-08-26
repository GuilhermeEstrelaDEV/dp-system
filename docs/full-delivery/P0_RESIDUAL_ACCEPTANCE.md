# Full Delivery P0-RESIDUAL Acceptance

**Status:** `FULL FUNCTIONAL DELIVERY — POST-MERGE VERIFIED`.

## Resultado

P0-RESIDUAL conclui os quinze handlers que ainda estavam em `LEGACY_DEFERRED` na baseline
`develop@798552f3d1ed62a00542be7bb8d05b9f9e0bfa18`. O runtime passa a ter 165 handlers
classificados: 4 públicos, 5 somente autenticados, 156 protegidos por capability, zero deferred e
zero não classificados.

Não foi criada migration. O schema atual suporta competência, lançamento, execução e auditoria. A
entrega é funcional no ambiente local; produção, cloud, deploy, Gate D, ETP-015.10 e decisões
legais pendentes não são autorizados por este aceite.

## Inventário autoritativo

|   # | Controller/handler                  | Verbo e rota                         | Classe | Tipo        | DTO/consulta                 | Resposta mínima                                     | Serviço/modelo                            | Consumer                   | Escopo/capability                          | Auditoria                                   | Relação canônica/testes                                                          |
| --: | ----------------------------------- | ------------------------------------ | ------ | ----------- | ---------------------------- | --------------------------------------------------- | ----------------------------------------- | -------------------------- | ------------------------------------------ | ------------------------------------------- | -------------------------------------------------------------------------------- |
|   1 | `PayrollPeriodsController#list`     | `GET /payroll-periods`               | B      | READ        | `PayrollPeriodQueryDto`      | IDs, referência, tipo, estado, versões e timestamps | `PayrollPeriodsService` / `PayrollPeriod` | Competências               | empresa ativa; `payroll.period.close.view` | leitura                                     | projeção compatível; isolamento/401/403                                          |
|   2 | `PayrollPeriodsController#find`     | `GET /payroll-periods/:id`           | B      | READ        | path UUID                    | mesma projeção mínima                               | idem                                      | Competências               | idem; foreign `404`                        | leitura                                     | não expõe `closureHistory` raw                                                   |
|   3 | `PayrollPeriodsController#create`   | `POST /payroll-periods`              | C      | WRITE       | `CreatePayrollPeriodDto`     | competência mínima                                  | idem                                      | formulário de competências | empresa ativa; `payroll.period.manage`     | `PAYROLL_PERIOD_CREATED`                    | operação distinta; relação calendar/empresa testada                              |
|   4 | `PayrollPeriodsController#update`   | `PATCH /payroll-periods/:id`         | C      | WRITE       | `UpdatePayrollPeriodDto`     | competência mínima                                  | idem                                      | API compatível             | idem                                       | `PAYROLL_PERIOD_UPDATED`                    | competência fechada imutável; rollback auditado                                  |
|   5 | `PayrollPeriodsController#open`     | `POST /payroll-periods/:id/open`     | B      | ACTION      | path UUID                    | competência mínima                                  | idem                                      | API compatível             | idem                                       | `PAYROLL_PERIOD_OPENED` quando há transição | não substitui reabertura canônica                                                |
|   6 | `PayrollPeriodsController#validate` | `POST /payroll-periods/:id/validate` | B      | ACTION/READ | path UUID                    | ID, validade e contagem bloqueante                  | idem / `PayrollRunMessage`                | Competências               | empresa ativa; `payroll.period.close.view` | leitura                                     | validação leve preservada; readiness canônica continua separada                  |
|   7 | `PayrollInputsController#list`      | `GET /payroll-inputs`                | C      | READ        | `PayrollInputQueryDto`       | input operacional e relações mínimas                | `PayrollInputsService` / `PayrollInput`   | Lançamentos                | empresa ativa; `payroll.input.read`        | leitura                                     | lista isolada e sem metadata                                                     |
|   8 | `PayrollInputsController#find`      | `GET /payroll-inputs/:id`            | C      | READ        | path UUID                    | mesma projeção mínima                               | idem                                      | API compatível             | idem; foreign `404`                        | leitura                                     | projeção e isolamento testados                                                   |
|   9 | `PayrollInputsController#create`    | `POST /payroll-inputs`               | C      | WRITE       | `CreatePayrollInputDto`      | input operacional                                   | idem                                      | formulário de lançamentos  | empresa ativa; `payroll.input.manage`      | `PAYROLL_INPUT_CREATED`                     | período/contrato/employee/rubrica validados; sem cálculo novo                    |
|  10 | `PayrollInputsController#update`    | `PATCH /payroll-inputs/:id`          | C      | WRITE       | `UpdatePayrollInputDto`      | input operacional                                   | idem                                      | ação de inativar           | idem                                       | `PAYROLL_INPUT_UPDATED`                     | período fechado bloqueia mutation; rollback testado                              |
|  11 | `PayrollRunsController#list`        | `GET /payroll-runs`                  | C      | READ        | `PayrollRunQueryDto`         | status, IDs, timestamps, agregados e mensagens      | `PayrollRunsService` / `PayrollRun`       | Execuções                  | empresa ativa; `payroll.run.read`          | leitura                                     | omite snapshot e memórias de cálculo                                             |
|  12 | `PayrollRunsController#find`        | `GET /payroll-runs/:id`              | C      | READ        | path UUID                    | mesma projeção mínima                               | idem                                      | API compatível             | idem; foreign `404`                        | leitura                                     | projeção/isolamento testados                                                     |
|  13 | `PayrollRunsController#messages`    | `GET /payroll-runs/:id/messages`     | C      | READ        | path UUID                    | mensagem operacional sem metadata                   | idem / `PayrollRunMessage`                | Execuções                  | idem                                       | leitura                                     | lookup do run sempre scoped                                                      |
|  14 | `PayrollRunsController#start`       | `POST /payroll-runs`                 | C      | ACTION      | `CreatePayrollRunDto`        | run mínimo final                                    | idem                                      | formulário de execuções    | empresa ativa; `payroll.run.manage`        | `PAYROLL_RUN_STARTED`                       | reutiliza o motor determinístico existente; audit e resultado na mesma transação |
|  15 | `PayrollRunsController#addMessage`  | `POST /payroll-runs/:id/messages`    | C      | WRITE       | `CreatePayrollRunMessageDto` | mensagem mínima                                     | idem                                      | API compatível             | idem                                       | `PAYROLL_RUN_MESSAGE_CREATED`               | mutation e audit atômicos                                                        |

Legenda: B = projeção de compatibilidade protegida; C = operação distinta já modelada. Nenhum dos
seis handlers de competência é alias de close, reopen, history ou readiness canônicos. Por isso,
nenhuma segunda regra desses fluxos foi criada; o frontend direciona fechamento e reabertura ao
painel canônico existente.

## Capability e auditoria

- capabilities: 43 antes, 5 indispensáveis adicionadas, 48 depois;
- novas: `payroll.period.manage`, `payroll.input.read/manage` e `payroll.run.read/manage`;
- leituras de competência reutilizam `payroll.period.close.view`;
- audit events: 74 antes, 7 eventos de mutação distintos adicionados, 81 depois;
- metadata é deny-by-default e não contém valores de folha, nomes, documento, DTO ou resposta;
- seed canônico: zero assignments; acesso local: 35 assignments `MANUAL`, expiráveis e revogáveis,
  somente para `ADMINISTRATOR` demonstrativo.

## Frontend e dados demonstrativos

Competências, lançamentos e execuções usam `DataTable`, `DataTableActions` e `DataTableStatus`, com
overflow horizontal, colunas legíveis e ações condicionadas por capability. O fechamento continua
no fluxo canônico de histórico/readiness/close/reopen. Horizon e Atlas possuem períodos, inputs e
runs fictícios para isolamento, sem resultado legal inferido.

## Gates de aceite

- P0 residual smoke: 15/15, HR `403`, foreign-company `404`, audit presente e zero `5xx`;
- regressão: Essential 17/17, P1 33/33, P2 56/56 e P3 21/21;
- rotas: 165/165 classificadas, 156 capability-protected, zero deferred/unclassified;
- banco: PostgreSQL 16, 16/16 migrations, seed e zero grants automáticos;
- API/frontend: lint, typecheck, testes, cobertura e build;
- Prisma generate/validate, Prettier, links Markdown e `git diff --check`.

Cobertura final: API 75,09% de linhas e 71,03% de branches; frontend 76,06% de linhas e 72,55% de
branches. A suíte executou 86 suítes/410 testes ativos na API e 22 arquivos/87 testes no frontend.

# Consistência entre criação e listagem

## Objetivo

Este documento registra a auditoria das ações de criação visíveis no frontend e a estratégia
única de pós-criação. A fonte do inventário é o código da branch `demo/external-review`; ações de
workflow que não criam um recurso consultável foram separadas das operações CRUD.

## Incidente reproduzido em Employee

Em 26/09/2026 foi criado um colaborador fictício único pela API da demo local. O
`POST /employees` retornou `201` e o identificador
`6464dd00-069f-4dd2-bebb-ef4e9c1c4b83`. A consulta imediata, com a mesma empresa ativa,
retornou `200`, zero itens e não continha esse identificador; `GET /employees/:id` retornou
`404`.

A causa foi classificada como `COMPANY_SCOPE` + `LIST_QUERY`. `Employee` não guardava a empresa
na criação e tanto a lista quanto o detalhe exigiam um `EmploymentContract` da empresa ativa.
Assim, o registro existia, mas permanecia inacessível até a criação do primeiro contrato. Não era
falha de persistência, DTO, status, cache ou estado local.

A migration aditiva `0018_employee_origin_company` introduz `origin_company_id` anulável. Novos
colaboradores recebem a empresa ativa dentro da mesma transação auditada. Lista e detalhe aceitam
a empresa de origem ou um contrato da empresa ativa; filtros organizacionais continuam exigindo
contrato na empresa ativa. Registros legados permanecem compatíveis por meio dos contratos, e
outra empresa continua recebendo `404`.

## Estratégia de pós-criação

- React Query continua sendo o único mecanismo de cache e sincronização.
- O callback de sucesso aguarda a invalidação/refetch da consulta correspondente.
- Formulários e estados de carregamento só avançam após sucesso real da API.
- `CreateListFeedback` apresenta confirmação explícita e informa quando filtros, ordenação ou
  paginação ocultam o recurso.
- Fluxos paginados ou filtráveis oferecem uma ação para abrir o recurso, limpar filtros ou voltar
  à primeira página.
- Não há `window.location.reload()` nem mecanismo paralelo de cache.
- Empresa ativa, capabilities e respostas cross-company permanecem fail-closed.

## Inventário das telas de criação

Legenda: `RQ` = invalidação/refetch pelo React Query; `detail` = navegação para o recurso criado;
`N/A` = comando persistente sem endpoint de listagem próprio, com confirmação explícita.

|   # | Tela / rota                                       | Componente                  | POST                                        | GET/lista                           | Atualização                               | Filtros / paginação / ordem                | Status padrão    | Resultado      |
| --: | ------------------------------------------------- | --------------------------- | ------------------------------------------- | ----------------------------------- | ----------------------------------------- | ------------------------------------------ | ---------------- | -------------- |
|   1 | Empresas `/estrutura/empresas`                    | `ResourcePage`              | `/companies`                                | `/companies`                        | RQ + feedback + abrir criado              | busca, status, página 20; API              | `ACTIVE`         | PASS           |
|   2 | Filiais `/estrutura/filiais`                      | `ResourcePage`              | `/branches`                                 | `/branches`                         | RQ + feedback + abrir criado              | busca, status, página 20; API              | `ACTIVE`         | PASS           |
|   3 | Departamentos `/estrutura/departamentos`          | `ResourcePage`              | `/departments`                              | `/departments`                      | RQ + feedback + abrir criado              | busca, status, página 20; API              | `ACTIVE`         | PASS           |
|   4 | Cargos `/estrutura/cargos`                        | `ResourcePage`              | `/positions`                                | `/positions`                        | RQ + feedback + abrir criado              | busca, status, página 20; API              | `ACTIVE`         | PASS           |
|   5 | Centros de custo `/estrutura/centros-de-custo`    | `ResourcePage`              | `/cost-centers`                             | `/cost-centers`                     | RQ + feedback + abrir criado              | busca, status, página 20; API              | `ACTIVE`         | PASS           |
|   6 | Colaboradores `/colaboradores`                    | `EmployeesPage`             | `/employees`                                | `/employees`                        | RQ + feedback + link de detalhe           | busca, status, página API; nome ascendente | `ACTIVE`         | PASS           |
|   7 | Contatos `/colaboradores/:id`                     | `EmployeeDetailsPage`       | `/employees/:id/contacts`                   | `/employees/:id`                    | RQ + feedback                             | sem filtro; criação ascendente             | `ACTIVE`         | PASS           |
|   8 | Contratos `/contratos`                            | `EmploymentContractsPage`   | `/employment-contracts`                     | `/employment-contracts`             | RQ + feedback + link de detalhe           | busca; ordem API                           | `ACTIVE`         | PASS           |
|   9 | Admissões `/admissoes/nova`                       | `AdmissionFormPage`         | `/admission-processes`                      | `/admission-processes`              | detail                                    | sem paginação no frontend                  | `DRAFT`          | PASS           |
|  10 | Templates `/configuracoes/checklists`             | `ChecklistTemplatesPage`    | `/checklist-templates`                      | `/checklist-templates`              | RQ + feedback                             | sem filtro/paginação                       | `ACTIVE`         | PASS           |
|  11 | Requisitos `/admissoes/:id/documentos`            | `AdmissionDocumentsPage`    | `/admission-processes/:id/documents`        | mesmo caminho                       | RQ corrigido + feedback                   | por processo; sem paginação                | workflow inicial | PASS           |
|  12 | Benefícios `/beneficios`                          | `BenefitsPage`              | `/benefits`                                 | `/benefits`                         | RQ + feedback + limpar filtros            | busca e tipo                               | `ACTIVE`         | PASS           |
|  13 | Planos `/beneficios`                              | `BenefitsPage`              | `/benefits/plans`                           | `/benefits` aninhado                | RQ + feedback + limpar filtros            | filtros do benefício pai                   | `ACTIVE`         | PASS           |
|  14 | Adesões `/beneficios`                             | `BenefitsPage`              | `/benefits/enrollments`                     | `/benefits/enrollments/:contractId` | RQ + feedback + abrir contrato            | contrato                                   | `ACTIVE`         | PASS           |
|  15 | Tipos de afastamento `/movimentacoes`             | `VacationsLeavesPage`       | `/leave-types`                              | `/leave-types`                      | RQ + feedback                             | sem filtro/paginação                       | `ACTIVE`         | PASS           |
|  16 | Afastamentos `/movimentacoes`                     | `VacationsLeavesPage`       | `/leave-cases`                              | `/leave-cases`                      | RQ + feedback                             | sem filtro/paginação                       | `OPEN`           | PASS           |
|  17 | Períodos de férias `/ferias`                      | `VacationManagementPage`    | `/vacation-periods`                         | `/vacation-periods`                 | RQ + feedback                             | contrato                                   | `OPEN`           | PASS           |
|  18 | Solicitações de férias `/ferias`                  | `VacationManagementPage`    | `/vacation-requests`                        | `/vacation-requests`                | RQ + feedback                             | contrato                                   | `DRAFT`          | PASS           |
|  19 | Férias coletivas `/ferias`                        | `VacationManagementPage`    | `/collective-vacations`                     | N/A                                 | confirmação explícita                     | N/A                                        | `DRAFT`          | NOT_APPLICABLE |
|  20 | Jornadas `/jornada`                               | `TimeManagementPage`        | `/work-schedules`                           | `/work-schedules`                   | RQ + feedback                             | sem filtro/paginação                       | `ACTIVE`         | PASS           |
|  21 | Atribuição de jornada `/jornada`                  | `TimeManagementPage`        | `/employment-contracts/:id/work-schedules`  | N/A                                 | confirmação explícita + RQ derivado       | N/A                                        | `PENDING`        | NOT_APPLICABLE |
|  22 | Feriados `/jornada`                               | `TimeManagementPage`        | `/holidays`                                 | N/A                                 | confirmação explícita; callback corrigido | N/A                                        | `PENDING`        | NOT_APPLICABLE |
|  23 | Ocorrências `/jornada`                            | `TimeManagementPage`        | `/time-entries`                             | `/time-entries`                     | RQ + feedback                             | sem filtro/paginação                       | `PENDING`        | PASS           |
|  24 | Fechamento de saldo `/jornada`                    | `TimeManagementPage`        | `/time-balance-closings`                    | saldo derivado por contrato         | RQ + feedback                             | contrato                                   | `OPEN`           | NOT_APPLICABLE |
|  25 | Rubricas `/folha/rubricas`                        | `PayrollRubricsPanel`       | `/payroll-rubrics`                          | `/payroll-rubrics`                  | RQ + feedback + limpar filtros            | busca, status, ordem, página 20            | `ACTIVE`         | PASS           |
|  26 | Parâmetros `/folha/parametros`                    | `PayrollParametersPanel`    | `/payroll-parameters`                       | `/payroll-parameters`               | RQ + feedback + limpar filtros            | busca, status, página 20                   | `DRAFT`          | PASS           |
|  27 | Lançamentos `/folha/lancamentos`                  | `PayrollInputsPanel`        | `/payroll-inputs`                           | `/payroll-inputs`                   | RQ + feedback + primeira página           | competência, página 20; criação desc.      | `PENDING`        | PASS           |
|  28 | Competências `/folha/competencias`                | `PayrollPeriodsPanel`       | `/payroll-periods`                          | `/payroll-periods`                  | RQ + feedback                             | empresa, página 20                         | `OPEN`           | PASS           |
|  29 | Execuções `/folha/execucoes`                      | `PayrollRunsPanel`          | `/payroll-runs`                             | `/payroll-runs`                     | RQ + feedback + primeira página           | competência, página 20; criação desc.      | `DRAFT`          | PASS           |
|  30 | Ciclos `/folha/execucoes/:runId`                  | `PayrollRunReviewPage`      | `/payroll-runs/:runId/reviews`              | mesmo caminho                       | RQ + feedback                             | por execução                               | `OPEN`           | PASS           |
|  31 | Achados `/folha/conferencia/:reviewId`            | `PayrollReviewDetailPage`   | `/payroll-reviews/:id/findings`             | `/payroll-reviews/:id`              | RQ + feedback + limpar filtros            | status e severidade                        | `OPEN`           | PASS           |
|  32 | Eventos variáveis `/folha/remuneracao-variavel`   | `VariableCompensationPanel` | `/variable-compensation/events`             | mesmo caminho                       | RQ + feedback                             | contrato                                   | `PENDING`        | PASS           |
|  33 | Adiantamentos `/folha/remuneracao-variavel`       | `VariableCompensationPanel` | `/variable-compensation/advances`           | mesmo caminho                       | RQ + feedback                             | contrato                                   | `PENDING`        | PASS           |
|  34 | Pagamentos externos `/folha/remuneracao-variavel` | `VariableCompensationPanel` | `/variable-compensation/off-cycle-payments` | mesmo caminho                       | RQ + feedback                             | contrato                                   | `PENDING`        | PASS           |
|  35 | Conciliações `/folha/remuneracao-variavel`        | `VariableCompensationPanel` | `/variable-compensation/reconciliations`    | mesmo caminho                       | RQ + feedback                             | execução                                   | `OPEN`           | PASS           |

## Matriz final de verificação

| Módulo                                                              | CREATE | PERSISTED | LIST REFRESH | VISIBLE | FILTER CASE    | RESULT |
| ------------------------------------------------------------------- | ------ | --------- | ------------ | ------- | -------------- | ------ |
| Organização (5 cadastros compartilhados)                            | PASS   | PASS      | PASS         | PASS    | PASS           | PASS   |
| Colaboradores e contatos                                            | PASS   | PASS      | PASS         | PASS    | PASS           | PASS   |
| Contratos                                                           | PASS   | PASS      | PASS         | PASS    | PASS           | PASS   |
| Admissões, templates e requisitos                                   | PASS   | PASS      | PASS         | PASS    | NOT_APPLICABLE | PASS   |
| Benefícios, planos e adesões                                        | PASS   | PASS      | PASS         | PASS    | PASS           | PASS   |
| Afastamentos                                                        | PASS   | PASS      | PASS         | PASS    | NOT_APPLICABLE | PASS   |
| Férias                                                              | PASS   | PASS      | PASS         | PASS    | PASS           | PASS   |
| Jornada e banco de horas                                            | PASS   | PASS      | PASS         | PASS    | NOT_APPLICABLE | PASS   |
| Folha (rubricas, parâmetros, lançamentos, competências e execuções) | PASS   | PASS      | PASS         | PASS    | PASS           | PASS   |
| Conferência de folha                                                | PASS   | PASS      | PASS         | PASS    | PASS           | PASS   |
| Remuneração variável                                                | PASS   | PASS      | PASS         | PASS    | NOT_APPLICABLE | PASS   |

## Limites preservados

- Nenhuma capability, grant, regra de autenticação ou autorização foi alterada.
- Nenhuma regra legal, cálculo ou decisão de negócio foi criada.
- `origin_company_id` não substitui contrato, admissão ou estrutura organizacional; registra apenas
  o contexto empresarial em que o cadastro nasceu.
- CPF e demais dados pessoais continuam fora das projeções de lista e dos logs de auditoria.
- Férias coletivas, atribuição de jornada e feriados ainda não possuem listagem pública própria;
  a entrega apenas torna o sucesso explícito e registra a ausência como `NOT_APPLICABLE`, sem
  ampliar contratos públicos nesta correção.

# Inventário de rotas e navegação da plataforma de RH

## Objetivo

Este inventário registra as rotas reais do frontend auditadas na correção `UX/NAV-01` da Wave 1.
Ele diferencia entradas de menu, aliases, páginas de detalhe e fluxos internos sem criar rotas,
capabilities ou funcionalidades fictícias.

Estados usados:

- `FUNCTIONAL`: tela utilizável no recorte já entregue;
- `PARTIAL`: tela utilizável, mas com limitação explícita;
- `PLACEHOLDER`: indicação visual sem rota acionável;
- `NOT IMPLEMENTED`: funcionalidade inexistente no frontend.

## Rotas reais

| Route                                                                              | Page                            | Feature                  | Capability necessária                                                | Status     | Menu após UX/NAV-01                                                 |
| ---------------------------------------------------------------------------------- | ------------------------------- | ------------------------ | -------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------- |
| `/login`                                                                           | `LoginPage`                     | Autenticação             | pública                                                              | FUNCTIONAL | fora do menu; entrada de sessão                                     |
| `/selecionar-empresa`                                                              | `CompanySelectionPage`          | Contexto empresarial     | identidade autenticada                                               | FUNCTIONAL | fluxo após login/troca de empresa                                   |
| `/`                                                                                | `DashboardPage`                 | Dashboard                | sessão e empresa ativa; conteúdo ampliado depende de `platform.read` | FUNCTIONAL | Visão geral                                                         |
| `/folha`                                                                           | `PayrollPage`                   | Períodos da folha        | `payroll.period.close.view`                                          | FUNCTIONAL | alias exato de Períodos                                             |
| `/folha/competencias`                                                              | `PayrollPage`                   | Períodos da folha        | `payroll.period.close.view`                                          | FUNCTIONAL | Folha / Períodos                                                    |
| `/folha/lancamentos`                                                               | `PayrollPage`                   | Lançamentos              | `payroll.input.read`                                                 | FUNCTIONAL | Folha / Lançamentos                                                 |
| `/folha/execucoes`                                                                 | `PayrollPage`                   | Processamentos           | `payroll.run.read`                                                   | FUNCTIONAL | Folha / Processamentos                                              |
| `/jornada`                                                                         | `TimeManagementPage`            | Jornada e ponto          | `time.read`                                                          | FUNCTIONAL | Jornada / Jornada e ponto                                           |
| `/beneficios`                                                                      | `BenefitsPage`                  | Benefícios               | `benefit.read`                                                       | FUNCTIONAL | Pessoas / Benefícios                                                |
| `/ferias`                                                                          | `VacationManagementPage`        | Férias                   | `vacation.read`                                                      | FUNCTIONAL | Pessoas / Férias                                                    |
| `/estrutura/filiais`                                                               | `BranchesPage`                  | Organização              | `organization.read`                                                  | FUNCTIONAL | Organização / Filiais                                               |
| `/estrutura/departamentos`                                                         | `DepartmentsPage`               | Organização              | `organization.read`                                                  | FUNCTIONAL | Organização / Departamentos                                         |
| `/estrutura/cargos`                                                                | `PositionsPage`                 | Organização              | `organization.read`                                                  | FUNCTIONAL | Organização / Cargos                                                |
| `/estrutura/centros-de-custo`                                                      | `CostCentersPage`               | Organização              | `organization.read`                                                  | FUNCTIONAL | Organização / Centros de custo                                      |
| `/admissoes`                                                                       | `AdmissionsPage`                | Admissões                | `admission.read`                                                     | FUNCTIONAL | Pessoas / Admissões                                                 |
| `/admissoes/:admissionId`                                                          | `AdmissionDetailsPage`          | Admissões                | `admission.read`                                                     | FUNCTIONAL | detalhe via Admissões                                               |
| `/admissoes/:admissionId/checklist`                                                | `AdmissionChecklistPage`        | Admissões                | `admission.read`                                                     | FUNCTIONAL | fluxo interno via detalhe                                           |
| `/admissoes/:admissionId/documentos`                                               | `AdmissionDocumentsPage`        | Admissões                | `admission.read`                                                     | FUNCTIONAL | fluxo interno via detalhe                                           |
| `/configuracoes/checklists`                                                        | `ChecklistTemplatesPage`        | Configuração admissional | `admission.read`                                                     | FUNCTIONAL | Administração / Modelos de checklist                                |
| `/admissoes/nova`                                                                  | `AdmissionFormPage`             | Admissões                | `admission.manage`                                                   | FUNCTIONAL | ação via Admissões                                                  |
| `/admissoes/:admissionId/editar`                                                   | `AdmissionFormPage`             | Admissões                | `admission.manage`                                                   | FUNCTIONAL | ação via detalhe                                                    |
| `/movimentacoes`                                                                   | `VacationsLeavesPage`           | Afastamentos             | `leave.read`                                                         | FUNCTIONAL | Pessoas / Afastamentos                                              |
| `/folha/remuneracao-variavel`                                                      | `PayrollPage`                   | Remuneração variável     | `variable_compensation.read`                                         | FUNCTIONAL | Folha / Remuneração variável                                        |
| `/estrutura`                                                                       | `CompaniesPage`                 | Empresas                 | `company.read`                                                       | FUNCTIONAL | alias exato de Empresas                                             |
| `/estrutura/empresas`                                                              | `CompaniesPage`                 | Empresas                 | `company.read`                                                       | FUNCTIONAL | Organização / Empresas                                              |
| `/colaboradores`                                                                   | `EmployeesPage`                 | Colaboradores            | `employee.read`                                                      | FUNCTIONAL | Pessoas / Colaboradores                                             |
| `/colaboradores/:employeeId`                                                       | `EmployeeDetailsPage`           | Colaboradores e contatos | `employee.read`                                                      | FUNCTIONAL | detalhe via Colaboradores                                           |
| `/colaboradores/:employeeId/contratos`                                             | `EmploymentContractsPage`       | Contratos                | `contract.read`                                                      | FUNCTIONAL | fluxo interno; mantém Contratos ativo                               |
| `/employees/:employeeId/contracts`                                                 | `EmploymentContractsPage`       | Contratos                | `contract.read`                                                      | FUNCTIONAL | alias de compatibilidade; sem item próprio                          |
| `/contratos`                                                                       | `EmploymentContractsPage`       | Contratos                | `contract.read`                                                      | FUNCTIONAL | Pessoas / Contratos                                                 |
| `/contratos/:contractId`                                                           | `EmploymentContractDetailsPage` | Contratos                | `contract.read`                                                      | FUNCTIONAL | detalhe via Contratos                                               |
| `/folha/rubricas`                                                                  | `PayrollPage`                   | Rubricas                 | `payroll.rubric.read`                                                | FUNCTIONAL | Folha / Rubricas                                                    |
| `/folha/parametros`                                                                | `PayrollPage`                   | Parâmetros               | `payroll.parameter.read`                                             | FUNCTIONAL | Folha / Parâmetros                                                  |
| `/folha/execucoes/:runId`                                                          | `PayrollRunReviewPage`          | Revisão da folha         | `payroll.review.view`                                                | FUNCTIONAL | detalhe; mantém Revisão ativa                                       |
| `/folha/conferencia`                                                               | `PayrollReviewRunsPage`         | Revisão da folha         | `payroll.review.view`                                                | FUNCTIONAL | Folha / Revisão                                                     |
| `/folha/conferencia/:reviewId`                                                     | `PayrollReviewDetailPage`       | Revisão da folha         | `payroll.review.view`                                                | FUNCTIONAL | detalhe via Revisão                                                 |
| `/folha/fechamentos`                                                               | `PayrollPage`                   | Fechamentos e histórico  | `payroll.period.close.history`                                       | PARTIAL    | Folha / Histórico; seleção ainda depende de identificador conhecido |
| `/folha/competencias/:payrollPeriodId/historico`                                   | `PayrollPeriodHistoryPage`      | Histórico de fechamento  | `payroll.period.close.history`                                       | FUNCTIONAL | detalhe; mantém Histórico ativo                                     |
| `/folha/competencias/:payrollPeriodId/historico/versoes/:closureVersion`           | `PayrollPeriodVersionPage`      | Versão de fechamento     | `payroll.period.close.history`                                       | FUNCTIONAL | fluxo interno via Histórico                                         |
| `/folha/competencias/:payrollPeriodId/historico/versoes/:closureVersion/eventos`   | `PayrollPeriodEventsPage`       | Eventos de fechamento    | `payroll.period.close.history`                                       | FUNCTIONAL | fluxo interno via Histórico                                         |
| `/folha/competencias/:payrollPeriodId/historico/versoes/:closureVersion/manifesto` | `PayrollPeriodManifestPage`     | Manifesto de fechamento  | `payroll.period.close.history`                                       | FUNCTIONAL | fluxo interno via Histórico                                         |
| `*`                                                                                | `NotFoundPage`                  | Fallback                 | sessão autenticada                                                   | FUNCTIONAL | fora do menu                                                        |

## Placeholders sem rota

| Item          | Status      | Comportamento                       |
| ------------- | ----------- | ----------------------------------- |
| Desligamentos | PLACEHOLDER | `Em breve`, desabilitado e sem link |
| Documentos    | PLACEHOLDER | `Em breve`, desabilitado e sem link |
| Relatórios    | PLACEHOLDER | `Em breve`, desabilitado e sem link |

Nenhuma dessas entradas representa funcionalidade pronta.

## Contrato de descoberta

- grupos de navegação: 7;
- itens totais: 25;
- itens funcionais ou parciais acionáveis: 22;
- placeholders não acionáveis: 3;
- rotas canônicas de entrada esperadas no menu: 22;
- rotas de entrada órfãs: 0;
- grupos vazios renderizados: 0;
- ações de criação verificadas nos CRUDs já entregues e testados pela Wave 1: 7.

O teste `navigation route contract` compara as 22 rotas canônicas de entrada com o router e com a
configuração do menu. O teste deriva as rotas estáticas diretamente do router e exclui explicitamente
somente autenticação, seleção de empresa, aliases e a ação `Nova admissão`; detalhes dinâmicos e o
fallback permanecem fora da contagem porque são alcançados por seus fluxos canônicos.

## Active state especial

- contratos sob colaborador e no alias em inglês mantêm `Contratos` ativo;
- `/folha/execucoes/:runId` mantém `Revisão` ativa, pois a página pertence ao workflow de revisão;
- histórico, versões, eventos e manifesto mantêm `Histórico` ativo;
- `/estrutura` e `/folha` ativam somente seus aliases exatos, sem capturar os demais módulos.

## Segurança preservada

Cada item funcional usa a mesma capability do `CapabilityRoute` correspondente. O menu apenas
oculta itens indisponíveis; o backend continua sendo a autoridade final. Não foi usada capability
agregadora, não foi ampliado `platform.manage` e não foram criados grants automáticos.

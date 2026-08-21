# ETP-015.7 — Catálogo canônico de eventos

**Versão do catálogo:** 1 — 81 códigos ativos

Todos os códigos são estáticos, únicos e limitados a 50 caracteres. `REQUIRED` significa que o
writer exige o mesmo `TransactionClient` da mutação. `OPTIONAL` é reservado aos eventos de sessão
que não acompanham uma escrita crítica de domínio.

| Código                                      | Categoria      | Empresa     | Atomicidade | Capability efetiva               | Metadata específica            |
| ------------------------------------------- | -------------- | ----------- | ----------- | -------------------------------- | ------------------------------ |
| `AUTH_LOGIN_SUCCEEDED`                      | autenticação   | opcional    | OPTIONAL    | —                                | —                              |
| `AUTH_COMPANY_SELECTED`                     | autenticação   | obrigatória | OPTIONAL    | —                                | —                              |
| `AUTH_LOGOUT_SUCCEEDED`                     | autenticação   | opcional    | OPTIONAL    | —                                | —                              |
| `ACCESS_GRANTS_VIEWED`                      | autorização    | obrigatória | OPTIONAL    | uma capability de grants         | tipo do grant e perfil         |
| `ROLE_PERMISSION_ASSIGNED`                  | assignment     | opcional    | REQUIRED    | serviço interno                  | `source`                       |
| `ROLE_PERMISSION_REVOKED`                   | assignment     | opcional    | REQUIRED    | serviço interno                  | —                              |
| `USER_COMPANY_ROLE_ASSIGNED`                | assignment     | obrigatória | REQUIRED    | serviço interno                  | `source`                       |
| `USER_COMPANY_ROLE_REVOKED`                 | assignment     | obrigatória | REQUIRED    | serviço interno                  | —                              |
| `SUBSTITUTION_CREATED`                      | grant          | obrigatória | REQUIRED    | `delegation.manage`              | capabilities, janela e tipo    |
| `SUBSTITUTION_REVOKED`                      | grant          | obrigatória | REQUIRED    | `delegation.manage`              | —                              |
| `SUBSTITUTION_EXPIRED`                      | grant          | obrigatória | REQUIRED    | `delegation.manage`              | —                              |
| `EMERGENCY_ACCESS_GRANTED`                  | grant          | obrigatória | REQUIRED    | `emergency_access.manage`        | capabilities, janela e tipo    |
| `EMERGENCY_ACCESS_REVOKED`                  | grant          | obrigatória | REQUIRED    | `emergency_access.manage`        | —                              |
| `EMERGENCY_ACCESS_EXPIRED`                  | grant          | obrigatória | REQUIRED    | `emergency_access.manage`        | —                              |
| `PAYROLL_REVIEW_CYCLE_OPENED`               | payroll review | obrigatória | REQUIRED    | `payroll.review.create`          | `source`                       |
| `PAYROLL_REVIEW_FINDING_OPENED`             | payroll review | obrigatória | REQUIRED    | `payroll.review.finding.create`  | `source`                       |
| `PAYROLL_REVIEW_STARTED`                    | payroll review | obrigatória | REQUIRED    | `payroll.review.submit`          | `source`                       |
| `PAYROLL_REVIEW_SUBMITTED`                  | payroll review | obrigatória | REQUIRED    | `payroll.review.submit`          | `source`                       |
| `PAYROLL_REVIEW_APPROVED`                   | payroll review | obrigatória | REQUIRED    | `payroll.review.approve`         | `source`                       |
| `PAYROLL_REVIEW_REJECTED`                   | payroll review | obrigatória | REQUIRED    | `payroll.review.reject`          | `source`                       |
| `PAYROLL_REVIEW_CLOSED`                     | payroll review | obrigatória | REQUIRED    | `payroll.review.close`           | `source`                       |
| `PAYROLL_REVIEW_REOPENED`                   | payroll review | obrigatória | REQUIRED    | `payroll.review.reopen`          | `source`                       |
| `PAYROLL_REVIEW_FINDING_RESOLVED`           | payroll review | obrigatória | REQUIRED    | `payroll.review.finding.resolve` | `source`                       |
| `PAYROLL_REVIEW_FINDING_REOPENED`           | payroll review | obrigatória | REQUIRED    | `payroll.review.finding.reopen`  | `source`                       |
| `PAYROLL_PERIOD_CLOSURE_FOUNDATION_CREATED` | competência    | obrigatória | REQUIRED    | `payroll.period.close.execute`   | `source`                       |
| `PAYROLL_PERIOD_CLOSED`                     | competência    | obrigatória | REQUIRED    | `payroll.period.close.execute`   | manifesto, vínculos e warnings |
| `PAYROLL_PERIOD_REOPENED`                   | competência    | obrigatória | REQUIRED    | `payroll.period.close.reopen`    | `details` estruturado          |

## Extensões homologadas pela Full Delivery

Todos os eventos abaixo também são empresariais, possuem atomicidade `REQUIRED` e usam metadata
vazia, salvo indicação explícita. P1, P2 e P3 acrescentaram 47 eventos; P0-RESIDUAL acrescentou os
sete últimos, levando o catálogo de 74 para 81 códigos sem duplicar os eventos canônicos de
fechamento ou reabertura.

| Código                                        | Capability efetiva             | Wave/metadata               |
| --------------------------------------------- | ------------------------------ | --------------------------- |
| `COMPANY_CREATED`                             | `company.manage`               | P1                          |
| `COMPANY_UPDATED`                             | `company.manage`               | P1                          |
| `COMPANY_ACTIVATED`                           | `company.manage`               | P1                          |
| `COMPANY_INACTIVATED`                         | `company.manage`               | P1                          |
| `EMPLOYEE_CREATED`                            | `employee.manage`              | P1                          |
| `EMPLOYEE_UPDATED`                            | `employee.manage`              | P1                          |
| `EMPLOYEE_STATUS_CHANGED`                     | `employee.manage`              | P1                          |
| `CONTRACT_CREATED`                            | `contract.manage`              | P1                          |
| `CONTRACT_UPDATED`                            | `contract.manage`              | P1                          |
| `CONTRACT_STATUS_CHANGED`                     | `contract.manage`              | P1                          |
| `PAYROLL_PARAMETER_CREATED`                   | `payroll.parameter.manage`     | P1; `code`                  |
| `PAYROLL_PARAMETER_UPDATED`                   | `payroll.parameter.manage`     | P1; `code`                  |
| `PAYROLL_RUBRIC_CREATED`                      | `payroll.rubric.manage`        | P1; `code`                  |
| `PAYROLL_RUBRIC_UPDATED`                      | `payroll.rubric.manage`        | P1; `code`                  |
| `ORGANIZATION_RESOURCE_CREATED`               | `organization.manage`          | P2                          |
| `ORGANIZATION_RESOURCE_UPDATED`               | `organization.manage`          | P2                          |
| `ORGANIZATION_RESOURCE_STATUS_CHANGED`        | `organization.manage`          | P2                          |
| `ADMISSION_PROCESS_CREATED`                   | `admission.manage`             | P2                          |
| `ADMISSION_PROCESS_UPDATED`                   | `admission.manage`             | P2                          |
| `ADMISSION_PROCESS_STATUS_CHANGED`            | `admission.manage`             | P2                          |
| `ADMISSION_CHECKLIST_CREATED`                 | `admission.manage`             | P2                          |
| `ADMISSION_CHECKLIST_ITEM_UPDATED`            | `admission.manage`             | P2                          |
| `ADMISSION_DOCUMENT_CREATED`                  | `admission.manage`             | P2                          |
| `ADMISSION_DOCUMENT_UPDATED`                  | `admission.manage`             | P2                          |
| `ADMISSION_CHECKLIST_TEMPLATE_CREATED`        | `admission.manage`             | P2                          |
| `ADMISSION_CHECKLIST_TEMPLATE_STATUS_CHANGED` | `admission.manage`             | P2                          |
| `LEAVE_TYPE_CREATED`                          | `leave.manage`                 | P2                          |
| `LEAVE_CASE_CREATED`                          | `leave.manage`                 | P2                          |
| `LEAVE_CASE_RETURNED`                         | `leave.manage`                 | P2                          |
| `VARIABLE_COMPENSATION_EVENT_CREATED`         | `variable_compensation.manage` | P2                          |
| `SALARY_ADVANCE_CREATED`                      | `variable_compensation.manage` | P2                          |
| `OFF_CYCLE_PAYMENT_CREATED`                   | `variable_compensation.manage` | P2                          |
| `PAYROLL_RECONCILIATION_CREATED`              | `variable_compensation.manage` | P2                          |
| `WORK_SCHEDULE_CREATED`                       | `time.manage`                  | P3                          |
| `WORK_SCHEDULE_ASSIGNED`                      | `time.manage`                  | P3                          |
| `HOLIDAY_CREATED`                             | `time.manage`                  | P3                          |
| `TIME_ENTRY_CREATED`                          | `time.manage`                  | P3                          |
| `TIME_BALANCE_CLOSED`                         | `time.manage`                  | P3                          |
| `BENEFIT_CREATED`                             | `benefit.manage`               | P3                          |
| `BENEFIT_PLAN_CREATED`                        | `benefit.manage`               | P3                          |
| `BENEFIT_ENROLLMENT_CREATED`                  | `benefit.manage`               | P3                          |
| `BENEFIT_ENROLLMENT_STATUS_CHANGED`           | `benefit.manage`               | P3                          |
| `VACATION_PERIOD_CREATED`                     | `vacation.manage`              | P3                          |
| `VACATION_REQUEST_CREATED`                    | `vacation.manage`              | P3                          |
| `VACATION_REQUEST_APPROVED`                   | `vacation.manage`              | P3                          |
| `VACATION_REQUEST_CANCELLED`                  | `vacation.manage`              | P3                          |
| `COLLECTIVE_VACATION_CREATED`                 | `vacation.manage`              | P3                          |
| `PAYROLL_PERIOD_CREATED`                      | `payroll.period.manage`        | P0-RESIDUAL                 |
| `PAYROLL_PERIOD_UPDATED`                      | `payroll.period.manage`        | P0-RESIDUAL                 |
| `PAYROLL_PERIOD_OPENED`                       | `payroll.period.manage`        | P0-RESIDUAL                 |
| `PAYROLL_INPUT_CREATED`                       | `payroll.input.manage`         | P0-RESIDUAL                 |
| `PAYROLL_INPUT_UPDATED`                       | `payroll.input.manage`         | P0-RESIDUAL                 |
| `PAYROLL_RUN_STARTED`                         | `payroll.run.manage`           | P0-RESIDUAL                 |
| `PAYROLL_RUN_MESSAGE_CREATED`                 | `payroll.run.manage`           | P0-RESIDUAL; `payrollRunId` |

## Campos canônicos de todos os eventos

`eventVersion`, `category`, `outcome`, `requiredCapabilities`, `satisfiedCapabilities`,
`effectiveGrantIds` e `reasonCode` são adicionados pelo writer e não podem ser substituídos pelo
produtor. Recurso é representado por `entityType` e `entityId`; ator, empresa, sessão, trace, IP,
user agent e instante utilizam as colunas existentes.

## Evolução

AR-03 (`ACCESS_GRANTS_VIEWED`) foi acrescentado pela ETP-015.6 após homologação humana. Ele aceita
exatamente `delegation.manage` ou `emergency_access.manage`, registra somente `grantType` e
`projectionProfile` e não altera a atomicidade das escritas críticas.

Novo código exige atualização conjunta do catálogo, manifesto de produtores, allowlist, testes e
documentação. Códigos existentes não são renomeados. Mudança incompatível exige nova versão do
evento, sem reescrever linhas históricas.

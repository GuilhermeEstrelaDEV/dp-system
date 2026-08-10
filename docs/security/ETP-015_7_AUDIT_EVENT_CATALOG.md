# ETP-015.7 — Catálogo canônico de eventos

**Versão do catálogo:** 1

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

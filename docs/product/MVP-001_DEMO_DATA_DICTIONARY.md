# MVP-001 — Dicionário do dataset demonstrativo

| Entidade                                      | Quantidade | Empresa         | Finalidade                  | Origem             | Regra temporal/status            | Dados evitados              | Classificação             |
| --------------------------------------------- | ---------: | --------------- | --------------------------- | ------------------ | -------------------------------- | --------------------------- | ------------------------- |
| `Company`                                     |          2 | ambas           | contexto e isolamento       | seed canônico/demo | `ACTIVE`                         | CNPJ real                   | `INCLUDE IN DEMO DATASET` |
| `User`                                        |          2 | vínculos        | login local                 | demo seed          | `ACTIVE`                         | e-mail externo, senha clara | `INCLUDE MINIMALLY`       |
| `UserCompanyRole`                             |          3 | ambas           | seleção empresarial         | demo seed          | `[2026-01-01, ∞)`                | grant implícito             | `INCLUDE MINIMALLY`       |
| `RolePermission`                              |          0 | —               | preservar deny-by-default   | —                  | —                                | ampliação de acesso         | `REJECT`                  |
| `Branch`                                      |          2 | ambas           | estrutura                   | demo seed          | `ACTIVE`                         | endereço real               | `INCLUDE IN DEMO DATASET` |
| `Department`                                  |          8 | 5/3             | estrutura                   | demo seed          | `ACTIVE`                         | —                           | `INCLUDE IN DEMO DATASET` |
| `Position`                                    |         13 | 8/5             | contratos                   | demo seed          | `ACTIVE`                         | —                           | `INCLUDE IN DEMO DATASET` |
| `CostCenter`                                  |          5 | 3/2             | contratos                   | demo seed          | `ACTIVE`                         | —                           | `INCLUDE IN DEMO DATASET` |
| `Employee`                                    |         26 | via contrato    | telas existentes            | demo seed          | nomes Hnn/Ann                    | CPF, RG, PIS, pessoa real   | `INCLUDE IN DEMO DATASET` |
| `EmployeeContact`                             |         26 | via colaborador | contato local               | demo seed          | `ACTIVE`                         | telefone/e-mail real        | `INCLUDE MINIMALLY`       |
| `EmploymentContract`                          |         26 | 18/8            | fluxo existente             | demo seed          | 23 ativos, 3 inativos            | regra legal/salário         | `INCLUDE IN DEMO DATASET` |
| `AdmissionProcess`                            |          6 | 4/2             | cenário recente             | demo seed          | `COMPLETED`                      | documentos                  | `INCLUDE MINIMALLY`       |
| `PayrollCalendar`                             |          2 | ambas           | suporte à competência       | demo seed          | `ACTIVE`                         | —                           | `INCLUDE MINIMALLY`       |
| `PayrollPeriod`                               |         10 | 6/4             | dashboard                   | demo seed          | fev–jul/2026; estados existentes | fórmula legal               | `INCLUDE IN DEMO DATASET` |
| `PayrollRun`                                  |         10 | 6/4             | suporte à conferência       | demo seed          | `COMPLETED`                      | cálculo inventado           | `INCLUDE MINIMALLY`       |
| `PayrollReviewCycle`                          |          8 | 5/3             | dashboard                   | demo seed          | estados canônicos                | decisão falsa               | `INCLUDE IN DEMO DATASET` |
| `PayrollReviewFinding`                        |          8 | 6/2             | dashboard                   | demo seed          | `OPEN`/`RESOLVED`                | dado pessoal                | `INCLUDE IN DEMO DATASET` |
| `PayrollReviewEvent`                          |         25 | 15/10           | timeline/atividade          | demo seed          | fev–jul/2026, append-only        | actor livre/segredo         | `INCLUDE IN DEMO DATASET` |
| jornada, benefícios, férias e folha detalhada |          0 | —               | fora do recorte             | —                  | —                                | regra não homologada        | `DEFER`                   |
| auditoria sintética e decisões                |          0 | —               | não falsificar ação crítica | —                  | —                                | evento enganoso             | `REJECT`                  |

Campos, relações, constraints e enums são os definidos no schema e nas 16 migrations. Entidades sem
tela/fluxo útil não são preenchidas apenas para produzir volume.

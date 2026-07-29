# ETP-015 — Permission Classification Approval Matrix

## Estado

**PENDING HUMAN APPROVAL.** Segurança homologa `riskLevel`; Privacidade/DPO homologa `sensitivity`.
Produto participa das capacidades que aprovam, fecham, reabrem ou administram acesso. Campos humanos
permanecem vazios.

| ID    | Code/regra                       | Recomendação                   | Risk     | Sensitivity | Justificativa                                         | Segurança | DPO       | Produto    | Decisão | Condições | Evidência | Data | Status  |
| ----- | -------------------------------- | ------------------------------ | -------- | ----------- | ----------------------------------------------------- | --------- | --------- | ---------- | ------- | --------- | --------- | ---- | ------- |
| PC-01 | `platform.read`                  | Aprovar classificação proposta | MEDIUM   | SENSITIVE   | Leitura global de estrutura/identidades               | requerido | requerido | consultado |         |           |           |      | PENDING |
| PC-02 | `platform.manage`                | Aprovar classificação proposta | CRITICAL | RESTRICTED  | Administração transversal privilegiada                | requerido | requerido | requerido  |         |           |           |      | PENDING |
| PC-03 | `delegation.manage`              | Aprovar classificação proposta | CRITICAL | RESTRICTED  | Transfere capacidades temporariamente                 | requerido | requerido | requerido  |         |           |           |      | PENDING |
| PC-04 | `emergency_access.manage`        | Aprovar classificação proposta | CRITICAL | RESTRICTED  | Acesso emergencial privilegiado                       | requerido | requerido | requerido  |         |           |           |      | PENDING |
| PC-05 | `payroll.review.view`            | Aprovar classificação proposta | MEDIUM   | RESTRICTED  | Consulta dados e histórico de folha                   | requerido | requerido | consultado |         |           |           |      | PENDING |
| PC-06 | `payroll.review.create`          | Aprovar classificação proposta | HIGH     | RESTRICTED  | Cria ciclo ligado à folha                             | requerido | requerido | consultado |         |           |           |      | PENDING |
| PC-07 | `payroll.review.finding.create`  | Aprovar classificação proposta | HIGH     | RESTRICTED  | Pode bloquear o fluxo                                 | requerido | requerido | consultado |         |           |           |      | PENDING |
| PC-08 | `payroll.review.finding.resolve` | Aprovar classificação proposta | HIGH     | RESTRICTED  | Remove bloqueio operacional                           | requerido | requerido | consultado |         |           |           |      | PENDING |
| PC-09 | `payroll.review.finding.reopen`  | Aprovar classificação proposta | HIGH     | RESTRICTED  | Restaura bloqueio operacional                         | requerido | requerido | consultado |         |           |           |      | PENDING |
| PC-10 | `payroll.review.submit`          | Aprovar classificação proposta | HIGH     | RESTRICTED  | Avança ciclo para decisão                             | requerido | requerido | requerido  |         |           |           |      | PENDING |
| PC-11 | `payroll.review.approve`         | Aprovar classificação proposta | CRITICAL | RESTRICTED  | Aprovação formal da folha                             | requerido | requerido | requerido  |         |           |           |      | PENDING |
| PC-12 | `payroll.review.reject`          | Aprovar classificação proposta | HIGH     | RESTRICTED  | Decisão formal de rejeição                            | requerido | requerido | requerido  |         |           |           |      | PENDING |
| PC-13 | `payroll.review.close`           | Aprovar classificação proposta | CRITICAL | RESTRICTED  | Fecha ciclo aprovado                                  | requerido | requerido | requerido  |         |           |           |      | PENDING |
| PC-14 | `payroll.review.reopen`          | Aprovar classificação proposta | CRITICAL | RESTRICTED  | Invalida decisões e reabre ciclo                      | requerido | requerido | requerido  |         |           |           |      | PENDING |
| PC-15 | `payroll.period.close.view`      | Aprovar classificação proposta | MEDIUM   | RESTRICTED  | Consulta resumo de fechamento                         | requerido | requerido | consultado |         |           |           |      | PENDING |
| PC-16 | `payroll.period.close.readiness` | Aprovar classificação proposta | MEDIUM   | RESTRICTED  | Consulta evidências pré-fechamento                    | requerido | requerido | consultado |         |           |           |      | PENDING |
| PC-17 | `payroll.period.close.execute`   | Aprovar classificação proposta | CRITICAL | RESTRICTED  | Fecha competência                                     | requerido | requerido | requerido  |         |           |           |      | PENDING |
| PC-18 | `payroll.period.close.reopen`    | Aprovar classificação proposta | CRITICAL | RESTRICTED  | Reabre competência fechada                            | requerido | requerido | requerido  |         |           |           |      | PENDING |
| PC-19 | `payroll.period.close.history`   | Aprovar classificação proposta | MEDIUM   | RESTRICTED  | Consulta manifesto/timeline                           | requerido | requerido | consultado |         |           |           |      | PENDING |
| PC-20 | Código não classificado          | Aprovar política fail-closed   | N/A      | N/A         | Extra, duplicado, nulo ou pendente bloqueia migration | requerido | requerido | consultado |         |           |           |      | PENDING |
| PC-21 | Novo código futuro               | Aprovar governança prévia      | N/A      | N/A         | Sem insert antes de homologação individual            | requerido | requerido | consultado |         |           |           |      | PENDING |

## Decisão geral

- **Inventário e classificações aprovados:** não preenchido
- **Aprovadores:** não preenchido
- **Condições bloqueadoras:** não avaliadas
- **Evidência/data:** não preenchidas
- **Status geral:** `PENDING`

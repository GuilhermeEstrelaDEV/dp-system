# ETP-015 — Permission Classification Questionnaire

## Instruções

Cada resposta aceita somente `APPROVE`, `REJECT` ou `APPROVE WITH CONDITIONS`. Justificativa,
condição, responsável, prazo, evidência, aprovador e data devem ser preenchidos pelo aprovador humano.
Este documento não contém respostas.

| ID    | Pergunta                                                                                       | Resposta | Justificativa | Condição | Responsável | Prazo | Evidência | Aprovador | Data |
| ----- | ---------------------------------------------------------------------------------------------- | -------- | ------------- | -------- | ----------- | ----- | --------- | --------- | ---- |
| PC-01 | Aprova `platform.read` como MEDIUM/SENSITIVE?                                                  |          |               |          |             |       |           |           |      |
| PC-02 | Aprova `platform.manage` como CRITICAL/RESTRICTED?                                             |          |               |          |             |       |           |           |      |
| PC-03 | Aprova `delegation.manage` como CRITICAL/RESTRICTED?                                           |          |               |          |             |       |           |           |      |
| PC-04 | Aprova `emergency_access.manage` como CRITICAL/RESTRICTED?                                     |          |               |          |             |       |           |           |      |
| PC-05 | Aprova `payroll.review.view` como MEDIUM/RESTRICTED?                                           |          |               |          |             |       |           |           |      |
| PC-06 | Aprova `payroll.review.create` como HIGH/RESTRICTED?                                           |          |               |          |             |       |           |           |      |
| PC-07 | Aprova `payroll.review.finding.create` como HIGH/RESTRICTED?                                   |          |               |          |             |       |           |           |      |
| PC-08 | Aprova `payroll.review.finding.resolve` como HIGH/RESTRICTED?                                  |          |               |          |             |       |           |           |      |
| PC-09 | Aprova `payroll.review.finding.reopen` como HIGH/RESTRICTED?                                   |          |               |          |             |       |           |           |      |
| PC-10 | Aprova `payroll.review.submit` como HIGH/RESTRICTED?                                           |          |               |          |             |       |           |           |      |
| PC-11 | Aprova `payroll.review.approve` como CRITICAL/RESTRICTED?                                      |          |               |          |             |       |           |           |      |
| PC-12 | Aprova `payroll.review.reject` como HIGH/RESTRICTED?                                           |          |               |          |             |       |           |           |      |
| PC-13 | Aprova `payroll.review.close` como CRITICAL/RESTRICTED?                                        |          |               |          |             |       |           |           |      |
| PC-14 | Aprova `payroll.review.reopen` como CRITICAL/RESTRICTED?                                       |          |               |          |             |       |           |           |      |
| PC-15 | Aprova `payroll.period.close.view` como MEDIUM/RESTRICTED?                                     |          |               |          |             |       |           |           |      |
| PC-16 | Aprova `payroll.period.close.readiness` como MEDIUM/RESTRICTED?                                |          |               |          |             |       |           |           |      |
| PC-17 | Aprova `payroll.period.close.execute` como CRITICAL/RESTRICTED?                                |          |               |          |             |       |           |           |      |
| PC-18 | Aprova `payroll.period.close.reopen` como CRITICAL/RESTRICTED?                                 |          |               |          |             |       |           |           |      |
| PC-19 | Aprova `payroll.period.close.history` como MEDIUM/RESTRICTED?                                  |          |               |          |             |       |           |           |      |
| PC-20 | Aprova bloquear migration diante de código extra, duplicado, pendente, nulo ou não homologado? |          |               |          |             |       |           |           |      |
| PC-21 | Aprova exigir classificação homologada antes de todo novo código futuro?                       |          |               |          |             |       |           |           |      |

## Decisão geral

- Segurança homologou todos os riscos: **não preenchido**
- Privacidade/DPO homologou todas as sensibilidades: **não preenchido**
- Produto homologou impactos aplicáveis: **não preenchido**
- Condições bloqueadoras: **não avaliadas**
- Resultado: **PENDING**

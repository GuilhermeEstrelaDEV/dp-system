# ETP-015 — Permission Classification Approval Matrix

## Estado

**APPROVED.** Guilherme Estrela homologou risco, sensibilidade e impactos de Produto em 29/07/2026, sem condições bloqueadoras.
Produto participa das capacidades que aprovam, fecham, reabrem ou administram acesso. Campos humanos
permanecem vazios.

| ID    | Code/regra                       | Recomendação                   | Risk     | Sensitivity | Justificativa                                         | Segurança         | DPO               | Produto           | Decisão  | Condições | Evidência                                   | Data       | Status   |
| ----- | -------------------------------- | ------------------------------ | -------- | ----------- | ----------------------------------------------------- | ----------------- | ----------------- | ----------------- | -------- | --------- | ------------------------------------------- | ---------- | -------- |
| PC-01 | `platform.read`                  | Aprovar classificação proposta | MEDIUM   | SENSITIVE   | Leitura global de estrutura/identidades               | Guilherme Estrela | Guilherme Estrela | N/A               | APPROVED | Nenhuma   | Declaração humana registrada nesta execução | 29/07/2026 | APPROVED |
| PC-02 | `platform.manage`                | Aprovar classificação proposta | CRITICAL | RESTRICTED  | Administração transversal privilegiada                | Guilherme Estrela | Guilherme Estrela | Guilherme Estrela | APPROVED | Nenhuma   | Declaração humana registrada nesta execução | 29/07/2026 | APPROVED |
| PC-03 | `delegation.manage`              | Aprovar classificação proposta | CRITICAL | RESTRICTED  | Transfere capacidades temporariamente                 | Guilherme Estrela | Guilherme Estrela | Guilherme Estrela | APPROVED | Nenhuma   | Declaração humana registrada nesta execução | 29/07/2026 | APPROVED |
| PC-04 | `emergency_access.manage`        | Aprovar classificação proposta | CRITICAL | RESTRICTED  | Acesso emergencial privilegiado                       | Guilherme Estrela | Guilherme Estrela | Guilherme Estrela | APPROVED | Nenhuma   | Declaração humana registrada nesta execução | 29/07/2026 | APPROVED |
| PC-05 | `payroll.review.view`            | Aprovar classificação proposta | MEDIUM   | RESTRICTED  | Consulta dados e histórico de folha                   | Guilherme Estrela | Guilherme Estrela | N/A               | APPROVED | Nenhuma   | Declaração humana registrada nesta execução | 29/07/2026 | APPROVED |
| PC-06 | `payroll.review.create`          | Aprovar classificação proposta | HIGH     | RESTRICTED  | Cria ciclo ligado à folha                             | Guilherme Estrela | Guilherme Estrela | N/A               | APPROVED | Nenhuma   | Declaração humana registrada nesta execução | 29/07/2026 | APPROVED |
| PC-07 | `payroll.review.finding.create`  | Aprovar classificação proposta | HIGH     | RESTRICTED  | Pode bloquear o fluxo                                 | Guilherme Estrela | Guilherme Estrela | N/A               | APPROVED | Nenhuma   | Declaração humana registrada nesta execução | 29/07/2026 | APPROVED |
| PC-08 | `payroll.review.finding.resolve` | Aprovar classificação proposta | HIGH     | RESTRICTED  | Remove bloqueio operacional                           | Guilherme Estrela | Guilherme Estrela | N/A               | APPROVED | Nenhuma   | Declaração humana registrada nesta execução | 29/07/2026 | APPROVED |
| PC-09 | `payroll.review.finding.reopen`  | Aprovar classificação proposta | HIGH     | RESTRICTED  | Restaura bloqueio operacional                         | Guilherme Estrela | Guilherme Estrela | N/A               | APPROVED | Nenhuma   | Declaração humana registrada nesta execução | 29/07/2026 | APPROVED |
| PC-10 | `payroll.review.submit`          | Aprovar classificação proposta | HIGH     | RESTRICTED  | Avança ciclo para decisão                             | Guilherme Estrela | Guilherme Estrela | Guilherme Estrela | APPROVED | Nenhuma   | Declaração humana registrada nesta execução | 29/07/2026 | APPROVED |
| PC-11 | `payroll.review.approve`         | Aprovar classificação proposta | CRITICAL | RESTRICTED  | Aprovação formal da folha                             | Guilherme Estrela | Guilherme Estrela | Guilherme Estrela | APPROVED | Nenhuma   | Declaração humana registrada nesta execução | 29/07/2026 | APPROVED |
| PC-12 | `payroll.review.reject`          | Aprovar classificação proposta | HIGH     | RESTRICTED  | Decisão formal de rejeição                            | Guilherme Estrela | Guilherme Estrela | Guilherme Estrela | APPROVED | Nenhuma   | Declaração humana registrada nesta execução | 29/07/2026 | APPROVED |
| PC-13 | `payroll.review.close`           | Aprovar classificação proposta | CRITICAL | RESTRICTED  | Fecha ciclo aprovado                                  | Guilherme Estrela | Guilherme Estrela | Guilherme Estrela | APPROVED | Nenhuma   | Declaração humana registrada nesta execução | 29/07/2026 | APPROVED |
| PC-14 | `payroll.review.reopen`          | Aprovar classificação proposta | CRITICAL | RESTRICTED  | Invalida decisões e reabre ciclo                      | Guilherme Estrela | Guilherme Estrela | Guilherme Estrela | APPROVED | Nenhuma   | Declaração humana registrada nesta execução | 29/07/2026 | APPROVED |
| PC-15 | `payroll.period.close.view`      | Aprovar classificação proposta | MEDIUM   | RESTRICTED  | Consulta resumo de fechamento                         | Guilherme Estrela | Guilherme Estrela | N/A               | APPROVED | Nenhuma   | Declaração humana registrada nesta execução | 29/07/2026 | APPROVED |
| PC-16 | `payroll.period.close.readiness` | Aprovar classificação proposta | MEDIUM   | RESTRICTED  | Consulta evidências pré-fechamento                    | Guilherme Estrela | Guilherme Estrela | N/A               | APPROVED | Nenhuma   | Declaração humana registrada nesta execução | 29/07/2026 | APPROVED |
| PC-17 | `payroll.period.close.execute`   | Aprovar classificação proposta | CRITICAL | RESTRICTED  | Fecha competência                                     | Guilherme Estrela | Guilherme Estrela | Guilherme Estrela | APPROVED | Nenhuma   | Declaração humana registrada nesta execução | 29/07/2026 | APPROVED |
| PC-18 | `payroll.period.close.reopen`    | Aprovar classificação proposta | CRITICAL | RESTRICTED  | Reabre competência fechada                            | Guilherme Estrela | Guilherme Estrela | Guilherme Estrela | APPROVED | Nenhuma   | Declaração humana registrada nesta execução | 29/07/2026 | APPROVED |
| PC-19 | `payroll.period.close.history`   | Aprovar classificação proposta | MEDIUM   | RESTRICTED  | Consulta manifesto/timeline                           | Guilherme Estrela | Guilherme Estrela | N/A               | APPROVED | Nenhuma   | Declaração humana registrada nesta execução | 29/07/2026 | APPROVED |
| PC-20 | Código não classificado          | Aprovar política fail-closed   | N/A      | N/A         | Extra, duplicado, nulo ou pendente bloqueia migration | Guilherme Estrela | Guilherme Estrela | N/A               | APPROVED | Nenhuma   | Declaração humana registrada nesta execução | 29/07/2026 | APPROVED |
| PC-21 | Novo código futuro               | Aprovar governança prévia      | N/A      | N/A         | Sem insert antes de homologação individual            | Guilherme Estrela | Guilherme Estrela | N/A               | APPROVED | Nenhuma   | Declaração humana registrada nesta execução | 29/07/2026 | APPROVED |

## Decisão geral

- **Inventário e classificações aprovados:** sim, PC-01..PC-21
- **Aprovador:** Guilherme Estrela (Segurança, Privacidade/DPO e Produto)
- **Condições bloqueadoras:** nenhuma
- **Evidência/data:** declaração humana desta execução, 29/07/2026
- **Status geral:** `APPROVED`

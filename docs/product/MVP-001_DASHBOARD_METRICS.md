# MVP-001 — Métricas do dashboard executivo

O dashboard usa somente dados persistidos, autorizados e pertencentes à empresa ativa. Não há
números fixos nem agregação entre empresas. Intervalos de tempo são calculados em UTC e a atividade
recente é limitada a cinco eventos.

| Fonte                                | Métrica ou visualização         | Capability mínima           | Decisão   | Justificativa                                       |
| ------------------------------------ | ------------------------------- | --------------------------- | --------- | --------------------------------------------------- |
| `PayrollReviewCycle`                 | total de ciclos                 | `payroll.review.view`       | `INCLUDE` | semântica e autorização canônicas                   |
| `PayrollReviewFinding`               | achados bloqueantes abertos     | `payroll.review.view`       | `INCLUDE` | indicador operacional já modelado                   |
| `PayrollReviewCycle`                 | ciclos por estado               | `payroll.review.view`       | `INCLUDE` | distribuição pelo enum canônico                     |
| `PayrollReviewEvent`                 | eventos nos seis meses corridos | `payroll.review.view`       | `INCLUDE` | timeline append-only e auditável                    |
| `PayrollReviewEvent`                 | cinco atividades recentes       | `payroll.review.view`       | `INCLUDE` | descrição segura, sem actor ou metadata             |
| `PayrollPeriod`                      | total de competências           | `payroll.period.close.view` | `INCLUDE` | leitura canônica já autorizada                      |
| `PayrollPeriod`                      | competências por estado         | `payroll.period.close.view` | `INCLUDE` | distribuição pelo enum canônico                     |
| colaboradores, contratos e admissões | totais e evolução               | inexistente                 | `DEFER`   | não há capability de leitura homologada             |
| usuários e vínculos                  | totais                          | inexistente                 | `DEFER`   | superfície de identidade sem autorização específica |
| `AuditLog`                           | atividade geral                 | inexistente                 | `REJECT`  | consulta sensível e administrativa fora do MVP      |
| empresas e módulos                   | totais globais                  | inexistente                 | `REJECT`  | violaria o contexto empresarial ativo               |

`DEFER` permite reavaliação após autorização explícita. `REJECT` identifica conteúdo que não
pertence a este dashboard.

Uma resposta executa uma consulta da empresa ativa e, conforme as capabilities, até três consultas
de conferência e uma de competência. Sem capability aplicável, nenhuma consulta de métrica ocorre.
Os filtros usam `companyId`, estado e data, cobertos pelos índices existentes; nenhuma migration foi
necessária. Os seis meses incluem o mês UTC corrente e os cinco anteriores, com zero explícito para
meses sem eventos.

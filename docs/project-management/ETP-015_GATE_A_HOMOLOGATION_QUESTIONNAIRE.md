# ETP-015 Gate A — Homologation Questionnaire

## Registro da resposta humana

- **Aprovador autorizado:** Guilherme Estrela
- **Representação:** Arquitetura, Segurança, Privacidade/DPO, DBA/Operação e Produto
- **Data:** 29/07/2026
- **Evidência:** declaração humana de aprovação registrada nesta execução
- **Condições bloqueadoras:** nenhuma

| ID    | Pergunta objetiva                                                                                           | Resposta | Condição | Responsável       | Prazo         | Evidência                        | Aprovador/assinatura | Data       |
| ----- | ----------------------------------------------------------------------------------------------------------- | -------- | -------- | ----------------- | ------------- | -------------------------------- | -------------------- | ---------- |
| GA-01 | Aprova evoluir `Permission` gradualmente como catálogo canônico, preservando IDs/códigos e compatibilidade? | APPROVED | Nenhuma  | Guilherme Estrela | Não aplicável | Declaração humana desta execução | Guilherme Estrela    | 29/07/2026 |
| GA-02 | Aprova integralmente os campos, tipos, nulabilidade, defaults e mutabilidade propostos para o catálogo?     | APPROVED | Nenhuma  | Guilherme Estrela | Não aplicável | Declaração humana desta execução | Guilherme Estrela    | 29/07/2026 |
| GA-03 | Aprova código `resource.action`, resource composto e enums de scope/risco/sensibilidade/status?             | APPROVED | Nenhuma  | Guilherme Estrela | Não aplicável | Declaração humana desta execução | Guilherme Estrela    | 29/07/2026 |
| GA-04 | Aprova tornar `RolePermission` histórico, com ID, proveniência, vigência e revogação?                       | APPROVED | Nenhuma  | Guilherme Estrela | Não aplicável | Declaração humana desta execução | Guilherme Estrela    | 29/07/2026 |
| GA-05 | Aprova evoluir `UserCompanyRole` sem criar membership ou grant direto nesta etapa?                          | APPROVED | Nenhuma  | Guilherme Estrela | Não aplicável | Declaração humana desta execução | Guilherme Estrela    | 29/07/2026 |
| GA-06 | Aprova a matriz de proveniência e o uso de marcador técnico para legado sem inventar atores?                | APPROVED | Nenhuma  | Guilherme Estrela | Não aplicável | Declaração humana desta execução | Guilherme Estrela    | 29/07/2026 |
| GA-07 | Aprova revogação histórica e reativação exclusivamente por novo registro?                                   | APPROVED | Nenhuma  | Guilherme Estrela | Não aplicável | Declaração humana desta execução | Guilherme Estrela    | 29/07/2026 |
| GA-08 | Aprova UTC e janela semiaberta `[validFrom, validTo)` para todos os assignments?                            | APPROVED | Nenhuma  | Guilherme Estrela | Não aplicável | Declaração humana desta execução | Guilherme Estrela    | 29/07/2026 |
| GA-09 | Aprova exclusion constraint GiST mais validação transacional contra sobreposição?                           | APPROVED | Nenhuma  | Guilherme Estrela | Não aplicável | Declaração humana desta execução | Guilherme Estrela    | 29/07/2026 |
| GA-10 | Aprova PKs, FKs RESTRICT e checks detalhados no pacote?                                                     | APPROVED | Nenhuma  | Guilherme Estrela | Não aplicável | Declaração humana desta execução | Guilherme Estrela    | 29/07/2026 |
| GA-11 | Aprova os índices propostos e a revisão operacional de locks/planos?                                        | APPROVED | Nenhuma  | Guilherme Estrela | Não aplicável | Declaração humana desta execução | Guilherme Estrela    | 29/07/2026 |
| GA-12 | Aprova backfill idempotente, sem grants e com conflitos tratados como bloqueio?                             | APPROVED | Nenhuma  | Guilherme Estrela | Não aplicável | Declaração humana desta execução | Guilherme Estrela    | 29/07/2026 |
| GA-13 | Aprova rollout expand/backfill/shadow/compare antes de qualquer ativação?                                   | APPROVED | Nenhuma  | Guilherme Estrela | Não aplicável | Declaração humana desta execução | Guilherme Estrela    | 29/07/2026 |
| GA-14 | Aprova rollback por etapa e proibição de remoção legada na primeira migration?                              | APPROVED | Nenhuma  | Guilherme Estrela | Não aplicável | Declaração humana desta execução | Guilherme Estrela    | 29/07/2026 |
| GA-15 | Aprova os testes automáticos de zero assignments, zero ampliação e deny-by-default?                         | APPROVED | Nenhuma  | Guilherme Estrela | Não aplicável | Declaração humana desta execução | Guilherme Estrela    | 29/07/2026 |

## Declaração final

- Aprovador responsável pela consolidação: **Guilherme Estrela**
- Condições bloqueadoras abertas: **nenhuma**
- Decisão do Gate A: **APPROVED**
- Data: **29/07/2026**

A homologação aprova integralmente as recomendações técnicas existentes, sem autorizar mudança
funcional fora da implementação controlada posterior.

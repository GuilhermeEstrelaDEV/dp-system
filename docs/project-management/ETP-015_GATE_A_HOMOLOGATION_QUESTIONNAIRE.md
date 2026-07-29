# ETP-015 Gate A — Homologation Questionnaire

## Instruções ao aprovador

Para cada item, selecionar exatamente `APPROVE`, `REJECT` ou `APPROVE WITH CONDITIONS`. Respostas em
branco não aprovam o gate. Condição, responsável, prazo e evidência são obrigatórios quando houver
condição. Este documento inicia sem respostas.

| ID    | Pergunta objetiva                                                                                           | Resposta | Condição | Responsável | Prazo | Evidência | Aprovador/assinatura | Data |
| ----- | ----------------------------------------------------------------------------------------------------------- | -------- | -------- | ----------- | ----- | --------- | -------------------- | ---- |
| GA-01 | Aprova evoluir `Permission` gradualmente como catálogo canônico, preservando IDs/códigos e compatibilidade? |          |          |             |       |           |                      |      |
| GA-02 | Aprova integralmente os campos, tipos, nulabilidade, defaults e mutabilidade propostos para o catálogo?     |          |          |             |       |           |                      |      |
| GA-03 | Aprova código `resource.action`, resource composto e enums de scope/risco/sensibilidade/status?             |          |          |             |       |           |                      |      |
| GA-04 | Aprova tornar `RolePermission` histórico, com ID, proveniência, vigência e revogação?                       |          |          |             |       |           |                      |      |
| GA-05 | Aprova evoluir `UserCompanyRole` sem criar membership ou grant direto nesta etapa?                          |          |          |             |       |           |                      |      |
| GA-06 | Aprova a matriz de proveniência e o uso de marcador técnico para legado sem inventar atores?                |          |          |             |       |           |                      |      |
| GA-07 | Aprova revogação histórica e reativação exclusivamente por novo registro?                                   |          |          |             |       |           |                      |      |
| GA-08 | Aprova UTC e janela semiaberta `[validFrom, validTo)` para todos os assignments?                            |          |          |             |       |           |                      |      |
| GA-09 | Aprova exclusion constraint GiST mais validação transacional contra sobreposição?                           |          |          |             |       |           |                      |      |
| GA-10 | Aprova PKs, FKs RESTRICT e checks detalhados no pacote?                                                     |          |          |             |       |           |                      |      |
| GA-11 | Aprova os índices propostos e a revisão operacional de locks/planos?                                        |          |          |             |       |           |                      |      |
| GA-12 | Aprova backfill idempotente, sem grants e com conflitos tratados como bloqueio?                             |          |          |             |       |           |                      |      |
| GA-13 | Aprova rollout expand/backfill/shadow/compare antes de qualquer ativação?                                   |          |          |             |       |           |                      |      |
| GA-14 | Aprova rollback por etapa e proibição de remoção legada na primeira migration?                              |          |          |             |       |           |                      |      |
| GA-15 | Aprova os testes automáticos de zero assignments, zero ampliação e deny-by-default?                         |          |          |             |       |           |                      |      |

## Declaração final

- Aprovador responsável pela consolidação: **não preenchido**
- Condições bloqueadoras abertas: **não avaliado**
- Decisão do Gate A: **PENDING**
- Data: **não preenchida**

Não assinar esta declaração enquanto qualquer GA estiver sem resposta/evidência ou possuir condição
bloqueadora aberta.

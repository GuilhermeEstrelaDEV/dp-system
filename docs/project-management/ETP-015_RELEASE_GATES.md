# ETP-015 — Release Gates

**Status:** Gates A, B e C aprovados; Gate D `NOT STARTED — NOT APPROVED`

## Governança de evidências

| Gate | Responsável (`R`)                | Aprovadores (`A`)                          | Evidência mínima                                                                                             | Rollback                                        |
| ---- | -------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| A    | Arquitetura/Engenharia           | Segurança                                  | PR documental, schema diff proposto, matriz DAL e ata                                                        | revert documental; nenhuma migration aplicada   |
| B    | Engenharia                       | Segurança                                  | commits em `develop`, suites e relatório de seed/contexto                                                    | plano por incremento preservando JWT/isolamento |
| C    | Engenharia + owner de folha      | Segurança, Produto e DP                    | testes PostgreSQL, contrato, telemetria e aceite P0                                                          | adapter seguro testado; sem regra paralela      |
| D    | owners das famílias + Engenharia | Segurança e Produto; DP/DPO conforme dados | 165 handlers runtime reconciliados com a baseline histórica de 163, métricas, comunicação e Final Acceptance | alias protegido e rollback por família          |

Cada checkbox precisa de link para commit, PR, teste, relatório ou ata e identificação do responsável.
Sem evidência, o resultado binário do item é `FAIL`.

## Gate A — Architecture and Data Model

- [x] especificação e technical design aprovados;
- [x] DAL-01 a DAL-14 rastreadas sem contradição com ADR-007/BDP-009/BDP-014;
- [x] principal, empresa ativa e fronteira global/empresarial definidos;
- [x] modelo de catálogo, assignment, vigência e revogação aprovado;
- [x] constraints, índices, backfill e rollback de migration revisados;
- [x] zero assignment automático e zero autorização por nome de papel;
- [x] pendências de BDP delimitadas e fora do comportamento técnico;
- [x] baseline de schema, rotas, testes e cobertura registrado.

**Saída verificável:** ata/review do desenho, checklist completo e primeiro PR técnico delimitado.

## Gate B — Identity, Company and Capability Foundation

- [x] ETP-015.1 a 015.4 mescladas e verificadas em `develop`;
- [x] token/principal/sessão e trace testados;
- [x] empresa ativa validada por assignment vigente;
- [x] capabilities resolvidas no backend e grants vigentes auditados;
- [x] allowlist pública mínima e deny-by-default testados;
- [x] `401`/`403`/`404` uniformes no envelope global;
- [x] seed cria zero concessão;
- [x] nenhuma família foi ativada em massa.

- **Gate B:** `APPROVED`;
- **Technical verification:** `COMPLETE — 8/8 PASS`;
- **Security approval:** `APPROVED — 2026-08-10`;
- **Gate C:** `APPROVED — SECURITY / PRODUCT / DP — 2026-08-10`;
- **ETP-015.8:** `COMPLETED — POST-MERGE VERIFIED`.

**Evidência consolidada:** [relatório pós-merge](../security/ETP-015_GATE_B_POST_MERGE_EVIDENCE.md)
e [aceite técnico](../security/ETP-015_GATE_B_TECHNICAL_ACCEPTANCE.md). O resultado técnico é
`8 PASS / 0 FAIL`. A decisão humana está no
[registro de aprovação de Segurança](../security/ETP-015_GATE_B_SECURITY_APPROVAL.md).

**Saída verificável:** testes unitários/E2E/PostgreSQL, OpenAPI e relatório pós-merge.

**Evidência candidata da ETP-015.4:** [guards e decorators](../security/ETP-015_4_AUTHORIZATION_GUARDS.md),
[inventário 165/165](../security/ETP-015_4_ROUTE_CLASSIFICATION_INVENTORY.md),
[matriz negativa](../security/ETP-015_4_NEGATIVE_TEST_MATRIX.md) e
[aceite](../security/ETP-015_4_ACCEPTANCE_EVIDENCE.md). A incorporação pelo PR #76 satisfaz o primeiro
checkbox; nenhuma família foi ativada em massa.

**Evidência candidata da ETP-015.5:** [isolamento empresarial](../security/ETP-015_5_ENTERPRISE_QUERY_ISOLATION.md),
[inventário de acesso](../security/ETP-015_5_DATA_ACCESS_INVENTORY.md),
[matriz negativa](../security/ETP-015_5_NEGATIVE_TEST_MATRIX.md) e
[aceite](../security/ETP-015_5_ACCEPTANCE_EVIDENCE.md). À época dessa entrega, o Gate B ainda não era
declarado concluído: a evidência pós-merge e os itens então abertos continuavam necessários.

**Evidência candidata da ETP-015.7:** [fundação de auditoria](../security/ETP-015_7_AUTHORIZATION_AUDIT_EVENTS.md),
[catálogo](../security/ETP-015_7_AUDIT_EVENT_CATALOG.md),
[inventário](../security/ETP-015_7_AUDIT_COVERAGE_INVENTORY.md),
[matriz negativa](../security/ETP-015_7_NEGATIVE_TEST_MATRIX.md) e
[aceite](../security/ETP-015_7_ACCEPTANCE_EVIDENCE.md). A entrega cobre decisões efetivas e grants
usados em escritas críticas; à época, o Gate B permanecia aberto até a evidência pós-merge
consolidada.

## Sequência governada entre ETP-015.7 e ETP-015.6

- a entrada da ETP-015.7 exige a ETP-015.5 implementada e as ETP-015.1–015.4 disponíveis;
- a ETP-015.7 não exige a ETP-015.6: ela estabelece a fundação atômica de auditoria e cobre escritas
  críticas canônicas;
- somente leituras sensíveis com classificação material previamente aprovada podem ser auditadas na
  ETP-015.7;
- a entrada da ETP-015.6 exige a fundação da ETP-015.7 disponível, e nenhuma leitura sensível pode ser
  ativada sem a auditoria correspondente;
- a ETP-015.6 reutiliza o writer, catálogo, envelope, sanitizador e atomicidade da ETP-015.7, sem
  implementação paralela;
- a ETP-015.8 depende das duas etapas concluídas na ordem ETP-015.7 → ETP-015.6.

### Resultado do gate de classificação da ETP-015.6

O [relatório de classificação](../security/ETP-015_6_CLASSIFICATION_GATE_REPORT.md) originou o
[pacote de decisão](../security/ETP-015_6_FIELD_CLASSIFICATION_DECISION_PACKAGE.md). Em 2026-08-08, o
`PROJECT_OWNER` homologou 110/110 FCs, as capabilities limitadas aos contratos `MINIMAL`, AR-01..10 e
CP-01..06. A [reconciliação](../security/ETP-015_6_IMPLEMENTATION_READINESS_RECONCILIATION.md) marcou
as cinco famílias como prontas para implementação mínima controlada. BDP-001/011 continuam pendentes
para campos omitidos e exposições futuras. A ETP-015.6 está
`IMPLEMENTED — APPROVED MINIMAL DATA PROJECTION AVAILABLE`: as 33 rotas usam `MINIMAL`, somente AR-03
foi ativado e CP-01..06 foram aplicadas. Essa era a baseline anterior ao início da ETP-015.8.

O Gate B foi aprovado posteriormente por Segurança em 2026-08-10. Historicamente, essa decisão não
aprovava os Gates C ou D. O Gate C foi homologado separadamente pelos três aprovadores obrigatórios
em 2026-08-10; Gate D permanece não aprovado, nenhum incremento produtivo foi iniciado e nenhum
requisito de segurança foi flexibilizado.

## Gate C — P0 Migration and Security Validation

**Status:** `GATE C — APPROVED`. Os oito itens técnicos estão `PASS`, e Segurança, Produto e DP
aprovaram o recorte em 2026-08-10. As evidências estão em
[ETP-015_GATE_C_TECHNICAL_EVIDENCE.md](../security/ETP-015_GATE_C_TECHNICAL_EVIDENCE.md), e a decisão
humana está no
[registro formal](../security/ETP-015_GATE_C_HUMAN_APPROVAL.md).

- **Technical verification:** `COMPLETE — 8/8 PASS`;
- **Security:** `APPROVED — 2026-08-10`;
- **Product:** `APPROVED — 2026-08-10`;
- **DP:** `APPROVED — 2026-08-10`;
- **Gate C:** `APPROVED`.

- [x] consumidores conhecidos e potenciais de `/payroll-closures` registrados;
- [x] adapter preserva contrato necessário e delega exclusivamente ao canônico;
- [x] cinco capabilities de fechamento aplicadas sem assignment automático;
- [x] isolamento antes do lookup e testes com duas empresas aprovados;
- [x] close/reopen/readiness/history mantêm lock, idempotência e evidência;
- [x] escrita, evento e `AuditLog` são atômicos;
- [x] telemetria não contém PII, token, body ou query integrais;
- [x] rollback testado sem remover JWT, empresa ou isolamento;
- [x] revisão de Segurança, Produto e DP registrada.

O PR #86 foi incorporado à `develop` pelo commit
`b8324037b053b947692992d698888ed6e73db5f2`. A
[verificação pós-merge](../security/ETP-015_8_POST_MERGE_VERIFICATION.md) confirmou todos os
invariantes sem regressão. Essa conclusão não aprova o Gate D nem inicia a ETP-015.9.

**Saída verificável:** suíte P0 verde em PostgreSQL 16, relatório de segurança e janela aprovada.

## Gate D — Legacy Rollout and Production Readiness

**Status:** `NOT STARTED — NOT APPROVED`. A aprovação do Gate C não inicia ETP-015.9/015.10, não
remove legado e não autoriza produção, cloud ou deploy.

O [pacote de decisão de entrada da ETP-015.9](../security/ETP-015_9_ENTRY_DECISION_PACKAGE.md)
registra ED-01–ED-06 em 2026-08-12. As decisões preservam/deferem Residual P0, impedem expansão de
capability/dados/auditoria, mantêm owners pendentes, registram Company somente como primeira
candidata e aprovam P4 apenas para preservação/reconciliação. Nenhum checkbox abaixo foi concluído,
nenhum rollout funcional foi autorizado e o Gate D não foi iniciado.

- [ ] cada família tem owner, BDPs, capabilities, sensibilidade e auditoria definidos;
- [ ] os 165 handlers runtime estão classificados e reconciliados com código/OpenAPI e com os 163
      registros da baseline histórica, incluindo as duas superfícies posteriores explícitas;
- [ ] cada rota empresarial possui JWT, capability e testes `401`/`403`/`404`;
- [ ] nenhuma query empresarial confia em `companyId` do cliente;
- [ ] masking e leitura sensível seguem matriz aprovada;
- [ ] métricas, alertas, incident response e critérios de interrupção estão ativos;
- [ ] comunicação e janela de depreciação possuem evidência;
- [ ] aliases restantes estão protegidos e delegam ao canônico;
- [ ] cobertura, performance, hardening e `pnpm check` estão preservados;
- [ ] remoção futura foi separada em PR/iniciativa própria.

**Saída verificável:** Final Acceptance da ETP-015. O gate não remove legado automaticamente.

## Regra de avanço

Gate incompleto mantém a próxima etapa bloqueada. Evidência deve apontar para commit, PR, teste ou ata;
declaração sem referência não satisfaz item. Rollback jamais pode reintroduzir acesso anônimo,
autoridade do `companyId` cliente, lookup cruzado ou regra paralela de fechamento.

### Critérios quantitativos transversais

- Gate A: 14/14 DALs `COVERED`; 0 `PARTIAL`, `MISSING` ou `CONFLICT`.
- Gate B: 100% das rotas do recorte declaradas públicas ou com JWT/capability; seed com 0 assignment.
- Gate C: 100% das rotas P0 com testes `401`/`403`/`404`, duas empresas e rollback; 0 regra paralela.
- Gate D: 165 handlers runtime reconciliados com a baseline histórica de 163 e suas duas adições
  explícitas; 0 rota empresarial implícita; 0 capability sem documentação.

Os itens qualitativos “aprovado”, “revisado” e “estável” só passam quando acompanhados da evidência e
do aprovador definidos na tabela de governança.

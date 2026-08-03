# ETP-015 — Release Gates

**Status:** Gate A aprovado; ETP-015.4–015.5 implementadas e Gate B ainda em formação; Gates C e D não iniciados

## Governança de evidências

| Gate | Responsável (`R`)                | Aprovadores (`A`)                          | Evidência mínima                                             | Rollback                                        |
| ---- | -------------------------------- | ------------------------------------------ | ------------------------------------------------------------ | ----------------------------------------------- |
| A    | Arquitetura/Engenharia           | Segurança                                  | PR documental, schema diff proposto, matriz DAL e ata        | revert documental; nenhuma migration aplicada   |
| B    | Engenharia                       | Segurança                                  | commits em `develop`, suites e relatório de seed/contexto    | plano por incremento preservando JWT/isolamento |
| C    | Engenharia + owner de folha      | Segurança, Produto e DP                    | testes PostgreSQL, contrato, telemetria e aceite P0          | adapter seguro testado; sem regra paralela      |
| D    | owners das famílias + Engenharia | Segurança e Produto; DP/DPO conforme dados | inventário 163/163, métricas, comunicação e Final Acceptance | alias protegido e rollback por família          |

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
- [ ] token/principal/sessão e trace testados;
- [ ] empresa ativa validada por assignment vigente;
- [ ] capabilities resolvidas no backend e grants vigentes auditados;
- [ ] allowlist pública mínima e deny-by-default testados;
- [ ] `401`/`403`/`404` uniformes no envelope global;
- [ ] seed cria zero concessão;
- [ ] nenhuma família foi ativada em massa.

**Saída verificável:** testes unitários/E2E/PostgreSQL, OpenAPI e relatório pós-merge.

**Evidência candidata da ETP-015.4:** [guards e decorators](../security/ETP-015_4_AUTHORIZATION_GUARDS.md),
[inventário 165/165](../security/ETP-015_4_ROUTE_CLASSIFICATION_INVENTORY.md),
[matriz negativa](../security/ETP-015_4_NEGATIVE_TEST_MATRIX.md) e
[aceite](../security/ETP-015_4_ACCEPTANCE_EVIDENCE.md). A incorporação pelo PR #76 satisfaz o primeiro
checkbox; nenhuma família foi ativada em massa.

**Evidência candidata da ETP-015.5:** [isolamento empresarial](../security/ETP-015_5_ENTERPRISE_QUERY_ISOLATION.md),
[inventário de acesso](../security/ETP-015_5_DATA_ACCESS_INVENTORY.md),
[matriz negativa](../security/ETP-015_5_NEGATIVE_TEST_MATRIX.md) e
[aceite](../security/ETP-015_5_ACCEPTANCE_EVIDENCE.md). O Gate B não é declarado concluído nesta
entrega: o pós-merge e os itens ainda abertos continuam necessários.

## Gate C — P0 Migration and Security Validation

- [ ] consumidores conhecidos e potenciais de `/payroll-closures` registrados;
- [ ] adapter preserva contrato necessário e delega exclusivamente ao canônico;
- [ ] cinco capabilities de fechamento aplicadas sem assignment automático;
- [ ] isolamento antes do lookup e testes com duas empresas aprovados;
- [ ] close/reopen/readiness/history mantêm lock, idempotência e evidência;
- [ ] escrita, evento e `AuditLog` são atômicos;
- [ ] telemetria não contém PII, token, body ou query integrais;
- [ ] rollback testado sem remover JWT, empresa ou isolamento;
- [ ] revisão de Segurança, Produto e DP registrada.

**Saída verificável:** suíte P0 verde em PostgreSQL 16, relatório de segurança e janela aprovada.

## Gate D — Legacy Rollout and Production Readiness

- [ ] cada família tem owner, BDPs, capabilities, sensibilidade e auditoria definidos;
- [ ] todas as 163 rotas estão classificadas e reconciliadas com o código/OpenAPI;
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
- Gate D: 163/163 handlers reconciliados; 0 rota empresarial implícita; 0 capability sem documentação.

Os itens qualitativos “aprovado”, “revisado” e “estável” só passam quando acompanhados da evidência e
do aprovador definidos na tabela de governança.

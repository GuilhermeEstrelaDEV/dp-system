# ETP-015 — Release Gates

**Status:** proposto; nenhum gate técnico liberado por esta especificação

## Gate A — Architecture and Data Model

- [ ] especificação e technical design aprovados;
- [ ] DAL-01 a DAL-14 rastreadas sem contradição com ADR-007/BDP-009/BDP-014;
- [ ] principal, empresa ativa e fronteira global/empresarial definidos;
- [ ] modelo de catálogo, assignment, vigência e revogação aprovado;
- [ ] constraints, índices, backfill e rollback de migration revisados;
- [ ] zero assignment automático e zero autorização por nome de papel;
- [ ] pendências de BDP delimitadas e fora do comportamento técnico;
- [ ] baseline de schema, rotas, testes e cobertura registrado.

**Saída verificável:** ata/review do desenho, checklist completo e primeiro PR técnico delimitado.

## Gate B — Identity, Company and Capability Foundation

- [ ] ETP-015.1 a 015.4 mescladas e verificadas em `develop`;
- [ ] token/principal/sessão e trace testados;
- [ ] empresa ativa validada por assignment vigente;
- [ ] capabilities resolvidas no backend e grants vigentes auditados;
- [ ] allowlist pública mínima e deny-by-default testados;
- [ ] `401`/`403`/`404` uniformes no envelope global;
- [ ] seed cria zero concessão;
- [ ] nenhuma família foi ativada em massa.

**Saída verificável:** testes unitários/E2E/PostgreSQL, OpenAPI e relatório pós-merge.

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

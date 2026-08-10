# ETP-015 — Gate B Post-Merge Evidence

- **Baseline:** `origin/develop@bdc02e4bebb872cffe3968b7c0d2c473eef4f2d5`;
- **PR incorporado:** [#84](https://github.com/GuilhermeEstrelaDEV/dp-system/pull/84);
- **Data da verificação:** 10/08/2026;
- **Responsável técnico:** Engenharia;
- **Aprovador do Gate B:** Segurança;
- **Resultado técnico:** `8 PASS / 0 FAIL`.

Esta evidência consolida o estado pós-merge das ETP-015.1 a ETP-015.7. Ela não aprova o Gate B,
não inicia o Gate C e não inicia a ETP-015.8.

## Resultado binário

| Gate B item                         | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                        | Result | Residual risk                                                                                                                |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------- |
| 1. ETP-015.1..015.4 em `develop`    | PRs #53, #55, #61 e #76 presentes no histórico; merges `dac460d8`, `70dd0360`, `69072ee` e `1cab4ae`; [backlog](../project-management/ETP-015_IMPLEMENTATION_BACKLOG.md) e regressão `pnpm check`                                                                                                                                                                                                                                               | PASS   | Follow-ups de sessão e provenance permanecem documentados; não houve revert posterior.                                       |
| 2. Token/principal/session/trace    | 16 suítes direcionadas, 89 testes; [identity session](../../apps/api/src/modules/auth/identity-session.service.spec.ts), [identity context](../../apps/api/src/modules/auth/identity-context.integration.spec.ts), [JWT](../../apps/api/src/modules/auth/jwt.strategy.spec.ts), [HTTP auth context](../../apps/api/test/auth-context.e2e-spec.ts) e [frontend auth](../../apps/web/src/features/auth/auth.test.tsx)                             | PASS   | Modelo dedicado de sessão, issuer/audience, refresh, revogação global e identidades técnicas continuam follow-ups.           |
| 3. Active company                   | [resolver](../../apps/api/src/modules/auth/active-company-resolver.service.spec.ts), [application context](../../apps/api/src/modules/auth/application-context.service.spec.ts), [company selection](../../apps/api/src/modules/auth/company-selection.service.spec.ts), 14 testes HTTP e 11 testes PostgreSQL com duas empresas                                                                                                                | PASS   | Modelo atual permanece `SUFFICIENT WITH FOLLOW-UP`; `companyId` do cliente não é autoridade.                                 |
| 4. Capabilities/grants              | Seed limpo: 19 capabilities, 7 roles, 0 role assignments, 0 company assignments, 0 substitutions e 0 emergency access; [catálogo](../../apps/api/src/modules/auth/capability-catalog.service.spec.ts), [governança](../../apps/api/src/modules/auth/assignment-governance.service.spec.ts), [grants](../../apps/api/src/modules/auth/access-grants.service.spec.ts) e [auditoria](../../apps/api/test/authorization-audit.postgres.e2e-spec.ts) | PASS   | Concessões reais dependem de aprovação operacional explícita; AR-03 apenas audita leitura e não concede acesso.              |
| 5. Public allowlist/deny-by-default | [verificador](../../apps/api/src/modules/auth/route-classification-verifier.spec.ts), [política](../../apps/api/src/modules/auth/route-access-policy.spec.ts), [inventário](ETP-015_4_ROUTE_CLASSIFICATION_INVENTORY.md): 4 públicas, 5 autenticadas, 27 por capability e 129 `LEGACY_DEFERRED`                                                                                                                                                 | PASS   | Os 129 handlers adiados não são declarados seguros nem migrados.                                                             |
| 6. `401`/`403`/`404`                | 14 testes HTTP em três suítes; [matriz ETP-015.4](ETP-015_4_NEGATIVE_TEST_MATRIX.md), [matriz ETP-015.5](ETP-015_5_NEGATIVE_TEST_MATRIX.md) e [matriz ETP-015.6](ETP-015_6_NEGATIVE_TEST_MATRIX.md); envelope sem stack, erro Prisma, ID estrangeiro ou detalhes de policy                                                                                                                                                                      | PASS   | Novas famílias deverão repetir a matriz antes de ativação.                                                                   |
| 7. Seed zero grant                  | PostgreSQL 16.14 limpo, 16 migrations e seed padrão: `users=0`, `roles=7`, `capabilities=19`, `role_assignments=0`, `company_assignments=0`, `substitutions=0`, `emergency_access=0`; [contrato do seed](../../apps/api/src/modules/auth/demo-seed.contract.spec.ts)                                                                                                                                                                            | PASS   | O dataset demo possui três vínculos empresariais explícitos, mas mantém zero `RolePermission`; não representa o seed padrão. |
| 8. Nenhuma família ativada em massa | [inventário de rotas](ETP-015_4_ROUTE_CLASSIFICATION_INVENTORY.md), [catálogo de projeções](../../apps/api/src/modules/auth/approved-minimal-projection.verifier.spec.ts) e [aceite da ETP-015.6](ETP-015_6_ACCEPTANCE_EVIDENCE.md): somente 33 endpoints canônicos em cinco famílias usam `MINIMAL`; 129 permanecem adiados                                                                                                                    | PASS   | Payroll Closure P0, Gate C, ETP-015.8, ETP-015.9 e ETP-015.10 continuam não iniciados.                                       |

## Execuções pós-merge

### Regressão e cobertura

- `pnpm check`: PASS;
- API: 74 suítes e 344 testes PASS; 6 suítes/25 testes condicionais ignorados;
- frontend: 22 arquivos e 80 testes PASS;
- scripts: 28/28 PASS;
- cobertura API: 73,73% linhas/statements, 71,91% branches e 50,23% functions;
- cobertura frontend: 77,80% linhas/statements, 73,91% branches e 62,37% functions;
- build, Prisma Client e `prisma validate`: PASS.

### Evidência direcionada

- 16 suítes de identidade/autorização: 89/89 testes PASS;
- três suítes HTTP: 14/14 testes PASS;
- route classification, authorization audit e projection verifiers: 3/3 PASS;
- OpenAPI 3.0: 120 paths e bearer security scheme; as 33 rotas canônicas permanecem no manifesto
  fechado da projeção mínima;
- tentativas de `FULL`, `fields=*` ou header de profile não ampliam resposta; campos extras são
  rejeitados pelo `ValidationPipe`.

### PostgreSQL 16

O ensaio usou PostgreSQL 16.14 em banco temporário, removido após a execução. As 16 migrations foram
aplicadas do zero, o seed padrão foi executado e três suítes PostgreSQL totalizaram 11/11 testes PASS
para catálogo, isolamento com duas empresas e auditoria transacional. Nenhum dado permanente foi
criado.

### Demo

- `demo:status`: PostgreSQL, Redis, API e frontend saudáveis;
- `demo:data:verify`: 2 empresas, 19 permissions, 3 vínculos empresariais explícitos e 0
  `RolePermission`;
- `demo:verify`: `GO`;
- `demo:rehearse`: `GO`;
- `presentation:verify`: 15 slides, 15 notas, 6 imagens, sem placeholder, segredo, dado pessoal ou URL
  externa.

## Limites e risco residual

- BDP-001 e BDP-011 permanecem pendentes para exposições futuras;
- o Operational Deployment Gate da ETP-015.3 permanece pendente para ambientes de destino;
- o `format:check` global de `develop` lista 418 arquivos históricos fora do formato atual. Esta
  entrega valida Prettier somente nos documentos alterados e não modifica runtime para corrigir o
  baseline;
- ETP-015.8 está bloqueada até aprovação humana do Gate B por Segurança;
- nenhum resultado deste documento substitui a aprovação humana.

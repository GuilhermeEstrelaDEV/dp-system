# ETP-015 — Gate B Technical Acceptance

## Status

**GATE B — TECHNICALLY VERIFIED — READY FOR SECURITY APPROVAL**

**Human approval:** `PENDING — SECURITY`

Este documento não marca o Gate B como `APPROVED`, `PASSED` ou `CLOSED`.

## Baseline e rastreabilidade

- baseline: `origin/develop@bdc02e4bebb872cffe3968b7c0d2c473eef4f2d5`;
- PR #84: `MERGED` em 10/08/2026, CI verde;
- merge commit: `bdc02e4bebb872cffe3968b7c0d2c473eef4f2d5`;
- incrementos usados: PRs #53, #55, #61, #76, #77, #79/#78/#81/#83 e #84;
- consolidação binária: [8 PASS / 0 FAIL](ETP-015_GATE_B_POST_MERGE_EVIDENCE.md).

## Aceite técnico

| Área                        | Evidência pós-merge                                                                                                                                                                      | Resultado |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| Principal, token e sessão   | JWT válido/ausente/inválido/expirado, usuário inexistente/inativo, sessão revogada, trace, troca de empresa, logout e restore cobertos por testes unitários, integração, HTTP e frontend | PASS      |
| Empresa ativa               | Assignment vigente, vínculo ausente/revogado, empresa inexistente/cross-tenant, autoridade canônica e cache por empresa verificados com duas empresas                                    | PASS      |
| Capabilities e grants       | Catálogo com 19 códigos; vigência, expiração, revogação, empresa e auditoria verificadas; zero concessão automática                                                                      | PASS      |
| Allowlist e deny-by-default | 165/165 handlers classificados: 4 públicos, 5 autenticados, 27 por capability e 129 adiados                                                                                              | PASS      |
| Envelope HTTP               | `401`, `403` e `404` uniformes, sem enumeração empresarial nem detalhes internos                                                                                                         | PASS      |
| Seed                        | PostgreSQL limpo com 16 migrations, 19 capabilities e zero assignments/grants/substituições/emergency access                                                                             | PASS      |
| Auditoria                   | Catálogo fechado com 27 eventos; writer único, metadata por allowlist, decisão efetiva e rollback atômico                                                                                | PASS      |
| Projeção mínima             | 110/110 FCs em 33 endpoints, cinco famílias, `MINIMAL`, AR-03 e CP-01..06; zero `FULL`, `MASKED` ou masking                                                                              | PASS      |

## Suites e plataformas

- `pnpm check`, build, Prisma generate/validate e cobertura: PASS;
- API: 74 suítes/344 testes; frontend: 22 arquivos/80 testes; scripts: 28 testes;
- direcionados: 89 testes unitários, 14 HTTP, 11 PostgreSQL e 3 verificadores;
- PostgreSQL: 16.14, 16 migrations, banco limpo e removido após o ensaio;
- OpenAPI: versão 3.0, 120 paths, bearer scheme e manifesto mínimo fechado;
- demo: status saudável, data verify PASS, verify/rehearse `GO` e apresentação válida.

## Decisões preservadas

- BDP-014: `APPROVED — VERSION 1`;
- DAL-01..DAL-14: `APPROVED`;
- DAL-09: adapters temporários delegam exclusivamente à regra canônica;
- DAL-10: rollout família por família;
- DAL-11: rollback preserva autenticação, empresa ativa e isolamento;
- DAL-12: legado não é removido sem comunicação, telemetria, evidência e janela;
- DAL-13: grants explícitos, temporários, expiráveis e auditados;
- DAL-14: Payroll Closure P0 é o primeiro recorte técnico.

## Riscos residuais e decisão humana

- BDP-001/011 e follow-ups de sessão permanecem fora do escopo;
- 129 handlers `LEGACY_DEFERRED` não são declarados protegidos;
- a ETP-015.3 ainda requer homologação operacional em ambiente de destino antes de uso equivalente;
- Segurança deve revisar as evidências e registrar decisão humana explícita.

Até essa aprovação, Gate C e ETP-015.8 permanecem `NOT STARTED`. A aprovação técnica registrada aqui
não autoriza implementação, rollout, migration ou alteração runtime.

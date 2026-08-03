# ETP-015.5 — Evidências de aceite

## Escopo comprovado

- scope empresarial imutável e independente de Express;
- companyId derivado exclusivamente do contexto ativo canônico;
- dashboard, grants e assignments empresariais com ports/repositories explícitos;
- list/detail/create/update/aggregate e relações testados;
- `401`, `403` e `404` uniforme em API;
- verifier de anti-patterns para os módulos migrados;
- payroll review/period revisados como já conformes;
- 129 handlers legados preservados.

## Evidências locais concluídas

| Evidência                        | Resultado                            |
| -------------------------------- | ------------------------------------ |
| testes unitários direcionados    | `PASS — 8 suítes / 35 testes`        |
| API E2E de isolamento            | `PASS — 1 suíte / 3 testes`          |
| PostgreSQL 16 limpo              | `PASS — 16/16 migrations + seed`     |
| PostgreSQL E2E Horizonte/Atlas   | `PASS — 1 suíte / 5 testes`          |
| rollback transacional            | `PASS — zero linha residual`         |
| fixtures PostgreSQL              | `REMOVED`; banco temporário removido |
| typecheck incremental da API     | `PASS`                               |
| migrations/Prisma/seed funcional | `0 / 0 / 0`                          |

## Performance e planos

As queries relevantes usam predicates indexáveis por empresa. O `EXPLAIN ANALYZE` final registra os
seguintes resultados no PostgreSQL 16 local:

| Operação                       | Plano empresarial principal                                        | Tempo de execução |
| ------------------------------ | ------------------------------------------------------------------ | ----------------: |
| assignment vigente             | index scan com `company_id` + `status`                             |          0,282 ms |
| aggregate de ciclos por status | index-only scan `payroll_review_cycles_company_status_idx`         |          0,164 ms |
| substituições ativas           | index scan com `company_id` + `status`, seguido de ordenação vazia |          0,132 ms |

O volume é demonstrativo e não serve como benchmark de produção. Nenhuma evidência justificou índice
ou migration adicional.

## Regressão final

- `pnpm check`: `PASS` (lint, typecheck, testes, build e Prisma validate);
- API: 68 suítes e 315 testes aprovados, além de 5 suítes/22 testes condicionais ignorados fora do
  banco controlado;
- frontend: 21 arquivos e 76 testes aprovados;
- cobertura API: 72,61% linhas, 70,69% branches, 50,82% funções;
- cobertura frontend: 77,50% linhas, 74,15% branches, 61,89% funções;
- Prisma generate/validate: `PASS`;
- demo data/verify/rehearse: `PASS — DEMO STATUS: GO`;
- apresentação: `PASS — 15 slides, links válidos e zero segredo`;
- Prettier, links Markdown e `git diff --check`: `PASS`.

## Limites

- nenhuma família legada foi migrada;
- não há paginação/busca/cursor/cache nas operações migradas;
- masking e auditoria funcional continuam fora do escopo;
- ETP-015.6 e ETP-015.7 permanecem `NOT STARTED`.

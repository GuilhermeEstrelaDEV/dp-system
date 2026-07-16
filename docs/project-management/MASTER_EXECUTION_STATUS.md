# Status mestre de execução

## ETP-006 — Admissão e checklist admissional

- **Status:** concluída e mergeada em `develop`
- **Branch:** `feature/admission-workflow` (local e remota excluídas após o merge)
- **Base:** `develop` em `21c1ef6`
- **Migration prevista:** `0004_admission_workflow`
- **Escopo ativo:** processo admissional, templates e instâncias de checklist, requisitos documentais lógicos, prazos internos e telas demonstrativas.
- **Restrições preservadas:** sem eSocial, arquivos reais, OCR, assinatura eletrônica, notificações externas ou dados pessoais/documentais reais.
- **Pendências de negócio:** documentos obrigatórios, prazos legais e responsáveis reais permanecem dependentes de validação de DP; serão registrados em `BUSINESS_DECISIONS_PENDING.md`.
- **Commits já criados:** `9df03f1 feat(db): add admission workflow schema`; `19c8c1d feat(api): add admission workflow endpoints`; `8c60c0f feat(web): add admission workflow screens`; `1d5c5ef style: format existing project sources`.
- **Concluído nesta execução:** schema Prisma e migration `0004_admission_workflow`; módulos de processos, templates, instâncias/itens de checklist e documentos lógicos; rotas de detalhes, criação/edição, checklist, documentos e templates; testes unitários dos serviços; documentação transversal e de módulo.
- **Formatação:** o `format:check` apontou 20 arquivos históricos do ETP-005 após a exclusão explícita de Prisma/SQL, sem parser no projeto. Eles receberam apenas formatação mecânica, e `format:check` passou globalmente.
- **Validações aprovadas:** `prisma:validate`, `format:check`, `lint`, `typecheck`, `test` (26 API + 18 web), `test:coverage`, `build`, `check`, `install --frozen-lockfile` e `git diff --check`.
- **Arquivos concluídos:** schema e migration, quatro módulos NestJS, testes unitários, telas de admissões/checklist/documentos/templates, documentação e formatação global.
- **Pull Request e merge:** PR #19 mergeado em `develop` no commit `e3ca780`.
- **Validação final:** o merge foi confirmado em `origin/develop`; branch de feature ausente localmente e no remoto.
- **Próximo passo exato:** iniciar a ETP-007 a partir de `develop` sincronizada, criando `feature/attendance-time-balance`.

## ETP-007 — Jornada e banco de horas

- **Status:** concluída e mergeada em `develop`
- **Branch:** `feature/attendance-time-balance` (local e remota excluídas após o merge)
- **Base:** `develop` em `35303d6`
- **Migration prevista:** `0005_attendance_time_balance`
- **Commits já criados:** `42d2bb9 feat(db): add attendance and time balance schema`; `6cb82fe feat(api): add attendance and time balance modules`; `1d8ec34 feat(web): add attendance management screens`.
- **Validações aprovadas:** `pnpm.cmd prisma:validate`, `pnpm.cmd prisma:generate`, `pnpm.cmd --filter api typecheck` e `pnpm.cmd --filter api test -- time-management.service.spec.ts` (3 testes aprovados).
- **Concluído adicionalmente:** feature React `time-management` em `/jornada`, com jornadas, ocorrências, consulta de saldo derivado e fechamento demonstrativo; teste de interface e documentação do módulo.
- **Validações adicionais aprovadas:** `pnpm.cmd --filter web typecheck` e `pnpm.cmd --filter web test -- time-management.test.tsx` (1 teste aprovado).
- **Concluído adicionalmente:** README, roadmap e guia de desenvolvimento documentam o recorte de jornada.
- **Arquivos pendentes:** validações globais e fluxo Git.
- **Validações adicionais aprovadas:** `pnpm.cmd format:check` após formatação mecânica dos arquivos históricos apontados pelo verificador; `pnpm.cmd lint`; `pnpm.cmd typecheck`; `pnpm.cmd test` (15 suítes/29 testes API e 7 arquivos/19 testes web); `pnpm.cmd test:coverage` (mesmas 15 suítes/29 testes API e 7 arquivos/19 testes web); `pnpm.cmd build`; `pnpm.cmd check`; `pnpm.cmd install --frozen-lockfile`; `git diff --check`.
- **Falha atual:** nenhuma; a execução agregada anterior excedeu o limite antes de retornar resultado completo.
- **Arquivos concluídos:** schema/migration, módulo NestJS, APIs, testes unitários, frontend demonstrativo, documentação de módulo e documentação transversal.
- **Pull Request e merge:** PR #20 mergeado em `develop` no commit `dcf1fbd`.
- **Validação final:** merge confirmado em `origin/develop`; branch de feature excluída localmente e no remoto.
- **Próximo passo exato:** iniciar ETP-008 a partir de `develop` sincronizada, criando `feature/employee-benefits`.

## ETP-008 — Benefícios

- **Status:** em preparação
- **Branch prevista:** `feature/employee-benefits`
- **Migration prevista:** `0006_employee_benefits`
- **Próximo passo exato:** criar a branch da ETP-008 e modelar catálogo, planos, adesões vigentes e histórico de benefícios, sem integração com operadoras ou cálculo de folha.

## ETP-009 a ETP-015

- **Status:** pendentes; cada etapa será iniciada somente após o merge da anterior em `develop`.

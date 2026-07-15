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

- **Status:** em preparação
- **Branch prevista:** `feature/attendance-time-balance`
- **Migration prevista:** `0005_attendance_time_balance`
- **Próximo passo exato:** criar a branch da ETP-007, registrar a base de `develop` e iniciar a implementação de jornadas, ocorrências e livro de movimentos do banco de horas.

## ETP-008 a ETP-015

- **Status:** pendentes; cada etapa será iniciada somente após o merge da anterior em `develop`.

# Status mestre de execução

## ETP-006 — Admissão e checklist admissional

- **Status:** implementação concluída localmente; aguardando commits restantes e publicação do Pull Request
- **Branch:** `feature/admission-workflow`
- **Base:** `develop` em `21c1ef6`
- **Migration prevista:** `0004_admission_workflow`
- **Escopo ativo:** processo admissional, templates e instâncias de checklist, requisitos documentais lógicos, prazos internos e telas demonstrativas.
- **Restrições preservadas:** sem eSocial, arquivos reais, OCR, assinatura eletrônica, notificações externas ou dados pessoais/documentais reais.
- **Pendências de negócio:** documentos obrigatórios, prazos legais e responsáveis reais permanecem dependentes de validação de DP; serão registrados em `BUSINESS_DECISIONS_PENDING.md`.
- **Commits já criados:** `9df03f1 feat(db): add admission workflow schema`; `19c8c1d feat(api): add admission workflow endpoints`.
- **Concluído nesta execução:** schema Prisma e migration `0004_admission_workflow`; módulos de processos, templates, instâncias/itens de checklist e documentos lógicos; rotas de detalhes, criação/edição, checklist, documentos e templates; testes unitários dos serviços; documentação transversal e de módulo.
- **Formatação:** o `format:check` apontou 20 arquivos históricos do ETP-005 após a exclusão explícita de Prisma/SQL, sem parser no projeto. Eles receberam apenas formatação mecânica, e `format:check` passou globalmente.
- **Validações aprovadas:** `prisma:validate`, `format:check`, `lint`, `typecheck`, `test` (26 API + 18 web), `test:coverage`, `build`, `check`, `install --frozen-lockfile` e `git diff --check`.
- **Arquivos pendentes:** commit do frontend/documentação e commit da formatação mecânica histórica; push, Pull Request, CI, merge e limpeza da branch.
- **Falha atual:** nenhuma local.
- **Próximo passo exato:** revisar o diff não staged, criar os commits de frontend/documentação e formatação, então publicar `feature/admission-workflow` e abrir Pull Request para `develop`.

## ETP-007 a ETP-015

- **Status:** pendentes; cada etapa será iniciada somente após o merge da anterior em `develop`.

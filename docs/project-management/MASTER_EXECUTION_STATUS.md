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
- **Validações adicionais aprovadas:** `pnpm.cmd format:check` após formatação mecânica dos arquivos históricos apontados pelo verificador; `pnpm.cmd lint`; `pnpm.cmd typecheck`; `pnpm.cmd test` (15 suítes/29 testes API e 7 arquivos/19 testes web); `pnpm.cmd test:coverage` (mesmas 15 suítes/29 testes API e 7 arquivos/19 testes web); `pnpm.cmd build`; `pnpm.cmd check`; `pnpm.cmd install --frozen-lockfile`; `git diff --check`.
- **Falha atual:** nenhuma; a execução agregada anterior excedeu o limite antes de retornar resultado completo.
- **Arquivos concluídos:** schema/migration, módulo NestJS, APIs, testes unitários, frontend demonstrativo, documentação de módulo e documentação transversal.
- **Pull Request e merge:** PR #20 mergeado em `develop` no commit `dcf1fbd`.
- **Validação final:** merge confirmado em `origin/develop`; branch de feature excluída localmente e no remoto.
- **Próximo passo exato:** iniciar ETP-008 a partir de `develop` sincronizada, criando `feature/employee-benefits`.

## ETP-008 — Benefícios

- **Status:** concluída e mergeada em `develop`
- **Branch:** `feature/employee-benefits` (local e remota excluídas após o merge)
- **Base:** `develop` em `c4a1e2f`
- **Migration prevista:** `0006_employee_benefits`
- **Concluído nesta execução:** schema Prisma e migration `0006_employee_benefits` para catálogo por empresa, planos com valores `Decimal`, coparticipação configurável, adesões com vigência e histórico append-only.
- **Validações aprovadas:** `pnpm.cmd prisma:validate` e `pnpm.cmd prisma:generate`.
- **Concluído adicionalmente:** módulo NestJS `benefits` com APIs de catálogo, planos e adesões; valores monetários são validados como texto decimal. A adesão confere empresa do contrato, bloqueia sobreposição ativa por benefício e registra histórico para adesão, suspensão e cancelamento.
- **Concluído adicionalmente:** feature React em `/beneficios`, com catálogo, pesquisa, filtro, paginação local, planos, vigência, coparticipação, adesões, consulta por contrato e estados de carregamento, erro e vazio. Os formulários usam React Hook Form e Zod; as consultas usam TanStack Query.
- **Concluído adicionalmente:** testes unitários do serviço de benefícios e testes de interface para estado vazio, pesquisa e falha de API; documentação do módulo e referências de desenvolvimento, roadmap e decisões pendentes.
- **Validações adicionais aprovadas:** `pnpm.cmd --filter api typecheck`; `pnpm.cmd --filter web typecheck`; `pnpm.cmd --filter api test -- benefits.service.spec.ts` (3 testes); `pnpm.cmd --filter web test -- benefits.test.tsx` (3 testes).
- **Validações globais aprovadas:** `pnpm.cmd format:check`, `pnpm.cmd lint`, `pnpm.cmd test` (16 suítes/32 testes API e 8 arquivos/22 testes web), `pnpm.cmd test:coverage`, `pnpm.cmd build`, `pnpm.cmd check`, `pnpm.cmd install --frozen-lockfile` e `git diff --check`.
- **Correção aplicada:** a primeira rodada apontou somente formatação preexistente em arquivos de jornada e um aviso de dependência React na nova tela. A formatação foi aplicada mecanicamente, o aviso foi corrigido e a rodada final foi aprovada.
- **Commits criados:** `7db391a feat(db): add employee benefits schema`; `8547ecd feat(api): add employee benefits endpoints`; `5a63743 feat(web): add employee benefits screens`; `1d2fd18 test: cover employee benefits flows`; `795e322 docs: document employee benefits module`; `d5a1e26 docs: update benefits execution status`.
- **Pull Request e merge:** PR #21 mergeado em `develop` no commit `013e8ad`.
- **Validação final:** `origin/develop` contém `b76c257` e os commits funcionais da ETP-008; a branch local e a remota foram excluídas.
- **Formatação residual da ETP-007:** oito arquivos foram inspecionados com hashes de blob idênticos no índice e no worktree. Não havia diff de conteúdo; a marcação era somente de metadados desatualizados e foi resolvida de forma não destrutiva durante o checkout de `develop`.
- **Próximo passo exato:** iniciar ETP-009 a partir de `develop` sincronizada, criando `feature/vacations-leaves`.

## ETP-009 — Férias e afastamentos

- **Status:** concluída e mergeada em `develop`
- **Branch:** `feature/vacations-leaves` (local e remota excluídas após o merge)
- **Base:** `develop` em `853d9b1`
- **Migration prevista:** `0007_vacations_leaves`
- **Escopo ativo:** períodos aquisitivos e concessivos informados de forma configurável, solicitações e programação de férias, férias coletivas estruturais, tipos/casos de afastamento, retornos, histórico e alertas lógicos.
- **Restrições preservadas:** sem cálculo financeiro de férias, prazo legal presumido, autenticação funcional, documentos reais ou integrações externas.
- **Concluído nesta execução:** schema Prisma e migration `0007_vacations_leaves`; módulo NestJS com períodos, solicitações, decisão administrativa, férias coletivas, tipos/casos de afastamento e retorno; rota React `/movimentacoes` demonstrativa para períodos e afastamentos.
- **Regras implementadas:** datas coerentes, período ligado ao contrato, bloqueio de sobreposição de férias/afastamento, tipo de afastamento isolado por empresa, retorno previsto quando configurado e histórico append-only; nenhum período ou prazo legal é calculado automaticamente.
- **Commits criados:** `e4c8b91 feat(db): add vacations and leaves schema`; `1c9aeb7 feat(api): add vacations and leaves modules`; `0f1f4da feat(web): add vacations and leaves screens`; `344efed test: cover vacations and leaves flows`.
- **Validações aprovadas:** `pnpm.cmd prisma:validate`; `pnpm.cmd prisma:generate`; `pnpm.cmd --filter api typecheck`; `pnpm.cmd --filter api test -- vacations-leaves.service.spec.ts` (3 testes); `pnpm.cmd --filter web typecheck`; `pnpm.cmd --filter web test -- vacations-leaves.test.tsx` (1 teste).
- **Validações globais aprovadas:** `pnpm.cmd format:check`, `pnpm.cmd lint`, `pnpm.cmd typecheck`, `pnpm.cmd test` (17 suítes/35 testes API), `pnpm.cmd test:coverage`, `pnpm.cmd build`, `pnpm.cmd check`, `pnpm.cmd install --frozen-lockfile` e `git diff --check`.
- **Correção aplicada:** `format:check` revelou oito arquivos preexistentes de benefícios sem formatação. Foram formatados mecanicamente em commit isolado, sem mudança de comportamento ou escopo de férias/afastamentos.
- **Pull Request e merge:** PR #22 mergeado em `develop` no commit `750b679`.
- **Validação final:** `origin/develop` contém `44a2503` e todos os commits funcionais da ETP-009; a branch local e a remota foram excluídas.
- **Próximo passo exato:** iniciar ETP-010 a partir de `develop` sincronizada, criando `feature/payroll-engine`.

## ETP-010 — Motor de folha de pagamento

- **Status:** fundação de banco concluída; módulos NestJS de configuração pendentes.
- **Branch:** `feature/payroll-engine`
- **Base:** `develop` em `4b2a109`
- **Migration criada:** `apps/api/prisma/migrations/0008_payroll_foundation/migration.sql`.
- **Commit criado:** `540359a` — `feat(db): add payroll foundation schema`.
- **Entidades concluídas:** `PayrollCalendar`, `PayrollPeriod`, `PayrollRubricCategory`, `PayrollRubric`, `PayrollRubricVersion`, `PayrollParameter`, `PayrollInput`, `PayrollRun`, `PayrollRunEmployee`, `PayrollCalculationItem`, `PayrollRunMessage` e `PayrollPeriodClosure`.
- **Estrutura preservada:** UUIDs, timestamps, `Decimal(15,2)` para dinheiro, vigências temporais, chaves estrangeiras `RESTRICT`, índices, unicidades de competência e idempotência por `source_key`. Fechamento/reabertura e versões de motor/parâmetros ficam registrados sem exclusão em cascata; a imutabilidade de competências fechadas e de versões históricas será imposta na camada de serviço.
- **Revisão de SQL:** não há `FLOAT`, nem `ON DELETE CASCADE` nas entidades de folha; valores monetários usam `DECIMAL`, as vigências têm `CHECK`, e todas as relações têm FK e índices de consulta.
- **Divergências registradas:** `DATABASE_SPECIFICATION.md` e `DOMAIN_MODEL.md` descrevem tabelas estatutárias, expressões de cálculo, aprovações e resultados de cálculo completos. Nesta fundação elas foram deliberadamente reduzidas a `PayrollParameter.definition` e configurações JSON sem valores, faixas, alíquotas, fórmulas ou aprovação por usuário; `contract_id` da documentação foi mapeado ao padrão existente `employment_contract_id`. O processamento legal permanece fora do escopo e a migration `0009_payroll_calculation` não foi criada.
- **Arquivos concluídos:** `apps/api/prisma/schema.prisma` e `apps/api/prisma/migrations/0008_payroll_foundation/migration.sql`.
- **Validações aprovadas:** `pnpm.cmd --filter @dp-system/api exec prisma format --schema prisma/schema.prisma` (equivalente ao script raiz inexistente `prisma:format`), `pnpm.cmd prisma:validate`, `pnpm.cmd prisma:generate`, `pnpm.cmd --filter @dp-system/api typecheck`, `pnpm.cmd lint` e `git diff --check`.
- **Implementação em andamento:** módulo `payroll-periods` criado com listagem paginada e ordenável, busca, criação, edição enquanto aberta, abertura, validação, fechamento transacional e reabertura justificada. A alteração de competência fechada retorna conflito; duplicidade é convertida em `409`; fechamento consulta mensagens bloqueantes e registra histórico append-only.
- **Validação incremental aprovada:** `pnpm.cmd --filter @dp-system/api typecheck`.
- **Commit incremental:** `1d52007` — `feat(api): add payroll periods module`.
- **Concluído adicionalmente:** `payroll-rubrics` com listagem paginada/pesquisável/ordenável, busca por ID, criação de rubrica e primeira versão obrigatória, configurações JSON de base/incidência, atualização e ativação/inativação lógica. A categoria deve pertencer à empresa e renomeação é bloqueada após uso em resultado histórico.
- **Validação incremental aprovada:** `pnpm.cmd --filter @dp-system/api typecheck` após o módulo de rubricas.
- **Commit incremental:** `59b84d2` — `feat(api): add payroll rubric module`.
- **Pendências:** `payroll-parameters`, `payroll-inputs`, `payroll-runs`, `payroll-closures`, testes dos módulos e validações globais da API.
- **Concluído adicionalmente:** `payroll-parameters` com listagem paginada, filtros, pesquisa e ordenação limitada; detalhe, criação com vigência obrigatória, bloqueio de sobreposição e atualização somente antes do uso em competência fechada. O campo configurável permanece JSON sem valores legais; qualquer valor monetário futuro deve ser representado como string decimal e convertido por uma camada de domínio, nunca `float`.
- **Validação incremental aprovada:** `pnpm.cmd --filter @dp-system/api typecheck` após o módulo de parâmetros.
- **Commit incremental:** `2519774` — `feat(api): add payroll parameter module`.
- **Pendências:** `payroll-inputs`, `payroll-runs`, `payroll-closures`, testes dos módulos e validações globais da API.
- **Concluído adicionalmente:** `payroll-inputs` com listagem paginada/filtrável/ordenável, busca, criação, edição e inativação lógica. Os valores e quantidades são recebidos como strings decimais e convertidos para `Prisma.Decimal`; contrato, colaborador, empresa, competência, status e vigência da rubrica são verificados antes da gravação. A chave de origem é única por competência e o fechamento torna o lançamento imutável.
- **Validações incrementais aprovadas:** `pnpm.cmd --filter @dp-system/api typecheck`, `pnpm.cmd --filter @dp-system/api lint` e `git diff --check`.
- **Commit incremental:** `aec6a11` — `feat(api): add payroll input module`.
- **Pendências:** `payroll-runs`, `payroll-closures`, testes dos módulos e validações globais da API.
- **Concluído adicionalmente:** `payroll-runs` com listagem, detalhe, início técnico determinístico, controle de execução concorrente, versões do motor e parâmetros, mensagens de aviso/erro bloqueante e metadados de execução. Cada execução recebe o aviso explícito de que não representa folha homologada; não há cálculo legal, imposto, alíquota ou incidência oficial.
- **Validações incrementais aprovadas:** `pnpm.cmd --filter @dp-system/api typecheck` e `pnpm.cmd --filter @dp-system/api lint` após o módulo de execuções.
- **Pendências:** `payroll-closures`, testes dos módulos e validações globais da API.
- **Concluído adicionalmente:** `payroll-closures` com listagem e detalhe do histórico, fechamento transacional e reabertura justificada. O fechamento exige competência aberta, execução técnica concluída e ausência de erros bloqueantes; persiste versões do motor/parâmetros e nunca apaga eventos anteriores.
- **Validação incremental aprovada:** `pnpm.cmd --filter @dp-system/api typecheck` após o módulo de fechamentos.
- **Commits incrementais:** `38419f1` — `feat(api): add payroll run module`; `6246718` — `feat(api): add payroll closure workflow`.
- **Testes adicionados:** `payroll-runs.service.spec.ts` (competência ausente/fechada, concorrência, preservação de versões e aviso demonstrativo) e `payroll-closures.service.spec.ts` (competência ausente, execução exigida, erro bloqueante, versões e reabertura inválida).
- **Commit de testes:** `7e1811a` — `test(api): cover payroll execution modules`.
- **Validações de testes aprovadas:** os comandos com filtro posicional do script permaneceram executando todo o conjunto e excederam 124s sem resultado; a causa foi o filtro não ser interpretado como caminho. Os comandos explícitos `pnpm.cmd --filter @dp-system/api exec jest --config jest.config.cjs --runInBand --runTestsByPath src/modules/payroll-runs/payroll-runs.service.spec.ts` (4 testes) e o equivalente de `payroll-closures` (5 testes) passaram.
- **Pendências:** testes dos módulos de configuração (`payroll-periods`, `payroll-rubrics`, `payroll-parameters`, `payroll-inputs`), testes de controller e validações completas da API; frontend ainda não iniciado.
- **Testes adicionados:** `payroll-periods.service.spec.ts` (criação, duplicidade, competência fechada e inexistente) e `payroll-rubrics.service.spec.ts` (criação com primeira vigência, vigência inválida, inexistência e proteção histórica).
- **Validação de testes aprovada:** `pnpm.cmd --filter @dp-system/api exec jest --config jest.config.cjs --runInBand --runTestsByPath src/modules/payroll-periods/payroll-periods.service.spec.ts src/modules/payroll-rubrics/payroll-rubrics.service.spec.ts` — 2 suítes e 8 testes aprovados.
- **Commit de testes:** `5d4163b` — `test(api): cover payroll period and rubric modules`.
- **Pendências:** testes de `payroll-parameters` e `payroll-inputs`, testes de controller e validações completas da API; frontend ainda não iniciado.
- **Testes adicionados:** `payroll-parameters.service.spec.ts` (criação, vigência incompatível, período inválido, inexistência e imutabilidade histórica) e `payroll-inputs.service.spec.ts` (valor decimal, vínculos ausentes/incompatíveis, rubrica inativa e bloqueio após fechamento).
- **Validação direcionada aprovada:** `pnpm.cmd --filter @dp-system/api exec jest --config jest.config.cjs --runInBand --runTestsByPath src/modules/payroll-parameters/payroll-parameters.service.spec.ts src/modules/payroll-inputs/payroll-inputs.service.spec.ts` — 2 suítes e 10 testes aprovados.
- **Commit de testes:** `ab3b97d` — `test(api): cover payroll parameter and input modules`.
- **Validações completas da API aprovadas:** `pnpm.cmd --filter @dp-system/api typecheck`; Jest em `--runInBand` — 23 suítes e 62 testes aprovados; `pnpm.cmd --filter @dp-system/api lint`; `pnpm.cmd prisma:validate`; `git diff --check`.
- **Pendências:** testes de controller adicionais e frontend/documentação da folha. Não há pendência de cálculo legal; nenhuma regra normativa foi implementada.
- **Próximo passo exato:** iniciar o frontend da ETP-010 pela navegação e páginas demonstrativas de competências, rubricas, parâmetros, lançamentos, execuções e fechamentos.
- **Frontend em andamento:** criada a feature `apps/web/src/features/payroll/index.tsx` com navegação interna e estados de carregamento, vazio e erro; rotas `/folha/competencias`, `/folha/rubricas`, `/folha/parametros`, `/folha/lancamentos`, `/folha/execucoes` e `/folha/fechamentos` foram registradas. Todas exibem o aviso obrigatório de processamento demonstrativo e não homologado.
- **Validações incrementais aprovadas:** `pnpm.cmd --filter @dp-system/web typecheck`, `pnpm.cmd --filter @dp-system/web lint` e `git diff --check`.
- **Commit incremental:** `7794605` — `feat(web): add functional payroll period workflows`.
- **Commit incremental:** `3227305` — `feat(web): add payroll navigation and pages`.
- **Pendências:** formulários, ações e páginas detalhadas por domínio, testes de interface, documentação e validações globais.
- **Competências concluídas parcialmente:** `payroll-periods.ts` centraliza tipos e chamadas HTTP reais de listar, buscar, criar, atualizar, validar, fechar e reabrir. A rota de competências possui listagem por empresa, criação, validação, fechamento, indicação de imutabilidade e reabertura com justificativa obrigatória; erros do envelope HTTP são exibidos na interface.
- **Validações incrementais aprovadas:** `pnpm.cmd --filter @dp-system/web typecheck`, `pnpm.cmd --filter @dp-system/web lint` e `git diff --check`.
- **Pendências:** edição e detalhe completos de competências, testes de interface, páginas funcionais dos demais domínios, documentação e validações globais.
- **Testes de competências adicionados:** `apps/web/src/features/payroll/payroll-periods.test.tsx` cobre navegação/aviso demonstrativo, exigência de empresa e estado vazio, conflito de criação com preservação de formulário e imutabilidade com fluxo de reabertura.
- **Correção de teste:** o primeiro seletor de imutabilidade falhou por corresponder apenas parte de um texto composto; foi corrigido para uma expressão acessível sem alterar comportamento do produto.
- **Validações aprovadas:** `pnpm.cmd --filter @dp-system/web test -- --run src/features/payroll/payroll-periods.test.tsx` (4 testes), `pnpm.cmd --filter @dp-system/web typecheck`, `pnpm.cmd --filter @dp-system/web lint` e `git diff --check`.
- **Commit de testes:** `44774fc` — `test(web): cover payroll period workflows`.
- **Pendências:** edição/detalhe de competências, páginas funcionais dos demais domínios, documentação e validações globais.
- **Rubricas concluídas parcialmente:** `payroll-rubrics.ts` centraliza os contratos HTTP reais de listagem, detalhe, criação e atualização (incluindo ativação/inativação). A rota de rubricas permite criar uma primeira versão com vigência obrigatória, configuração JSON de incidências sem regras legais, filtro por empresa/status, pesquisa, ordenação permitida, paginação, edição nominal e ativação/inativação lógica.
- **Testes de rubricas adicionados:** `payroll-rubrics.test.tsx` cobre listagem filtrada com vigência/incidência, conflito de criação com preservação do formulário e atualização de status via API.
- **Validações incrementais aprovadas:** `pnpm.cmd --filter @dp-system/web test -- --run src/features/payroll/payroll-rubrics.test.tsx` (3 testes), `pnpm.cmd --filter @dp-system/web typecheck`, `pnpm.cmd --filter @dp-system/web lint` e `git diff --check`.
- **Pendências:** páginas funcionais de parâmetros, lançamentos, execuções e fechamentos, testes de interface restantes, documentação transversal e validações globais.
- **Próximo passo exato:** implementar a página funcional de parâmetros com vigência, versionamento e configuração sem valores legais, reutilizando a feature de folha.
- **Parâmetros concluídos parcialmente:** `payroll-parameters.ts` centraliza contratos HTTP de listagem, detalhe, criação e atualização de status/definição. A rota permite criar versões com vigência, categoria, referência e JSON configurável; suporta filtros, pesquisa, status e paginação. Não inclui valores oficiais, faixas, alíquotas ou fórmulas legais.
- **Testes de parâmetros adicionados:** `payroll-parameters.test.tsx` cobre listagem de versão configurável, conflito de vigência com preservação do formulário e ativação por API.
- **Validações incrementais aprovadas:** `pnpm.cmd --filter @dp-system/web test -- --run src/features/payroll/payroll-parameters.test.tsx` (3 testes), `pnpm.cmd --filter @dp-system/web typecheck`, `pnpm.cmd --filter @dp-system/web lint` e `git diff --check`.
- **Pendências:** páginas funcionais de lançamentos, execuções e fechamentos, testes de interface restantes, documentação transversal e validações globais.
- **Próximo passo exato:** implementar a página funcional de lançamentos, com valores decimais textuais, idempotência por chave de origem e bloqueio por competência fechada.
- **Lançamentos concluídos parcialmente:** `payroll-inputs.ts` centraliza os contratos HTTP reais. A rota permite criar lançamentos com valor/quantidade decimal como texto, chave de origem idempotente e metadados técnicos; lista por competência, pagina e permite inativação lógica. A validação no cliente não envia formato decimal inválido; a API preserva a verificação de competência fechada e compatibilidade contratual.
- **Testes de lançamentos adicionados:** `payroll-inputs.test.tsx` cobre filtro por competência, bloqueio de valor inválido no cliente e inativação pela API.
- **Validações incrementais aprovadas:** `pnpm.cmd --filter @dp-system/web test -- --run src/features/payroll/payroll-inputs.test.tsx` (3 testes), `pnpm.cmd --filter @dp-system/web typecheck`, `pnpm.cmd --filter @dp-system/web lint` e `git diff --check`.
- **Pendências:** páginas funcionais de execuções e fechamentos, testes de interface restantes, documentação transversal e validações globais.
- **Próximo passo exato:** implementar a página funcional de execuções técnicas, com versões preservadas, avisos e erros bloqueantes demonstrativos.
- **Execuções concluídas parcialmente:** `payroll-runs.ts` centraliza os contratos HTTP de listagem, detalhe, criação e mensagens. A rota inicia processamento estrutural demonstrativo, preserva versões de motor e de snapshot de parâmetros e apresenta avisos/erros retornados pela API, sem qualquer cálculo legal.
- **Testes de execuções adicionados:** `payroll-runs.test.tsx` cobre listagem com versões e aviso demonstrativo, além do início de execução com versões explícitas.
- **Validações incrementais aprovadas:** `pnpm.cmd --filter @dp-system/web test -- --run src/features/payroll/payroll-runs.test.tsx` (2 testes), `pnpm.cmd --filter @dp-system/web typecheck`, `pnpm.cmd --filter @dp-system/web lint` e `git diff --check`.
- **Pendências:** página funcional de fechamentos, testes de interface restantes, documentação transversal e validações globais.
- **Próximo passo exato:** implementar a página funcional de fechamentos e reaberturas justificadas, preservando o histórico da competência.
- **Fechamentos concluídos parcialmente:** `payroll-closures.ts` e a rota de fechamentos fornecem listagem de histórico, fechamento e reabertura com justificativa obrigatória, preservando versões de motor/parâmetros e histórico append-only. Nenhuma regra legal foi adicionada.
- **Testes de fechamentos adicionados:** `payroll-closures.test.tsx` cobre navegação/aviso demonstrativo, histórico com versões, rejeição de fechamento pela API e reabertura justificada. A primeira execução revelou apenas um seletor de texto composto no histórico; o teste foi corrigido sem alterar comportamento da tela.
- **Validações aprovadas nesta retomada:** `pnpm.cmd --filter @dp-system/web test -- --run src/features/payroll/payroll-closures.test.tsx` (3 testes), `pnpm.cmd --filter @dp-system/web typecheck`, `pnpm.cmd --filter @dp-system/web lint` e `git diff --check`.
- **Commits incrementais:** `f1622db` — `feat(web): add payroll closure workflows`; `16c2a51` — `test(web): cover payroll closure workflows`.
- **Documentação da ETP-010:** criado `docs/modules/PAYROLL_FOUNDATION.md`; `docs/ROADMAP.md` e `docs/DEVELOPMENT.md` registram a fundação demonstrativa, valores decimais textuais e a exclusão explícita de cálculos legais.
- **Validações adicionais aprovadas:** suíte completa do frontend (15 arquivos/41 testes), build do frontend, `pnpm.cmd lint`, `pnpm.cmd typecheck`, `pnpm.cmd prisma:validate`, suíte global (`23` suítes/`62` testes API e `15` arquivos/`41` testes web), `pnpm.cmd format:check`, `pnpm.cmd test:coverage`, `pnpm.cmd build`, `pnpm.cmd check`, `pnpm.cmd install --frozen-lockfile` e `git diff --check`.
- **Formatação mecânica isolada:** `format:check` inicialmente apontou dez arquivos históricos da ETP-009; foram formatados mecanicamente, sem alteração funcional, para restaurar a validação global.
- **Publicação:** `feature/payroll-engine` foi publicada em `origin/feature/payroll-engine` com tracking configurado.
- **Bloqueio atual:** o GitHub CLI (`gh`) não está instalado no ambiente, portanto a criação e o acompanhamento automático do Pull Request não podem ser executados. O push foi concluído sem força e sem alteração de commits publicados.
- **Link de comparação:** `https://github.com/GuilhermeEstrelaDEV/dp-system/compare/develop...feature/payroll-engine`.
- **Pendências:** criar Pull Request de `feature/payroll-engine` para `develop`, acompanhar CI, corrigir falhas reproduzíveis e realizar merge após checks verdes. Não há pendência de cálculo legal ou regra normativa.
- **Próximo passo exato:** instalar o GitHub CLI, autenticar com `gh auth login`, executar `gh pr create --base develop --head feature/payroll-engine` e acompanhar os checks.

## ETP-011 a ETP-015

### ETP-011 — Cálculo configurável de folha

- **Status:** implementação concluída em `feature/payroll-calculation`.
- **Base:** `develop` em `ba57107`.
- **Escopo:** consolidação determinística de lançamentos pendentes, seleção temporal de versões de rubrica, totais bruto/líquido, itens e memória de cálculo por contrato.
- **Falha segura:** naturezas desconhecidas e versões ausentes geram mensagens bloqueantes; nenhuma regra legal é inferida.
- **Persistência:** reutiliza as entidades históricas da migration `0008_payroll_foundation`; nenhuma migration adicional é necessária.
- **Interface:** resultados resumidos por contrato nas execuções de folha.
- **Testes:** domínio decimal/agregação, orquestração, concorrência, competência fechada, versão vigente e natureza inválida, além da apresentação dos resultados no frontend.

### ETP-012 — Remuneração variável e conciliação

- **Status:** concluída e mergeada em `develop`.
- **Base:** `develop` em `1c7c97e`.
- **Escopo documentado:** UC-09 e entidades `VariableCompensationEvent`, `SalaryAdvance`, `OffCyclePayment` e `PayrollReconciliation`.
- **Migration:** `0009_variable_compensation`.
- **Restrições:** sem fórmulas, percentuais, aprovação autenticada, geração automática de folha, pagamento real ou integrações; BDP-006 permanece pendente e a resolução v1 da BDP-009 não altera retroativamente a ETP-012.
- **Entregas:** schema, migration, API, interface em `/folha/remuneracao-variavel`, testes e documentação.
- **Pull Request e merge:** PR #26 mergeado em `develop` no commit `6fff6e2`.

### ETP-013 — Conferência e aprovação de folha

- **Status:** **COMPLETED — VERSION 1** em 22/07/2026.
- **Especificação:** `docs/project-management/ETP-013_PAYROLL_REVIEW_APPROVAL_SPECIFICATION.md`.
- **Objetivo proposto:** workflow auditável de conferência, achados e decisões antes do fechamento.
- **Dependência atendida:** ETP-012 mergeada pelo PR #26.
- **Decisão de negócio:** BDP-009 resolvida para a versão 1 em `docs/project-management/BDP-009_RESOLUTION_V1.md`; ADR-007 aceita.
- **Dependências bloqueantes restantes da v1:** nenhuma. Integração ampla e retenção vinculada à BDP-011 são posteriores.
- **Persistência:** migrations `0010` a `0013_payroll_review_workflow` implementam contexto empresarial, auditoria/grants, ciclos/achados/eventos, etapas e decisões append-only.
- **Pull Request e merge da especificação:** PR #27 mergeado em `develop` no commit `58341a5`.
- **Fundação técnica:** contratos imutáveis para achados, severidade, estado e eventos append-only; invariantes de justificativa, cronologia, unicidade, coerência e isolamento por empresa; módulo NestJS e persistência neutra existem, sem interface ou decisão de aprovação.
- **Testes:** domínio e serviço cobrem transições, referências, atomicidade, autorização e multiempresa; o frontend cobre sessão, empresa ativa, guards visuais, erros HTTP, ciclos, achados, decisões, fechamento, reabertura e timeline com rede simulada.
- **Documentação técnica:** `docs/modules/PAYROLL_REVIEW_FOUNDATION.md`.
- **Prontidão de identidade/autorização:** arquitetura v1 aprovada em `docs/architecture/IDENTITY_AUTHORIZATION_SPECIFICATION.md` e ADR-007; principal autenticado, vínculo usuário–empresa, autorização e writer transacional já foram implementados.
- **Fundação funcional:** login JWT, principal tipado, seleção validada de empresa, capabilities efetivas, autorização opt-in e isolamento reutilizável estão documentados em `docs/modules/IDENTITY_COMPANY_RBAC.md`.
- **Compatibilidade:** rotas legadas não receberam proteção global; sua migração exige inventário e testes próprios.
- **Autorização transversal:** migration `0011_authorization_audit_foundation`, grants temporários/emergenciais, auditoria atômica e inventário documentados em `docs/architecture/AUDIT_AUTHORIZATION_FOUNDATION.md`.
- **Fase 4:** APIs autenticadas abrem/consultam ciclos, criam/listam achados e resolvem/reabrem achados com capability, `404` empresarial e transação conjunta de estado, evento e `AuditLog`.
- **Fase 5:** estados `OPEN`, `IN_REVIEW`, `SUBMITTED`, `APPROVED` e `REJECTED`; duas etapas sequenciais configuradas por dados; segregação de atores, bloqueio por achado e auditoria atômica.
- **Fechamento/reabertura:** migration `0014` adiciona `CLOSED`, rodadas explícitas e invalidações append-only; reabertura retorna a `IN_REVIEW` e exige novo ciclo decisório.
- **Frontend funcional:** login, encerramento local, seleção de empresa, contexto tipado, cliente HTTP com Bearer e correlation ID, rotas protegidas, lista/detalhe de execuções, ciclos, achados, workflow e timeline. Visibilidade usa capabilities; a autorização permanece exclusivamente no backend.
- **Encerramento:** rastreabilidade, métricas, limitações e débitos estão em `docs/project-management/ETP-013_FINAL_REPORT.md`.
- **Próximo passo da ETP-013:** integração operacional ocorre na ETP-014 sem reabrir o escopo concluído da ETP-013.
- **Pacote de decisão:** `docs/project-management/BDP-009_DECISION_PACKAGE.md` homologado para v1 e preservado como evidência das alternativas avaliadas.

### ETP-014 — Fechamento de competência e integração operacional

- **Status:** `COMPLETED`; Fases 1 a 6 `COMPLETED`.
- **Especificação:** `docs/project-management/ETP-014_PAYROLL_PERIOD_CLOSURE_SPECIFICATION.md`.
- **Objetivo proposto:** vincular o fechamento operacional da competência a uma execução e conferência encerrada, com prontidão explícita, RBAC, isolamento empresarial e auditoria atômica.
- **Base reutilizável:** `PayrollPeriod`, `PayrollRun`, `PayrollPeriodClosure`, workflow da ETP-013, JWT, empresa ativa, RBAC, auditoria, substituição e acesso emergencial.
- **Lacuna crítica:** `payroll-periods` e `payroll-closures` hoje alteram o mesmo estado por superfícies e validações diferentes; o legado foi inventariado e deverá delegar progressivamente ao contrato canônico sem remoção incidental.
- **Decisão de negócio:** BDP-014 `APPROVED — VERSION 1` em `docs/project-management/BDP-014_RESOLUTION_V1.md`; a proposta anterior está superseded e preservada como histórico.
- **Arquitetura:** contrato em `docs/architecture/PAYROLL_PERIOD_CLOSURE_CANONICAL_CONTRACT.md` e legado em `docs/architecture/PAYROLL_CLOSURE_LEGACY_INVENTORY.md`.
- **Plano incremental:** `docs/project-management/ETP-014_IMPLEMENTATION_PLAN.md`, com seis fases e gates explícitos.
- **Fase 2:** `GET /payroll-periods/:payrollPeriodId/closure-readiness` avalia execução canônica, review vigente, blockers e warnings no escopo da empresa ativa. Exige `payroll.period.close.readiness`, aplica deny-by-default e retorna `404` entre empresas.
- **Limites da entrega:** somente leitura, sem migration, persistência de readiness, `AuditLog`, manifesto, lock, fechamento, reabertura, frontend ou alteração das rotas legadas. `payroll.period.close.view` e `payroll.period.close.readiness` foram cadastradas sem associação automática.
- **Fase 3:** migration `0015_payroll_period_closure_persistence`, agregado `PayrollPeriodClosureVersion`, manifesto SHA-256, eventos e acknowledgements append-only, idempotência persistente, versão otimista e composição interna com `AuditLog`.
- **Banco:** 15 migrations; índice parcial garante uma versão ativa, trigger valida escopo empresa–competência–execução–review e quatro triggers protegem evidências/idempotência.
- **Capabilities:** conjunto final de cinco códigos cadastrado no seed, com zero associação automática a papéis.
- **Limites da Fase 3:** nenhum endpoint novo, fechamento/reabertura operacional, lock, adaptação legada ou frontend.
- **Fase 4:** `POST /payroll-periods/:payrollPeriodId/close` exige JWT, empresa ativa,
  `payroll.period.close.execute`, `Idempotency-Key` e token observado. Reavalia readiness sob advisory
  transaction lock, valida warnings, cria versão, manifesto SHA-256, eventos e `AuditLog` e conclui
  `PayrollPeriod` como `CLOSED` atomicamente.
- **Concorrência:** chave persistente, fingerprint canônico, replay `200`, lock empresa–competência e
  versão otimista; testes PostgreSQL cobrem chaves iguais/diferentes e ausência de `CLOSING` residual.
- **Limites da Fase 4:** sem migration 0016, reabertura, histórico/manifesto público, frontend,
  redirecionamento de `/payroll-closures`, scheduler, integração, retenção ou alçada.
- **Fase 5:** a URI única `POST /payroll-periods/:payrollPeriodId/reopen` agora delega ao fluxo
  canônico autenticado, idempotente e transacional; preserva evidências, supera a versão fechada,
  cria sucessora `OPEN` vazia e bloqueia readiness até nova execução e novo review.
- **Fase 6:** histórico, detalhe, eventos e manifesto seguro são consultas públicas protegidas por
  `payroll.period.close.history`; o frontend apresenta versões, timeline, evidências, readiness e
  ações canônicas condicionadas por capability.
- **Final Acceptance:** arquitetura, 15 migrations, seed, regressão, cobertura, PostgreSQL 16,
  frontend e documentação validados; ETP-014 oficialmente concluída.

### ETP-015 — Authorization Foundation & Enterprise Isolation

- **Status:** `IN PROGRESS`; especificação aprovada no PR #52, ETP-015.1–015.3 concluídas e
  ETP-015.4–015.8 implementadas nos recortes aprovados.
- **Governança:** BDP-AUTH-LEGACY e DAL-01 a DAL-14 estão `APPROVED`.
- **Especificação:** `docs/project-management/ETP-015_AUTHORIZATION_FOUNDATION_AND_ENTERPRISE_ISOLATION.md`.
- **Arquitetura:** `docs/architecture/AUTHORIZATION_FOUNDATION_TECHNICAL_DESIGN.md` e
  `docs/architecture/AUTHORIZATION_DATA_MODEL_PROPOSAL.md`.
- **Plano:** dez incrementos em `docs/project-management/ETP-015_IMPLEMENTATION_BACKLOG.md`, com
  fechamento da folha como primeiro recorte P0.
- **ETP-015.1 — `COMPLETED`:** principal autenticado único, contexto de identidade, resolução
  explícita de usuário e sessão lógica revogável sobre a persistência existente, sem migration ou
  contrato HTTP novo. O PR #53 foi incorporado à `develop` em 29/07/2026 pelo merge
  `dac460d8bd84bbe0a1e9f39360f4c740c47c2e4e`, com CI aprovado.
- **Revisão técnica da ETP-015.1:** erros de token, usuário e sessão possuem
  semântica `401` explícita, o contexto é imutável por requisição e o uso provisório de `RefreshToken`
  foi classificado como `ACCEPTABLE WITH FOLLOW-UP`.
- **Follow-ups:** modelo dedicado/migration de sessão, limpeza de expirados, issuer/audience, refresh,
  logout backend, revogação global e identidades técnicas dependem de recorte futuro aprovado.
- **ETP-015.2 — `COMPLETED`:** contexto imutável, fontes explícitas e resolução de vínculo ativo
  incorporados à `develop` pelo PR #55 em 29/07/2026, no merge
  `70dd036080fdeac59a88f434786257b01c3c7ead`, com CI aprovado e sem autorização por capability ou
  migração de endpoints legados. O modelo atual é `SUFFICIENT WITH FOLLOW-UP`.
- **Follow-ups da ETP-015.2:** revogação dedicada, provenance, unicidade temporal, múltiplos
  assignments, política futura de assignment canônico, evolução controlada das fontes empresariais
  e semântica futura de `404` permanecem abertos.
- **ETP-015.3 — `COMPLETED — IMPLEMENTED AND MERGED`:** PR #61 incorporou a migration aditiva `0016`, catálogo
  canônico, assignments históricos, constraints temporais e serviços internos, sem grant automático
  ou ampliação de acesso pela migration.
- **Gate A — `APPROVED`:** GA-01..GA-15 homologadas por Guilherme Estrela em 29/07/2026, sem
  condições bloqueadoras; a implementação aprovada foi posteriormente incorporada pelo PR #61.
- **Classification Subgate — `APPROVED`:** PC-01..PC-21 homologadas por Guilherme Estrela em
  29/07/2026, sem condições bloqueadoras. O PR #59 foi incorporado à `develop` no merge
  `f3a63d6243797c91e17ace40a715bdbf78478efb`, com CI aprovado. A classificação homologada é aplicada
  de forma explícita na migration e no seed da ETP-015.3.
- **ETP-015.4 — `IMPLEMENTED — AUTHORIZATION PRIMITIVES AVAILABLE`:** metadata imutável, allowlist
  pública nominal, composição JWT/empresa/capability, deny-by-default e verificador de 165 handlers.
  As 129 rotas legadas permanecem nominalmente adiadas e nenhuma família foi migrada.
- **ETP-015.5 — `IMPLEMENTED — ENTERPRISE QUERY ISOLATION AVAILABLE`:** `EnterpriseScope` canônico,
  filtro empresarial anterior ao lookup e repositories explícitos nos módulos auth/contexto,
  grants, assignments e dashboard, com testes unitários, HTTP e PostgreSQL de duas empresas. As 129
  rotas legadas continuam adiadas e não são declaradas seguras.
- **ETP-015.7 — `IMPLEMENTED — AUTHORIZATION AUDIT FOUNDATION AVAILABLE`:** catálogo fechado de 27
  eventos, envelope tipado, decisão efetiva imutável, metadata deny-by-default, writer único,
  verificador AST e rollback atômico cobrem os produtores canônicos. Não houve migration, endpoint,
  capability, frontend ou auditoria de leitura sensível.
- **ETP-015.6 — `IMPLEMENTED — APPROVED MINIMAL DATA PROJECTION AVAILABLE`:** 110/110
  decisões `FC-*`, capabilities limitadas aos contratos mínimos, AR-01..10 e CP-01..06 foram
  homologados pelo `PROJECT_OWNER` em 2026-08-08. As cinco famílias estão prontas segundo a
  [reconciliação](../security/ETP-015_6_IMPLEMENTATION_READINESS_RECONCILIATION.md). BDP-001 e BDP-011
  permanecem pendentes para exposições futuras. As 33 rotas canônicas usam presenters `MINIMAL`,
  CP-01..06 e OpenAPI explícito; somente AR-03 (`ACCESS_GRANTS_VIEWED`) foi ativado. Não houve
  migration, capability, grant ou assignment.
- **Gate B — `APPROVED — SECURITY — 2026-08-10`:** oito itens técnicos pós-merge possuem evidência
  binária `PASS`, consolidada em
  [ETP-015_GATE_B_POST_MERGE_EVIDENCE.md](../security/ETP-015_GATE_B_POST_MERGE_EVIDENCE.md), e a
  [decisão humana](../security/ETP-015_GATE_B_SECURITY_APPROVAL.md) aprovou o Gate B.
- **ETP-015.8 — `COMPLETED — POST-MERGE VERIFIED`:** os quatro aliases P0 são
  adapters deprecated para history/close/reopen canônicos, com JWT, empresa, capability, projeção
  `MINIMAL`, telemetria segura e consumidor frontend migrado. O inventário agora contém 31 handlers
  por capability e 125 deferred. Não houve migration, capability, grant, assignment ou evento novo.
- **Gate C — `APPROVED — SECURITY / PRODUCT / DP — 2026-08-10`:** 8/8 itens técnicos `PASS`, 0
  `FAIL`; a [homologação humana](../security/ETP-015_GATE_C_HUMAN_APPROVAL.md) foi registrada sem
  condições bloqueadoras.
- **Verificação pós-merge:** PR #86 incorporado por
  `b8324037b053b947692992d698888ed6e73db5f2`; a
  [evidência](../security/ETP-015_8_POST_MERGE_VERIFICATION.md) confirmou ausência de regressões,
  PostgreSQL 16, cobertura, demo e invariantes com resultado `PASS`.
- **ETP-015.9 — `ENTRY DECISIONS RECORDED — FUNCTIONAL IMPLEMENTATION NOT AUTHORIZED`:** a
  [prontidão](../security/ETP-015_9_ENTRY_READINESS.md) foi convertida em
  [ED-01–ED-06](../security/ETP-015_9_ENTRY_DECISION_PACKAGE.md), homologadas em 2026-08-12 sem
  autorizar implementação. Residual P0 fica `PRESERVE / DEFER`; 19 capabilities e 27 eventos são
  preservados; owners continuam pendentes; Company é somente a primeira candidata funcional, sem
  autorização; P4 é exclusivamente preservação/reconciliação. ETP-015.10 permanece `NOT STARTED —
NOT AUTHORIZED`.
- **Próximo passo:** resolver ou delimitar BDP-012 e satisfazer capability, projeção, auditoria,
  owner, consumidores, Definition of Ready, rollback e evidence gate antes de submeter Company a uma
  autorização separada. Produção, cloud, deploy, remoção de legado, Gate D e etapas seguintes não
  estão autorizados. BDP-001–008 e BDP-010–013 permanecem `PENDING`; BDP-009 e BDP-014 permanecem
  aprovadas.
- **Company — `ENTRY DECISIONS RECORDED — FUNCTIONAL IMPLEMENTATION DEFERRED`; `NOT AUTHORIZED`:**
  a decisão humana de 2026-08-20 selecionou `E — DEFER` no
  [registro CD-01–CD-09](../security/ETP-015_9_COMPANY_ENTRY_DECISION_PACKAGE.md). BDP-012 permanece
  `PENDING`; os seis handlers permanecem `LEGACY_DEFERRED`; capabilities 19 e eventos 27 permanecem
  sem adições; owners continuam `PENDING HUMAN ASSIGNMENT`; e a Definition of Ready permanece 6
  `PASS` / 10 `PENDING/BLOCKED`. A decisão não autoriza runtime, projeção, Gate D ou rollout.
- **Gate:** Gates A–D em `docs/project-management/ETP-015_RELEASE_GATES.md`; somente o incremento
  aprovado pode avançar.
- **Limites da ETP-015.1:** capabilities, autorização, isolamento, migração de endpoints, domínio,
  DTOs, schema, seed e frontend permanecem inalterados.

### ETP-016 e ETP-017 — propostas

- **Status:** não iniciadas; títulos propostos, sem especificação aprovada.
- **Proposta:** ETP-016 relatórios/inteligência; ETP-017 hardening/observabilidade/performance.
- **Gate:** especificação, análise das BDPs e aprovação antes de código.

### Full Functional Delivery — Wave P1

- **Status:** `FULL DELIVERY P1 — POST-MERGE VERIFIED`.
- **Baseline:** `develop@75aa22c391bdf849a73a4076e6bb628ae4ad0913`; Essential MVP remains a
  mandatory 17/17 regression gate.
- **Scope:** Company 6, Employee 12, Employment Contract 7, Payroll Parameter 4 and Payroll Rubric
  4; total 33/33 handlers.
- **Authorization:** ten company-scoped capabilities; no role-name decision, no super-capability and
  no automatic assignment. Runtime classification target is 64 capability-protected and 92
  `LEGACY_DEFERRED` out of 165 handlers.
- **Isolation:** Employee, Contract, Parameters and Rubrics derive authority from the principal's
  active company and return `404` across companies. Company administration is globally scoped only
  through `company.read/manage`.
- **Projection/audit:** explicit selects and fourteen new transaction-required audit events; runtime
  audit catalog target 41.
- **Database:** zero P1 migrations; existing 16 migrations are unchanged.
- **Evidence:** [plan](../full-delivery/FULL_DELIVERY_PLAN.md) and
  [acceptance inventory](../full-delivery/P1_ACCEPTANCE.md).
- **Historical boundary:** P2, P3 and P0-RESIDUAL were outside the P1 baseline and are now
  post-merge verified in their own acceptance records. BDP-012 remains open and no economic group
  or sibling-company authority was inferred.

### Full Functional Delivery — Wave P2

- **Status:** `FULL DELIVERY P2 — POST-MERGE VERIFIED`.
- **Baseline:** `develop@ad099b8cf0d223533e5b17d2d69324ce2e562b21`; Essential MVP 17/17 and P1
  33/33 remain mandatory regression gates.
- **Scope:** Organization 24, Admission 19, Leave 5 and Variable Compensation 8; total 56/56
  handlers.
- **Authorization:** eight company-scoped family capabilities; no role-name decision,
  super-capability or automatic assignment. Runtime classification is 120 capability-protected and
  36 `LEGACY_DEFERRED` out of 165 handlers, with zero unclassified.
- **Isolation:** all P2 resources derive authority from the principal's active company, validate
  related records in that company and return `404` across companies.
- **Projection/audit:** explicit minimum projections and nineteen new transaction-required audit
  events; runtime audit catalog is 60.
- **Frontend:** Organization, Admission, Leave and Variable Compensation are functional and reuse the
  shared PR #94 DataTable standard with capability-aware actions and company-isolated cache keys.
- **Database:** zero P2 migrations; all 16 existing migrations remain unchanged. The canonical seed
  creates zero assignments.
- **Evidence:** [plan](../full-delivery/FULL_DELIVERY_PLAN.md) and
  [acceptance inventory](../full-delivery/P2_ACCEPTANCE.md).
- **Deferred:** P3 remains 21 handlers and P0-RESIDUAL remains 15. Open BDPs and later-wave scope are
  preserved; the system as a whole is not declared complete.

### Full Functional Delivery — Wave P3

- **Status:** `FULL DELIVERY P3 — POST-MERGE VERIFIED`.
- **Baseline:** `develop@627ebce4e11b1ad06d434c0fe1dde9da00c043dc`; Essential MVP 17/17, P1
  33/33 and P2 56/56 remain mandatory regression gates.
- **Scope:** Time 8, Benefit 6 and Vacation 7; total 21/21 handlers.
- **Authorization:** six company-scoped family capabilities; no role-name decision,
  super-capability or automatic assignment. Runtime classification is 141 capability-protected and
  15 `LEGACY_DEFERRED` out of 165 handlers, with zero unclassified.
- **Isolation:** all P3 resources derive authority from the principal's active company, validate
  related records in that company and return `404` across companies.
- **Projection/audit:** explicit minimum projections and fourteen new transaction-required audit
  events; runtime audit catalog is 74.
- **Frontend:** Time, Benefit and Vacation workflows are functional and reuse the shared PR #94
  DataTable standard with capability-aware actions and company-isolated cache keys.
- **Database:** zero P3 migrations; all 16 existing migrations remain unchanged. The canonical seed
  creates zero assignments.
- **Evidence:** [plan](../full-delivery/FULL_DELIVERY_PLAN.md) and
  [acceptance inventory](../full-delivery/P3_ACCEPTANCE.md).
- **Deferred:** P0-RESIDUAL remains 15 handlers. Open BDPs and later-wave scope are preserved; the
  system as a whole is not declared complete.

### Full Functional Delivery — Wave P0-RESIDUAL

- **Status:** `FULL FUNCTIONAL DELIVERY — POST-MERGE VERIFIED`.
- **Baseline:** `develop@798552f3d1ed62a00542be7bb8d05b9f9e0bfa18`; Essential MVP 17/17, P1
  33/33, P2 56/56 and P3 21/21 remain mandatory regression gates.
- **Scope:** Payroll Period legacy 6, Payroll Input 4 and Payroll Run 5; total 15/15 handlers.
- **Authorization:** five indispensable company-scoped capabilities; reads reuse the canonical
  period view capability. No `platform.manage` fallback, role-name decision or automatic
  assignment. Runtime classification is 156 capability-protected, zero `LEGACY_DEFERRED` and zero
  unclassified out of 165 handlers.
- **Canonical reuse:** close, reopen, readiness and history remain exclusively in their canonical
  services. Residual period routes are protected projections or distinct pre-closure lifecycle
  operations; no parallel payroll rule was introduced.
- **Isolation/projection/audit:** all resources derive company from the principal, foreign resources
  return `404`, all fifteen handlers use explicit selects, and seven mutation events are written in
  the same transaction. Runtime audit catalog is 81.
- **Frontend:** Competências, Lançamentos and Execuções are functional and reuse the PR #94
  `DataTable` standard with capability-aware actions. Closing and reopening link to the canonical
  workflow.
- **Database:** zero P0-RESIDUAL migrations; all 16 existing migrations remain unchanged. Horizon
  and Atlas receive only fictitious payroll-input fixtures. The canonical seed creates zero
  assignments.
- **Evidence:** [plan](../full-delivery/FULL_DELIVERY_PLAN.md) and
  [acceptance inventory](../full-delivery/P0_RESIDUAL_ACCEPTANCE.md). The
  [global post-merge acceptance](../full-delivery/FULL_FUNCTIONAL_POST_MERGE_ACCEPTANCE.md) validates
  the integrated baseline `develop@3a7b4bd5aa0864f9630fb2bc67f5ad9087fec271`.
- **Boundaries:** Full Functional Delivery is local/demonstrative. Production, cloud, deploy, Gate
  D, ETP-015.10 and unresolved legal/business BDPs remain outside this delivery.

### MVP-001 — Protótipo executivo local

- **Status:** `IMPLEMENTED — LOCAL PROTOTYPE READY FOR MANAGEMENT VALIDATION`.
- **Base auditada:** `origin/develop@9420edc`.
- **Diagnóstico:** [estado atual](MVP-001_CURRENT_STATE_ASSESSMENT.md), com login e empresa ativa
  implementados, porém sem identidade/vínculo no seed; dashboard demonstrativo estático; fluxo
  ponta a ponta e reset ainda ausentes.
- **Escopo:** [MUST/SHOULD/COULD/OUT](MVP-001_PROTOTYPE_SCOPE.md), limitado ao uso local e a dados
  fictícios.
- **Plano:** nove incrementos em [MVP-001_IMPLEMENTATION_BACKLOG.md](MVP-001_IMPLEMENTATION_BACKLOG.md).
- **Aceite e riscos:** [critérios mensuráveis](MVP-001_DEMO_ACCEPTANCE_CRITERIA.md) e
  [registro de riscos](MVP-001_DEMO_RISK_REGISTER.md).
- **ETP-015.3:** `COMPLETED — IMPLEMENTED AND MERGED`; Operational Deployment Gate
  `PENDING FOR FUTURE TARGET ENVIRONMENT`. O gate de destino não bloqueia demo local.
- **ETP-015.4:** `IMPLEMENTED — AUTHORIZATION PRIMITIVES AVAILABLE`; nenhuma rota legada foi
  declarada segura ou migrada.
- **ETP-015.5:** `IMPLEMENTED — ENTERPRISE QUERY ISOLATION AVAILABLE` somente no recorte canônico;
  as 129 rotas legadas permanecem adiadas. A ETP-015.7 disponibiliza a fundação de auditoria; a
  ETP-015.6 aplica o perfil `MINIMAL` homologado sem ampliar o recorte legado.
- **Alterações funcionais desta etapa:** zero.
- **MVP-001.1 — `IMPLEMENTED — LOCAL BOOTSTRAP AVAILABLE`:** comandos `demo:setup`, `demo:start`,
  `demo:stop`, `demo:status` e reset com confirmação operam um Compose exclusivamente local, com
  PostgreSQL 16, health check, rede e volume próprios. O setup aplica migrations e o seed existente
  sem sobrescrever ambiente local.
- **MVP-001.2 — `IMPLEMENTED — VISUAL SHELL AVAILABLE`:** identidade temporária, tokens, marca SVG,
  AppShell, navegação agrupada, estados seguros e login visual foram consolidados sem mudar o fluxo
  funcional. Credenciais, identidades e massa fictícia pertencem à MVP-001.3.
- **MVP-001.3 — `IMPLEMENTED — DEMO LOGIN AVAILABLE`:** identidades fictícias, vínculos explícitos,
  sessão revogável e seleção empresarial estão disponíveis somente no ambiente local, sem grants
  automáticos.
- **MVP-001.4 — `IMPLEMENTED — EXECUTIVE DASHBOARD AVAILABLE`:** resumo autenticado da empresa
  ativa, seções por capability, métricas persistidas, estados seguros e visualizações acessíveis.
- **MVP-001.5 — `IMPLEMENTED — DEMO DATASET AVAILABLE`:** duas empresas, 26 colaboradores e
  contratos, massa de folha/conferência e verificador automatizado, sem grants automáticos.
- **MVP-001.6 — `IMPLEMENTED — SAFE CORE DEMO FLOWS AVAILABLE`:** login, contexto empresarial,
  dashboard, bloqueio conservador das APIs legadas, troca de empresa e logout compõem o roteiro
  seguro. Escritas e consultas administrativas permanecem adiadas por zero grants e ETP-015.4.
- **MVP-001.7 — `IMPLEMENTED — DEMO MODE AND GO/NO-GO AVAILABLE`:** modo visual condicional,
  verificação não destrutiva, smoke autenticado, relatório sanitizado e documentação operacional.
- **MVP-001.8 — `IMPLEMENTED — PROTOTYPE STABILIZED`:** baseline limpa, regressão funcional,
  segurança, acessibilidade, performance, continuidade, logs e evidências finais aprovados. Todos os
  P1 foram corrigidos sem migration, grant, capability ou expansão funcional.
- **MVP-001.9 — `IMPLEMENTED — PRESENTATION PACKAGE AVAILABLE`:** deck executivo de 15 slides,
  fonte versionada, PPTX/PDF reproduzíveis, seis capturas reais, mapa de evidências, roteiro, guia,
  checklist, contingência, Q&A e coleta de feedback disponíveis em `docs/presentation`. A entrega é
  documental e de tooling; não inclui funcionalidade, grants, capabilities, produção, cloud,
  deploy ou ETP-015.4.
- **ETP-015.4 — `IMPLEMENTED — AUTHORIZATION PRIMITIVES AVAILABLE`:** entrega posterior ao MVP;
  nenhuma família legada foi migrada e nenhum grant demonstrativo foi criado.

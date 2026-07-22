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

- **Status:** fundação técnica parcial; identidade, RBAC e autorização/auditoria transversal implementados, workflow funcional não iniciado.
- **Especificação:** `docs/project-management/ETP-013_PAYROLL_REVIEW_APPROVAL_SPECIFICATION.md`.
- **Objetivo proposto:** workflow auditável de conferência, achados e decisões antes do fechamento.
- **Dependência atendida:** ETP-012 mergeada pelo PR #26.
- **Decisão de negócio:** BDP-009 resolvida para a versão 1 em `docs/project-management/BDP-009_RESOLUTION_V1.md`; ADR-007 aceita.
- **Dependências bloqueantes restantes:** implementação de identidade/autorização funcional e RBAC empresarial, auditoria transacional, migrations revisadas, contratos HTTP e critérios de retenção vinculados à BDP-011.
- **Persistência:** migration `0010_identity_company_rbac` implementa assignment usuário–empresa–papel e contexto empresarial mínimo no `AuditLog`; ainda não há persistência de ciclos, achados ou decisões.
- **Pull Request e merge da especificação:** PR #27 mergeado em `develop` no commit `58341a5`.
- **Fundação técnica:** contratos imutáveis para achados, severidade, estado e eventos append-only; invariantes de justificativa, cronologia, unicidade e isolamento por empresa; nenhum módulo NestJS, endpoint, persistência, interface ou decisão de aprovação.
- **Testes da fundação:** testes unitários do domínio neutro; integração e frontend não se aplicam sem infraestrutura operacional.
- **Documentação técnica:** `docs/modules/PAYROLL_REVIEW_FOUNDATION.md`.
- **Prontidão de identidade/autorização:** arquitetura v1 aprovada em `docs/architecture/IDENTITY_AUTHORIZATION_SPECIFICATION.md` e ADR-007; nenhuma implementação foi iniciada porque ainda não há principal autenticado, vínculo usuário–empresa, autorização aplicada ou writer de auditoria.
- **Fundação funcional:** login JWT, principal tipado, seleção validada de empresa, capabilities efetivas, autorização opt-in e isolamento reutilizável estão documentados em `docs/modules/IDENTITY_COMPANY_RBAC.md`.
- **Compatibilidade:** rotas legadas não receberam proteção global; sua migração exige inventário e testes próprios.
- **Autorização transversal:** migration `0011_authorization_audit_foundation`, grants temporários/emergenciais, auditoria atômica e inventário documentados em `docs/architecture/AUDIT_AUTHORIZATION_FOUNDATION.md`.
- **Próximo passo técnico:** revisar e implementar a fase 4, persistência neutra de ciclos, achados e eventos, sem habilitar decisões antes das policies do workflow.
- **Pacote de decisão:** `docs/project-management/BDP-009_DECISION_PACKAGE.md` homologado para v1 e preservado como evidência das alternativas avaliadas.

### ETP-014 a ETP-015

- **Status:** pendentes e sem escopo individual atribuído; devem ser planejadas exclusivamente a partir da documentação aprovada antes da implementação.

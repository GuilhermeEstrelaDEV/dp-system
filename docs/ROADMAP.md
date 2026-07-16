# Roadmap de Entregas

## Etapa 0 — Fundação documental

**Objetivo:** consolidar visão, arquitetura, governança e inventário da planilha.

**Critério de aceite:** documentos revisados e escopo do primeiro incremento priorizado.

## Etapa 1 — Descoberta e dicionário de dados

Mapear cada fonte relevante da planilha, validar regras com o DP e definir a estratégia de saneamento/migração.

**ETP-001 — Concluída oficialmente:** dicionário inicial da aba `GERAL`, classificação das seções de `LANCAMENTOS`, backlog priorizado, especificação de domínio/banco/arquitetura/fluxos/permissões e estratégia de migração foram entregues. As pendências foram transferidas para [Business Decisions Pending](project-management/BUSINESS_DECISIONS_PENDING.md) e serão tratadas incrementalmente.

## Consolidação de especificação

Foram documentados o modelo de domínio, banco de dados, arquitetura, fluxos e matriz de permissões. Decisões de negócio pendentes não bloqueiam a infraestrutura e serão resolvidas antes dos módulos afetados.

## ETP-002 — Infraestrutura técnica

**Status:** ETP-002.1 concluída — aguardando confirmação para a próxima etapa de infraestrutura.

O bootstrap de monorepo, React/Vite, NestJS, Prisma/PostgreSQL, Docker e documentação técnica foi concluído. Não inclui telas, cadastros ou qualquer funcionalidade de Departamento Pessoal. A execução de contêineres continua pendente até Docker Desktop estar disponível.

O plano e o manifesto de arquivos estão em [ETP-002 — Plano de Infraestrutura Técnica](project-management/ETP-002_INFRASTRUCTURE_PLAN.md). A revisão para pnpm + Turborepo e as fronteiras de pacotes estão registradas na [ADR-003](architecture/decisions/ADR-003-monorepo-turborepo-boundaries.md).

## ETP-003 — Application Shell e experiência visual inicial

**Status:** concluída.

O frontend agora possui sidebar responsiva e recolhível, header, breadcrumbs, menu mobile acessível, dashboard exclusivamente demonstrativo, rotas de placeholder, página 404 e fallback de erro. A etapa não inclui autenticação, autorização, API, dados reais, CRUD ou regras de Departamento Pessoal. A estrutura está documentada em [Application Shell](frontend/APPLICATION_SHELL.md).

## ETP-004 — Estrutura Organizacional

**Status:** concluída.

Empresas, filiais, departamentos, cargos e centros de custo passam a compor a fundação organizacional, com API e interface próprias. Consulte [Estrutura Organizacional](modules/ORGANIZATIONAL_STRUCTURE.md).

## ETP-005 — Colaboradores e contratos de trabalho

**Status:** concluída.

Colaboradores, contatos mínimos, contratos e histórico contratual passam a usar a estrutura organizacional. Dados pessoais e trabalhistas sensíveis, como CPF, endereço, documentos, banco e remuneração, permanecem fora do escopo até validação formal do DP. Consulte [Colaboradores e contratos](modules/EMPLOYEES_AND_CONTRACTS.md).

## ETP-006 — Admissão e checklist admissional

**Status:** concluída.

Processos admissionais demonstrativos, templates de checklist, instâncias imutáveis, itens com bloqueio/reabertura/não aplicável e requisitos documentais lógicos são tratados sem arquivos reais, integração externa ou regras legais presumidas. Consulte [Admissão e checklist admissional](modules/ADMISSION_WORKFLOW.md).

## ETP-007 — Jornada e banco de horas

**Status:** concluída.

Jornadas e escalas configuráveis, ocorrências em minutos, livro imutável de movimentos e fechamento por competência são tratados sem relógio de ponto, integração externa ou regras legais presumidas. Consulte [Jornada e banco de horas](modules/TIME_MANAGEMENT.md).

## ETP-008 — Benefícios

**Status:** em implementação.

Catálogo por empresa, planos com vigência, adesões contratuais e coparticipação parametrizável são tratados como controles demonstrativos. Não há cálculo de folha, dados de saúde, integração com operadoras ou regras legais presumidas. Consulte [Benefícios de colaboradores](modules/EMPLOYEE_BENEFITS.md).

## ETP-009 — Férias e afastamentos

**Status:** em implementação.

Períodos, solicitações, férias coletivas estruturais, afastamentos e retornos são tratados como controles administrativos demonstrativos. Não há cálculo financeiro, prazo legal, regra de fracionamento ou dado médico. Consulte [Férias e afastamentos](modules/VACATIONS_AND_LEAVES.md).

## Etapa 2 — Fundação técnica

Criar monorepo, ambientes, autenticação, autorização, auditoria, banco e pipeline de qualidade. Não inclui funcionalidade de DP.

## Etapa 3 — Cadastros e estrutura

Entregar empresas, estrutura organizacional, colaboradores, contratos, documentos e histórico.

## Etapa 4 — Rotinas trabalhistas

Entregar admissão, checklists, férias, prazos, afastamentos, benefícios e jornada.

## Etapa 5 — Folha e remuneração variável

Entregar rubricas, lançamentos, cálculos, comissões, encargos, conferência, aprovação e fechamento.

## Etapa 6 — Integrações e operação assistida

Entregar eSocial, relatórios, migração controlada, comparação paralela com a planilha, treinamento e homologação.

## Próxima entrega proposta

**Confirmação para a ETP-002.2.**

Confirmar a próxima etapa de infraestrutura: hooks, lint-staged, GitHub Actions, VSCode e validações automatizadas adicionais. Nenhum módulo de negócio será iniciado sem novo planejamento.

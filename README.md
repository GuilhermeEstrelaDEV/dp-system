# ERP de Departamento Pessoal

Sistema web para substituir a planilha operacional de Departamento Pessoal, centralizando cadastros, rotinas trabalhistas, folha, documentos, aprovações e integrações legais.

## Estado do projeto

Estado atual: **MVP-001 em execução; MVP-001.8 estabilizada e MVP-001.9 ainda não iniciada**.

## Topologia planejada

Monorepo `pnpm` + Turborepo com aplicações em `apps/web` e `apps/api`, e pacotes compartilhados em `packages/ui`, `packages/types`, `packages/config`, `packages/eslint-config` e `packages/tsconfig`. A estrutura prepara futuras aplicações mobile e integrações externas sem expor persistência ou regras internas.

## Fundação técnica disponível

- React/Vite e React Router com shell responsivo, login, empresa ativa, dashboard e fluxos de folha
  protegidos conforme as capabilities existentes.
- NestJS com OpenAPI, logger estruturado, erros correlacionados, autenticação JWT, contexto empresarial,
  RBAC opt-in, auditoria e health checks.
- Prisma 6.19.0 e PostgreSQL 16 com 16 migrations; o seed demo é local, fictício e não cria grants.
- Docker Compose dedicado à demonstração local, com PostgreSQL, Redis, API e frontend isolados.

Consulte o [manual de instalação](docs/INSTALLATION.md) e o [relatório da ETP-002.1](docs/project-management/ETP-002_STAGE_01.md).

## Protótipo executivo local

A MVP-001.1 oferece bootstrap isolado e reproduzível para demonstração local:

```powershell
pnpm demo:setup
pnpm demo:start
pnpm demo:status
pnpm demo:data:verify
pnpm demo:verify
pnpm demo:ready
pnpm demo:rehearse
pnpm demo:stop
pnpm demo:reset -- --confirm-reset
```

Consulte o [guia da demonstração](docs/DEMO_LOCAL_SETUP.md) e o
[troubleshooting](docs/DEMO_TROUBLESHOOTING.md) e as
[contas fictícias](docs/product/MVP-001_DEMO_ACCOUNTS.md). A MVP-001.3 adiciona login local seguro,
sem grants automáticos. Nenhuma configuração é adequada para produção.

A MVP-001.5 fornece um [dataset determinístico](docs/product/MVP-001_DEMO_DATASET.md) para duas
empresas. `pnpm demo:data:verify` valida contagens, isolamento, zero grants e readiness sem expor
senhas ou criar autorização.

Antes de apresentar, siga o [guia do operador](docs/demo/MVP-001_DEMO_OPERATOR_GUIDE.md) e exija
`DEMO STATUS: GO` em `pnpm demo:verify`.

A estabilização final, limitações e evidências técnicas estão no
[relatório da MVP-001.8](docs/quality/MVP-001_STABILIZATION_REPORT.md). O sistema continua sendo um
protótipo exclusivamente local; o pacote executivo da MVP-001.9 ainda não foi iniciado.

## Qualidade e validação

Os comandos de validação devem ser executados a partir da raiz do monorepo:

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm prisma:validate
pnpm check
```

`pnpm check` executa lint, typecheck, testes, build e validação do schema Prisma, nessa ordem. Consulte o [guia de desenvolvimento](docs/DEVELOPMENT.md) para testes, cobertura, hooks e padrão Conventional Commits.

## Documentação

- [Visão e escopo do produto](docs/product/PRODUCT_SCOPE.md)
- [Arquitetura e decisões técnicas](docs/architecture/ARCHITECTURE.md)
- [Arquitetura completa do sistema](docs/architecture/SYSTEM_ARCHITECTURE.md)
- [Governança de desenvolvimento](docs/PROJECT_GOVERNANCE.md)
- [Modelo de domínio](docs/domain/DOMAIN_MODEL.md)
- [Especificação do banco de dados](docs/database/DATABASE_SPECIFICATION.md)
- [Fluxos de usuário](docs/product/USER_FLOWS.md)
- [Perfis e permissões](docs/product/PERMISSIONS.md)
- [Inventário da planilha e estratégia de migração](docs/migration/EXCEL_DISCOVERY.md)
- [Dicionário de dados inicial (ETP-001)](docs/migration/ETP-001_DATA_DICTIONARY.md)
- [Roadmap de entregas](docs/ROADMAP.md)
- [Backlog inicial priorizado](docs/product/INITIAL_BACKLOG.md)
- [Decisões de negócio pendentes](docs/project-management/BUSINESS_DECISIONS_PENDING.md)
- [Plano da ETP-002](docs/project-management/ETP-002_INFRASTRUCTURE_PLAN.md)
- [Guia de desenvolvimento](docs/DEVELOPMENT.md)
- [Application Shell do frontend](docs/frontend/APPLICATION_SHELL.md)
- [Colaboradores e contratos de trabalho](docs/modules/EMPLOYEES_AND_CONTRACTS.md)
- [Admissão e checklist admissional](docs/modules/ADMISSION_WORKFLOW.md)
- [Jornada e banco de horas](docs/modules/TIME_MANAGEMENT.md)
- [Benefícios de colaboradores](docs/modules/EMPLOYEE_BENEFITS.md)
- [Férias e afastamentos](docs/modules/VACATIONS_AND_LEAVES.md)
- [ADR-003 — Monorepo e fronteiras de pacotes](docs/architecture/decisions/ADR-003-monorepo-turborepo-boundaries.md)

## Princípios

- Documentar antes de implementar.
- Entregar em incrementos pequenos, testáveis e revisáveis.
- Preservar histórico, rastreabilidade e segurança dos dados trabalhistas.
- Converter regras de negócio da planilha em domínio explícito; não reproduzir fórmulas indiscriminadamente.

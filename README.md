# ERP de Departamento Pessoal

Sistema web para substituir a planilha operacional de Departamento Pessoal, centralizando cadastros, rotinas trabalhistas, folha, documentos, aprovações e integrações legais.

## Estado do projeto

Fase atual: **ETP-003 concluída — application shell e experiência visual inicial disponíveis**.

## Topologia planejada

Monorepo `pnpm` + Turborepo com aplicações em `apps/web` e `apps/api`, e pacotes compartilhados em `packages/ui`, `packages/types`, `packages/config`, `packages/eslint-config` e `packages/tsconfig`. A estrutura prepara futuras aplicações mobile e integrações externas sem expor persistência ou regras internas.

## Fundação técnica disponível

- React/Vite, Tailwind e React Router com application shell responsivo, dashboard demonstrativo, rotas de placeholder e fallback visual, sem integração com API.
- NestJS com Swagger, logger estruturado, tratamento global de erros, JWT apenas estrutural e health check técnico.
- Prisma 6.19.0, PostgreSQL, migration e seed restritos a identidade de plataforma.
- Docker Compose e Dockerfiles configurados; execução de contêineres aguarda Docker Desktop no ambiente.

Consulte o [manual de instalação](docs/INSTALLATION.md) e o [relatório da ETP-002.1](docs/project-management/ETP-002_STAGE_01.md).

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
- [ADR-003 — Monorepo e fronteiras de pacotes](docs/architecture/decisions/ADR-003-monorepo-turborepo-boundaries.md)

## Princípios

- Documentar antes de implementar.
- Entregar em incrementos pequenos, testáveis e revisáveis.
- Preservar histórico, rastreabilidade e segurança dos dados trabalhistas.
- Converter regras de negócio da planilha em domínio explícito; não reproduzir fórmulas indiscriminadamente.

# ETP-002 — Plano de Infraestrutura Técnica

**Status:** Revisada arquiteturalmente — aguardando confirmação para implementação.

## Objetivo

Criar uma fundação técnica reproduzível para desenvolvimento do ERP, sem funcionalidades de negócio, telas do ERP, cadastros de DP ou integrações produtivas.

## Limites da etapa

### Incluído

- Monorepo pnpm + Turborepo, React/Vite/TypeScript, NestJS/TypeScript e Prisma/PostgreSQL.
- Configuração de Docker, Docker Compose, ambiente, qualidade, CI e VSCode.
- Estrutura modular vazia, aliases, logger, tratamento global de erros, Swagger e conexão de banco.
- Schema Prisma de plataforma, migration inicial e seed de papéis técnicos sem usuários reais.

### Excluído

- Telas, login funcional, cadastro de empresas, colaboradores, contratos ou qualquer regra de DP.
- APIs de domínio, eSocial, cálculos, importação da planilha, arquivos reais ou integração com fornecedor.
- Dados reais, credenciais reais, certificados e configurações produtivas.

## Sequência de implementação proposta

1. Criar configuração de workspace pnpm/Turborepo, qualidade e arquivos de ambiente.
2. Criar pacotes compartilhados de tipos, UI vazia, configuração, ESLint e TypeScript.
3. Criar containers e serviços locais de PostgreSQL, Redis, API e web.
4. Criar fundação do frontend sem tela de negócio: providers, roteamento vazio, TanStack Query, React Hook Form, Tailwind e aliases.
5. Criar fundação NestJS: bootstrap, configuração validada, Swagger, logger, contexto de requisição, filtro global de erros e Prisma interno da API.
6. Criar schema Prisma de plataforma, migration inicial e seed sem dados pessoais.
7. Configurar scripts, hooks, GitHub Actions e VSCode.
8. Executar lint, typecheck, build, testes técnicos aplicáveis, migration/seed e subida por Docker Compose.
9. Atualizar instalação, arquitetura, README e relatório de conclusão.

## Manifesto de arquivos da implementação futura

Nenhum arquivo desta lista será criado antes da aprovação.

| Área                   | Arquivos previstos                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Finalidade                                                                                                                            |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Raiz                   | `.dockerignore`, `.editorconfig`, `.env.example`, `.gitignore`, `.prettierignore`, `.prettierrc.json`, `docker-compose.yml`, `eslint.config.mjs`, `lint-staged.config.cjs`, `package.json`, `pnpm-workspace.yaml`, `turbo.json`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Ambiente, workspaces, orquestração, padrões e scripts globais                                                                         |
| Hooks, IDE e scripts   | `.husky/pre-commit`, `.vscode/extensions.json`, `.vscode/settings.json`, `scripts/README.md`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Validação antes de commit, padronização local e local reservado a automações futuras                                                  |
| CI                     | `.github/workflows/ci.yml`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Lint, typecheck, build e testes em pull requests/pushes                                                                               |
| Pacotes compartilhados | `packages/types/package.json`, `packages/types/tsconfig.json`, `packages/types/src/index.ts`, `packages/ui/package.json`, `packages/ui/tsconfig.json`, `packages/ui/src/index.ts`, `packages/config/package.json`, `packages/config/tsconfig.json`, `packages/config/src/index.ts`, `packages/eslint-config/package.json`, `packages/eslint-config/base.mjs`, `packages/eslint-config/react.mjs`, `packages/eslint-config/nest.mjs`, `packages/tsconfig/package.json`, `packages/tsconfig/base.json`, `packages/tsconfig/react.json`, `packages/tsconfig/nest.json`                                                                                                                                                                                                                                                                    | Contratos seguros, base de UI sem componentes de negócio e configuração centralizada                                                  |
| Frontend               | `apps/web/package.json`, `apps/web/index.html`, `apps/web/tsconfig.json`, `apps/web/vite.config.ts`, `apps/web/tailwind.config.ts`, `apps/web/postcss.config.cjs`, `apps/web/src/main.tsx`, `apps/web/src/app/App.tsx`, `apps/web/src/app/AppProviders.tsx`, `apps/web/src/router/index.tsx`, `apps/web/src/lib/queryClient.ts`, `apps/web/src/styles/index.css`, `apps/web/src/vite-env.d.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                         | Bootstrap React/Vite, providers técnicos, roteamento vazio, aliases e estilos-base                                                    |
| Backend e banco        | `apps/api/package.json`, `apps/api/nest-cli.json`, `apps/api/tsconfig.json`, `apps/api/tsconfig.build.json`, `apps/api/src/main.ts`, `apps/api/src/app.module.ts`, `apps/api/src/config/configuration.ts`, `apps/api/src/config/env.validation.ts`, `apps/api/src/common/filters/global-exception.filter.ts`, `apps/api/src/common/interceptors/request-logging.interceptor.ts`, `apps/api/src/common/interceptors/response-envelope.interceptor.ts`, `apps/api/src/common/logger/app-logger.service.ts`, `apps/api/src/modules/health/health.module.ts`, `apps/api/src/modules/health/health.controller.ts`, `apps/api/src/modules/auth/auth.module.ts`, `apps/api/prisma/schema.prisma`, `apps/api/prisma/seed.ts`, `apps/api/prisma/migrations/<timestamp>_initial_platform/migration.sql`, `apps/api/src/prisma/prisma.service.ts` | Bootstrap NestJS, configuração, observabilidade, erro global, Swagger, JWT base, health check técnico e persistência exclusiva da API |
| Contêineres            | `docker/api.Dockerfile`, `docker/web.Dockerfile`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Imagens reproduzíveis de API e web                                                                                                    |
| Documentação final     | `docs/INSTALLATION.md`, `docs/architecture/TECHNICAL_FOUNDATION.md`, `docs/project-management/ETP-002_COMPLETION.md`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Instalação, estado técnico entregue e evidências de validação                                                                         |

Arquivos atualizados ao concluir: `README.md`, `docs/architecture/SYSTEM_ARCHITECTURE.md`, `docs/ROADMAP.md` e este plano.

**Aditivo implementado na ETP-002.1:** `apps/api/prisma.config.ts` centraliza a configuração do Prisma e `apps/api/prisma/tsconfig.json` valida o seed fora do projeto NestJS. Ambos são arquivos de infraestrutura e não introduzem domínio de DP.

## Banco inicial de plataforma

O schema inicial ficará em `apps/api/prisma` e será limitado a identidade técnica: `User`, `Role`, `Permission`, `UserRole`, `RefreshToken` e `AuditLog`. O seed criará somente papéis do sistema, sem usuário, empresa, colaborador ou dado de DP. O modelo completo especificado em `DATABASE_SPECIFICATION.md` não será implementado nesta etapa.

**Compatibilidade de runtime:** o ambiente atual usa Node.js 20.17.0; por isso a ETP-002 usará Prisma ORM 6, conforme [ADR-004](../architecture/decisions/ADR-004-prisma-runtime-compatibility.md). A atualização para a linha mais recente do Prisma depende de atualização planejada do Node.

**Configuração Prisma:** `apps/api/prisma.config.ts` centraliza schema, diretório de migrations e seed, substituindo a configuração deprecada de seed no `package.json`.

**Typecheck Prisma:** `apps/api/prisma/tsconfig.json` valida o seed separadamente do projeto NestJS, evitando que código de ferramenta altere a raiz de saída da API.

## Critérios de aceite

- `docker-compose up` inicia web, API, PostgreSQL e Redis com configuração por ambiente.
- Turborepo executa lint, typecheck, build e testes respeitando dependências entre aplicações e pacotes.
- Web e API compilam e passam em lint/typecheck.
- Swagger é exposto apenas pela API local e health check técnico responde.
- Prisma conecta, aplica a migration inicial e executa seed repetível sem dados reais.
- Hooks, lint-staged, EditorConfig, Prettier, ESLint, CI e configurações VSCode funcionam.
- README, manual de instalação e arquitetura descrevem exatamente o que foi entregue.
- Nenhum módulo ou funcionalidade de negócio é introduzido.

## Riscos e controles

| Risco                                              | Controle                                                           |
| -------------------------------------------------- | ------------------------------------------------------------------ |
| Conflito de portas ou Docker indisponível          | Variáveis de ambiente e verificação de pré-requisitos no manual    |
| Divergência de versões Node/pnpm                   | Fixar versões suportadas e registrar no README                     |
| Seed acidental de dados reais                      | Seed limitado a papéis técnicos, sem valores de ambiente produtivo |
| Fundação excessiva ou código de negócio antecipado | Revisão de escopo e critério explícito de exclusão                 |

## Aprovação necessária

A implementação só começa após confirmação expressa deste plano revisado. Qualquer alteração no manifesto de arquivos, stack ou escopo exige atualização deste documento e, se arquitetural, ADR antes de criar código.

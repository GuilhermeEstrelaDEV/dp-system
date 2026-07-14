# Fundação Técnica — ETP-002.1

## Entregue

- Monorepo pnpm + Turborepo com aplicações web e API.
- Pacotes compartilhados para tipos, UI vazia, configuração, ESLint e TypeScript.
- Web React/Vite com Tailwind, React Router, TanStack Query e React Hook Form preparados, sem telas de negócio.
- API NestJS com configuração validada, Swagger, JWT base, logs estruturados, envelope de resposta, filtro global de erros e health check técnico.
- Prisma/PostgreSQL com schema inicial de identidade, migration manual e seed de papéis sem usuários reais.
- Docker Compose e Dockerfiles para web, API, PostgreSQL e Redis.

## Fronteiras preservadas

- `packages/types` contém contratos técnicos seguros, sem entidades Prisma.
- `packages/ui` não contém componente ou fluxo de DP.
- Prisma permanece em `apps/api/prisma` e só a API acessa o banco.
- Nenhuma funcionalidade de negócio, cadastro, tela de ERP ou integração externa foi criada.

## Compatibilidade

Prisma ORM 6 é usado pela compatibilidade com Node.js 20.17.0, conforme ADR-004. A validação em Docker fica pendente até Docker Desktop estar disponível.

## Validações da ETP-002.1

- Lockfile pnpm validado com instalação congelada em oito workspaces.
- Prisma Client 6.19.0 gerado e schema validado com Node.js 20.17.0.
- Migration inicial conferida contra os sete modelos de plataforma do schema.
- Seed conferido: cria somente papéis e permissões técnicos, sem usuários ou dados de DP.
- Lint, typecheck e build aprovados pelo Turborepo; tipos, UI e configuração compilam isoladamente.
- Testes disponíveis executados; não há testes de aplicação nesta fundação sem funcionalidades.
- `docker-compose.yml` passou em parser YAML/Prettier e os Dockerfiles passaram em checagem estrutural. `docker compose config` e subida dos contêineres permanecem pendentes por ausência do Docker Desktop.

## Correções aplicadas durante a etapa

- Migração de configuração de seed do Prisma para `prisma.config.ts`, removendo aviso de depreciação.
- Ajuste de aliases para consumir pacotes compartilhados compilados, evitando emissão indevida de arquivos fora de `apps/api/dist`.
- Separação do typecheck do seed Prisma em `apps/api/prisma/tsconfig.json`.
- Ajuste de `rootDir` e `outDir` da API para produzir `apps/api/dist/main.js`.

## Registro de revalidação — 2026-07-14

- `pnpm.cmd` 9.15.5 foi utilizado devido ao bloqueio do wrapper PowerShell `pnpm.ps1` neste ambiente.
- Prisma 6.19.0 declara suporte a Node.js `>=18.18`; o runtime local Node.js 20.17.0 é compatível.
- `pnpm.cmd exec prisma` na raiz não encontra Prisma porque ele é dependência exclusiva de `apps/api`, decisão que preserva o isolamento dos workspaces. Os comandos equivalentes com filtro da API geraram o client e validaram o schema com sucesso.
- Os pacotes compiláveis `@dp-system/types`, `@dp-system/ui` e `@dp-system/config` continuam compilando isoladamente. `@dp-system/eslint-config` e `@dp-system/tsconfig` são pacotes declarativos e não exigem scripts de build.
- A migration `0001_initial_platform` contém as sete tabelas do schema de plataforma. O seed permanece restrito a papéis e permissões, sem usuários, credenciais ou dados de Departamento Pessoal.

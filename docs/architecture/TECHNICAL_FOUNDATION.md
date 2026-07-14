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

## Qualidade e automação — ETP-002.2

- Husky, lint-staged e Commitlint validam arquivos staged e mensagens Conventional Commits localmente.
- O frontend usa Vitest com jsdom e Testing Library; a API usa Jest e ts-jest. As configurações, comandos e diretórios de cobertura permanecem isolados por aplicação.
- O Turborepo executa `test` e `test:coverage` respeitando a compilação dos pacotes compartilhados.
- `pnpm check` é o contrato local e de CI: lint, typecheck, testes, build e validação do schema Prisma.
- GitHub Actions executa o mesmo contrato em push e Pull Request; Dependabot mantém dependências e Actions monitorados.
- A etapa não altera domínio, schema Prisma, migrations ou funcionalidades de negócio.

## Validações da ETP-002.2

- `pnpm check` foi aprovado com lint, typecheck, testes, build e validação Prisma em todos os workspaces aplicáveis.
- Vitest validou o shell técnico React; Jest validou o health check técnico da API. Os runners permanecem isolados por aplicação.
- Cobertura V8 foi gerada em ambos os apps. Nesta fundação, o componente `App` e o `HealthController` alcançam 100% de linhas; o total global ainda é baixo por não haver módulos de negócio testáveis e não há threshold artificial.
- Husky instalou hooks em `.husky/_`; pre-commit foi executado sem arquivos staged, Commitlint rejeitou mensagem inválida e aceitou `chore(ci): validate quality automation`, sem criar commits.
- Workflow, Dependabot, templates e documentação foram adicionados. A execução remota do GitHub Actions depende do próximo push ou Pull Request.

## Serviços técnicos da plataforma — ETP-002.3

- A API usa prefixo global `/api` e versionamento URI padrão `v1`; Swagger fica em `/api/docs` e seu JSON em `/api/docs-json` quando habilitado por ambiente.
- Respostas HTTP possuem envelope técnico com correlation ID, timestamp e path. Erros inesperados não expõem stack trace ou detalhes internos.
- Helmet, CORS configurável, limite de body e rate limit em memória são aplicados globalmente. Health checks são isentos do limiter; múltiplas instâncias exigirão armazenamento distribuído em etapa futura.
- Liveness não consulta o banco; readiness consulta Prisma de forma leve e retorna 503 se indisponível. Shutdown gracioso usa hooks Nest e o lifecycle do Prisma.

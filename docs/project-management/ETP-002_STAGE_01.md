# ETP-002.1 — Bootstrap do Monorepo e Runtime Local

**Status:** Concluída — validação de runtime Docker pendente no ambiente.

## Escopo

Criar a fundação técnica executável de monorepo, aplicações vazias, persistência de plataforma e ambiente local, sem domínio de DP.

## Critérios de conclusão

- Dependências instaladas por pnpm e lockfile versionado.
- Lint, typecheck e build executados com sucesso.
- Prisma gera cliente e valida schema/migration.
- Docker Compose passa em validação estática; execução fica condicionada à instalação de Docker Desktop.
- Documentação, README e roadmap atualizados ao concluir.
- Execução de `docker compose config` e subida dos contêineres registradas como pendentes até Docker Desktop estar disponível.

## Resultado técnico

- `pnpm-lock.yaml` gerado e validado em modo congelado.
- React/Vite, NestJS, Prisma/PostgreSQL, Turborepo e pacotes compartilhados compilam com sucesso.
- Schema de plataforma possui apenas User, Role, Permission, UserRole, RolePermission, RefreshToken e AuditLog.
- Auth possui somente módulo JWT estrutural, sem controlador, rota ou autenticação funcional.
- Nenhuma entidade, fluxo, cadastro ou regra de Departamento Pessoal foi implementado.
- Dockerfiles e Compose foram validados estaticamente; runtime permanece pendente.

## Revalidação de continuidade — 2026-07-14

- `pnpm.cmd install` e `pnpm.cmd install --frozen-lockfile` concluídos com o lockfile v9.0 íntegro e oito importers.
- O binário Prisma permanece deliberadamente localizado em `@dp-system/api`; por isso, a execução na raiz não o resolve. A geração e a validação foram aprovadas com `pnpm.cmd --filter @dp-system/api exec prisma`.
- Lint, typecheck, build e o comando de testes disponível foram executados novamente com sucesso. Não há testes de aplicação nesta fundação.
- Foram revisados manifestos, links `workspace:*`, scripts, artefatos de build, migration, seed e módulo Auth. Nenhuma entidade ou regra de negócio de DP foi identificada.
- Docker Compose e Dockerfiles passaram em validação estática. A validação de runtime continua pendente até a instalação do Docker Desktop.

## Próxima etapa

Somente após aceite desta etapa: hooks, lint-staged, GitHub Actions, VSCode e validações automatizadas adicionais.

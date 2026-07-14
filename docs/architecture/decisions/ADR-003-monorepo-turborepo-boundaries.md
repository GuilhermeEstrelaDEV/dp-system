# ADR-003 — Monorepo Turborepo e fronteiras de pacotes

**Status:** Aceita

## Contexto

O ERP terá múltiplos módulos e poderá evoluir para Portal do Colaborador, aplicativo mobile e integrações externas. A fundação precisa permitir reutilização consistente sem compartilhar detalhes de infraestrutura ou domínio indevidamente.

## Decisão

- Adotar `pnpm` como gerenciador de pacotes e workspaces.
- Adotar Turborepo para orquestrar tarefas, cache e dependências de build.
- Manter aplicações executáveis em `apps/web` e `apps/api`.
- Manter pacotes reutilizáveis em `packages/ui`, `packages/types`, `packages/config`, `packages/eslint-config` e `packages/tsconfig`.
- Manter Prisma e migrations em `apps/api/prisma`; clientes não acessam schema, migrations ou banco.
- Publicar contratos de API seguros e tipos transversais em `packages/types`, sem expor entidades internas, dados sensíveis ou tipos de Prisma.
- Preparar a entrada futura de `apps/mobile` e adaptadores externos sem alterar contratos internos do domínio.

## Regras de dependência

```text
apps/web    -> ui, types, config, eslint-config, tsconfig
apps/api    -> types, config, eslint-config, tsconfig
packages/ui -> types, config, tsconfig
packages/types -> tsconfig
packages/config -> tsconfig

apps/web -/-> Prisma, migrations, banco ou módulos internos da API
packages/types -/-> Prisma, NestJS, React ou regras de negócio
```

## Consequências

- Tipos compartilhados reduzem divergência entre frontend e backend, mas mudanças de contrato exigem versionamento e revisão conjunta.
- O pacote `ui` mantém componentes puramente visuais e acessíveis; não contém chamadas HTTP, estado de domínio ou textos específicos de módulos.
- Configurações de lint e TypeScript ficam centralizadas, reduzindo duplicação e garantindo padrões iguais nas aplicações.
- Turborepo adiciona uma ferramenta à cadeia de desenvolvimento, compensada por cache e execução coordenada em CI.

## Alternativas rejeitadas

1. Repositórios separados para web e API: aumentariam duplicação de tipos, configuração e esforço de versionamento.
2. Prisma em pacote compartilhado: exporia detalhe de persistência a clientes e futuras aplicações.
3. Compartilhar DTOs internos do NestJS diretamente: acoplaria clientes à implementação do backend.

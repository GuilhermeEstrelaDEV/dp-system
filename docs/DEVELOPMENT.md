# Guia de Desenvolvimento

## Objetivo

Este guia define o fluxo técnico para desenvolver no monorepo sem ultrapassar o escopo aprovado de cada etapa. Código usa inglês; documentação e interface usam português quando aplicável.

## Pré-requisitos

- Node.js 20.17.x, pnpm 9.15.5 e Git.
- Docker Desktop somente quando a validação de runtime com PostgreSQL e Redis for necessária.
- Em PowerShell com bloqueio de `pnpm.ps1`, use `pnpm.cmd`.

## Primeira execução

```powershell
pnpm install
pnpm prisma:generate
pnpm check
```

Execute `pnpm dev` para iniciar as aplicações em desenvolvimento. Consulte `docs/INSTALLATION.md` para variáveis de ambiente e banco local.

## Comandos de qualidade

| Comando                | Finalidade                                                    |
| ---------------------- | ------------------------------------------------------------- |
| `pnpm lint`            | Executa ESLint em todos os workspaces aplicáveis.             |
| `pnpm typecheck`       | Executa validação TypeScript e dos pacotes compartilhados.    |
| `pnpm test`            | Executa Vitest no frontend e Jest na API.                     |
| `pnpm test:coverage`   | Gera relatórios em `apps/web/coverage` e `apps/api/coverage`. |
| `pnpm build`           | Compila todos os workspaces por meio do Turborepo.            |
| `pnpm prisma:validate` | Valida o schema Prisma da API.                                |
| `pnpm check`           | Executa lint, typecheck, testes, build e Prisma validate.     |

## Testes

- `apps/web` usa Vitest, jsdom e Testing Library para componentes React.
- `apps/api` usa Jest e ts-jest para testes da aplicação NestJS.
- Os dois runners permanecem isolados: cada aplicação possui scripts, configuração e diretório de cobertura próprios.
- Todo comportamento novo deve possuir teste quando aplicável. Não reduza regras de lint, TypeScript ou cobertura para acomodar uma alteração.
- Para rotas e componentes visuais, prefira queries acessíveis da Testing Library e roteamento em memória; os testes de frontend não devem depender da API.

## Frontend

O application shell e sua configuração de navegação estão documentados em [Application Shell](frontend/APPLICATION_SHELL.md). Mantenha caminhos, rótulos, ícones e breadcrumbs centralizados nessa configuração; telas demonstrativas devem identificar todo conteúdo fictício de modo visível.

## Git e commits

O Husky instala hooks em `pnpm install`:

- `pre-commit` executa lint-staged para aplicar ESLint e Prettier apenas aos arquivos staged.
- `commit-msg` valida a mensagem com Commitlint.

Use Conventional Commits:

```text
feat(web): add employee list
fix(api): handle invalid environment value
chore(ci): configure validation workflow
docs: update development instructions
```

Antes de abrir um Pull Request, execute `pnpm check`, atualize a documentação necessária e mantenha a entrega limitada ao escopo aprovado.

## Pull Requests e CI

O GitHub Actions instala dependências de modo congelado, gera o Prisma Client, executa `pnpm check` e publica relatórios de cobertura como artefato. Dependabot abre atualizações semanais para dependências npm e GitHub Actions.

Não inclua segredos, dados pessoais reais, artefatos gerados, migrations não aprovadas ou mudanças de domínio fora da etapa atual.

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

Os cadastros organizacionais usam TanStack Query, React Hook Form, Zod e `@hookform/resolvers`. Execute as migrations antes de testar a API contra uma base local.

Os módulos de colaboradores e contratos tratam apenas dados mínimos demonstrativos. Não inclua CPF, endereço, documentos, banco, saúde ou remuneração em fixtures, testes, logs ou telas; consulte [Colaboradores e contratos](modules/EMPLOYEES_AND_CONTRACTS.md) para o recorte LGPD e as decisões pendentes.

O fluxo admissional persiste somente metadados operacionais e requisitos documentais lógicos. Não introduza upload, armazenamento de arquivo, OCR, assinatura, eSocial ou prazo legal fixo sem decisão de DP documentada; consulte [Admissão e checklist admissional](modules/ADMISSION_WORKFLOW.md).

Jornada e banco de horas usam minutos inteiros e movimentos append-only. Não introduza integração com relógio de ponto, tolerância, adicional, compensação ou regra legal sem decisão formal de DP; consulte [Jornada e banco de horas](modules/TIME_MANAGEMENT.md).

Benefícios usam valores decimais textuais e controles de vigência/adesão. Não adicione cálculo de desconto, dados de saúde, integração com operadora, elegibilidade legal ou documentos de recusa sem a decisão BDP-008; consulte [Benefícios de colaboradores](modules/EMPLOYEE_BENEFITS.md).

Férias e afastamentos usam datas administrativas configuráveis, sem cálculo legal. Não introduza prazo, pagamento, fracionamento obrigatório, dado médico, CID ou documento real sem fonte validada e decisão de DP/Jurídico; consulte [Férias e afastamentos](modules/VACATIONS_AND_LEAVES.md).

Remuneração variável e conciliação registram somente eventos administrativos com texto decimal. Não implemente fórmula, percentual, elegibilidade, aprovação, desconto em folha, pagamento ou integração financeira sem resolver BDP-006 e BDP-009; consulte [Remuneração variável e conciliação](modules/VARIABLE_COMPENSATION.md).

## Autenticação e contexto empresarial

As rotas de bootstrap de identidade estão sob `/api/v1/auth`. `JWT_SECRET` deve ter ao menos 32 caracteres e nunca ser versionado com valor de produção; `JWT_EXPIRES_IN` controla a expiração do token de acesso e usa `15m` por padrão.

Senhas persistidas em `User.passwordHash` devem ser geradas pelo `PasswordHasherService` (`scrypt` com salt aleatório). O seed não cria usuário nem credencial padrão. Para acessar uma nova rota empresarial, aplique `JwtAuthGuard` e autorização por capability, valide novamente no caso de uso e derive a empresa exclusivamente de `principal.activeCompanyId`. Consulte [Identidade autenticada e RBAC empresarial](modules/IDENTITY_COMPANY_RBAC.md).

`TRUST_PROXY` permanece `false` salvo implantação atrás de proxy controlado. `EMERGENCY_ACCESS_MAX_HOURS` define o teto técnico de acesso emergencial entre 1 e 24 horas. Escritas críticas devem usar `AuditWriterService.transaction`; metadata fora da allowlist ou com campos sensíveis é rejeitada. Consulte [Fundação transversal](architecture/AUDIT_AUTHORIZATION_FOUNDATION.md).

Folha usa configurações e versões demonstrativas, com valores monetários representados por texto decimal. Não inclua INSS, FGTS, IRRF, alíquotas, faixas, deduções, fórmulas ou qualquer regra legal sem fonte homologada; consulte [Fundação de folha](modules/PAYROLL_FOUNDATION.md).

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

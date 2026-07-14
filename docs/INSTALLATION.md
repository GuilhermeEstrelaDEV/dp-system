# Instalação e Execução Local

## Pré-requisitos

- Node.js 20.17.x ou superior dentro da linha 20.
- Corepack habilitado para instalar pnpm 9.
- Docker Desktop para executar PostgreSQL, Redis e aplicações em contêiner.

## Configuração

1. Copie `.env.example` para `.env` e substitua valores inseguros. O arquivo `.env` local é ignorado pelo Git.
2. Execute `corepack prepare pnpm@9.15.5 --activate`. Se uma política do PowerShell bloquear o wrapper `pnpm.ps1`, use `pnpm.cmd` nos comandos locais.
3. Execute `pnpm install` na raiz.
4. Execute `pnpm prisma:generate`.
5. Com Docker disponível, execute `docker compose up --build`.
6. Em execução local sem contêineres de aplicação, inicie PostgreSQL/Redis e execute `pnpm dev`.

## Verificações

- API técnica: `http://localhost:3000/api/v1/health`.
- Swagger local: `http://localhost:3000/docs`.
- Web: `http://localhost:5173`.

## Banco

Após PostgreSQL estar disponível, execute:

```powershell
pnpm prisma:migrate:deploy
pnpm prisma:seed
```

O seed cria apenas papéis e permissões técnicos. Não cria empresa, colaborador, contrato ou dado real.

## Limitações conhecidas

Docker não estava disponível no ambiente durante a criação desta etapa; a configuração foi validada estaticamente e a execução de containers deve ser validada após instalar/iniciar Docker Desktop. Não considere a validação de runtime Docker concluída antes disso.

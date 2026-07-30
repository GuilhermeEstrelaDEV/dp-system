# Inicialização local da demonstração

## Limites

Este ambiente serve apenas para desenvolvimento e apresentação local. Não configura produção,
cloud, CI/CD, Kubernetes ou integrações externas. Os valores de `.env.demo.example` são fictícios e
inseguros fora de uma estação local.

## Pré-requisitos

- Node.js 20;
- pnpm 9;
- Docker Desktop com Docker Compose v2 em execução;
- portas padrão livres ou ajustadas em `.env.demo.local`.

## Primeiro uso

```powershell
pnpm install --frozen-lockfile
pnpm demo:setup
pnpm demo:start
pnpm demo:status
pnpm demo:data:verify
```

`demo:setup` valida ferramentas, cria `.env.demo.local` somente se ele não existir, inicia o
PostgreSQL 16, aguarda o health check, gera o Prisma Client, aplica as migrations existentes e roda o
seed. Arquivo de ambiente existente nunca é sobrescrito.

No ensaio de referência, o setup limpo levou aproximadamente 28 segundos. O primeiro
`demo:start` também constrói as imagens e pode levar alguns minutos; execuções seguintes reutilizam o
cache do Docker.

URLs padrão:

- frontend: `http://localhost:55173`;
- API: `http://localhost:53000/api/v1`;
- readiness: `http://localhost:53000/api/v1/health/ready`.

O setup executa o catálogo canônico e o [dataset local determinístico](product/MVP-001_DEMO_DATASET.md),
incluindo duas identidades, duas empresas e massa organizacional/operacional fictícia. Consulte as
[contas demonstrativas](product/MVP-001_DEMO_ACCOUNTS.md). Nenhum grant de capability é criado.

## Operação

```powershell
pnpm demo:start
pnpm demo:status
pnpm demo:stop
```

`demo:stop` preserva o volume. Um novo `demo:start` retoma os mesmos dados.

## Reset seguro

```powershell
pnpm demo:reset -- --confirm-reset
```

Sem `--confirm-reset`, o comando falha antes de remover dados. O reset aceita apenas
`DEMO_ENV=local-demo` e `DEMO_PROJECT_NAME=dp-system-demo`, executa `down --volumes` no Compose
dedicado, recria o baseline, sobe API/frontend e executa `demo:data:verify`. Seu alvo é exclusivamente
`dp-system-demo-postgres-data`; volumes do
Compose padrão ou de outros projetos não são removidos.

O seed exige ainda `DEMO_MODE=true`, banco `dp_system_demo` em host local e ambiente não produtivo.
A data-base é `2026-07-01`.

## Recursos previsíveis

| Recurso    | Nome padrão                                         |
| ---------- | --------------------------------------------------- |
| containers | `dp-system-demo-postgres`, `-redis`, `-api`, `-web` |
| rede       | `dp-system-demo-network`                            |
| volume     | `dp-system-demo-postgres-data`                      |
| PostgreSQL | 16 Alpine, porta host `55432`                       |
| Redis      | porta host `56379`                                  |

As portas podem ser alteradas em `.env.demo.local`. CORS e `VITE_API_URL` devem continuar apontando
para as portas locais correspondentes.

# MVP-001 — Segurança do seed demonstrativo

## Gate fail-closed

O seed e o verificador exigem simultaneamente:

- `DEMO_ENV=local-demo`;
- `DEMO_MODE=true`;
- `DEMO_SEED_ENABLED=true`;
- `NODE_ENV` diferente de `production`;
- `DATABASE_URL` apontando para `dp_system_demo` em `localhost` ou `127.0.0.1`.

Ausência ou divergência encerra o processo com código diferente de zero antes de escrever. O seed
também valida o namespace determinístico após reset.

## Proteções

- dados, domínios de e-mail e identificadores são explicitamente fictícios;
- senhas são processadas por `PasswordHasherService` e nunca persistidas em texto puro;
- não existem grants, capabilities, papel superadministrador ou bypass criados pelo dataset;
- nenhuma migration ou schema Prisma foi alterado;
- `upsert` e IDs fixos tornam execuções repetidas estáveis;
- eventos append-only nunca são atualizados;
- não há exclusão de registros externos nem limpeza ampla;
- `demo:reset` atua apenas sobre containers, rede e volume `dp-system-demo` após a flag
  `--confirm-reset`.

`pnpm demo:data:verify` confere contagens, vínculos, hashes, catálogo, zero grants, migrations,
isolamento, diferenças entre empresas, timeline e readiness de API/frontend. O gate completo de
apresentação continua reservado à MVP-001.7.

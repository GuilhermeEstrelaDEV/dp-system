# MVP-001 — Contas demonstrativas locais

Estas identidades são fictícias e existem somente quando `DEMO_ENV=local-demo`, `DEMO_MODE=true` e
`DEMO_SEED_ENABLED=true`. Não devem ser reutilizadas fora da estação local.

| Perfil             | E-mail                       | Senha local padrão | Empresas                    |
| ------------------ | ---------------------------- | ------------------ | --------------------------- |
| Administrador Demo | `admin.demo@dp-system.local` | `DemoAdmin#2026!`  | Horizonte Demo e Atlas Demo |
| Analista RH Demo   | `rh.demo@dp-system.local`    | `DemoRh#2026!`     | Horizonte Demo              |

As senhas podem ser substituídas no `.env.demo.local`. O banco armazena somente hashes scrypt
salted. O seed é idempotente, cria vínculos empresariais explícitos e **não cria grants de
capabilities**. Para restaurar o baseline: `pnpm demo:reset -- --confirm-reset`.

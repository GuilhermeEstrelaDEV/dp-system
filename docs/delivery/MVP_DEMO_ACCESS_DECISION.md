# Decisão de acesso da demonstração essencial

## Propósito

Permitir a demonstração local do fluxo canônico de fechamento sem criar grants no seed e sem ampliar o catálogo de capabilities.

## Gate

Os comandos recusam execução fora de:

- `DEMO_ENV=local-demo`;
- `DEMO_MODE=true`;
- `DEMO_SEED_ENABLED=true`;
- `NODE_ENV != production`;
- host `localhost` ou `127.0.0.1`;
- database `dp_system_demo`.

## Assignments autorizados

Somente o papel demonstrativo `ADMINISTRATOR` pode receber temporariamente:

- `payroll.review.view`;
- `payroll.period.close.view`;
- `payroll.period.close.readiness`;
- `payroll.period.close.history`;
- `payroll.period.close.execute`;
- `payroll.period.close.reopen`.

Os assignments são `MANUAL`, possuem origem `ESSENTIAL-MVP-DEMO-ACCESS`, expiram em no máximo oito horas e não são atribuídos automaticamente a nenhum papel pelo seed.

## Operação

```powershell
pnpm demo:access:grant
pnpm demo:access:status
pnpm demo:access:revoke
```

`grant` e `revoke` são idempotentes. A revogação preserva o histórico auditável e deixa zero assignments demonstrativos ativos.

## Limites

Esta decisão não autoriza grants em produção, assignments permanentes, novas capabilities, alteração de papéis reais ou redução do isolamento empresarial.

# Entrega essencial do MVP

## Estado

Esta entrega prepara exclusivamente o protótipo local do DP-System para demonstração. Ela não autoriza produção, cloud, deploy externo nem ativa APIs legadas adiadas.

Baseline: `e48b50304f23365714ba6f8635159e37ccff3620`.

## Recorte aprovado

- autenticação e seleção da empresa ativa;
- dashboard executivo com projeção mínima;
- conferência da folha;
- readiness, fechamento, replay idempotente, histórico e reabertura da competência;
- navegação limitada às superfícies do MVP;
- dados integralmente fictícios no ambiente `local-demo`.

Company, Residual P0, P1/P2/P3, Gate D, ETP-015.10 e BDPs pendentes continuam adiados.

## P0 resolvidos

### P0-01 — acesso demonstrativo explícito

O seed permanece deny-by-default e cria zero `RolePermission`. Seis capabilities já existentes podem ser atribuídas temporariamente ao papel `ADMINISTRATOR` por comando manual, com origem auditável, prazo de oito horas, idempotência e revogação explícita.

### P0-02 — fixture canônico de fechamento

Um único cenário da Horizonte Demo possui as pré-condições reais para o fechamento. O seed não cria versão de fechamento, manifesto, evento `PERIOD_CLOSED` nem evidência de idempotência.

### P0-03 — contrato de metadata do fechamento

Root cause: deriva de nomes entre o produtor de `PAYROLL_PERIOD_CLOSED` e o catálogo fechado de auditoria.

Resolution: o produtor foi alinhado ao contrato existente, usando `selectedPayrollRunId`, `linkedReviewCycleId` e `warnings`. `hashAlgorithmVersion` deixou de ser duplicado no AuditLog e continua persistido no manifesto canônico.

Security: o catálogo não foi ampliado; o sanitizador não foi alterado e continua rejeitando metadata desconhecida.

## Execução

```powershell
pnpm demo:reset -- --confirm-reset
pnpm demo:setup
pnpm demo:data:verify
pnpm demo:access:grant
pnpm demo:access:status
pnpm demo:start
pnpm demo:smoke:essential
pnpm demo:access:revoke
pnpm demo:verify
pnpm demo:rehearse
```

O reset remove somente containers, rede e volume nomeados do projeto `dp-system-demo` e exige confirmação explícita.

## Segurança

- nenhuma capability nova;
- nenhum grant automático;
- Analista RH permanece sem as capabilities de fechamento;
- recursos de outra empresa retornam 404 nas superfícies canônicas;
- o catálogo permanece com 27 eventos;
- o schema permanece com 16 migrations;
- nenhum dado pessoal real é utilizado.

## Condição de entrega

A entrega somente pode ser publicada quando o checklist, o smoke 17/17 e todas as validações do monorepo estiverem verdes.

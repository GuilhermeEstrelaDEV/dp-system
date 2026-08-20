# Checklist da entrega essencial do MVP

## Ambiente limpo

- [x] PostgreSQL 16 disponível e saudável.
- [x] 16/16 migrations aplicadas e nenhuma migration nova.
- [x] Seed demonstrativo concluído com zero grants automáticos.
- [x] Segunda execução de `demo:setup` sem duplicar dados.
- [x] `demo:data:verify` indica fixture `PREPARED`.

## Fixture

- [x] Empresa alvo é Horizonte Demo.
- [x] PayrollRun está `COMPLETED`.
- [x] Existem dois PayrollRunEmployee pertencentes à Horizonte.
- [x] Review está `CLOSED`, round 1 e submission 1.
- [x] Duas etapas possuem duas decisões `APPROVED` válidas.
- [x] Nenhum finding `BLOCKING` permanece aberto.
- [x] Zero closure versions e zero manifests antes do close.

## Acesso

- [x] `demo:access:grant` cria exatamente seis assignments `MANUAL` temporários.
- [x] Uma segunda concessão não duplica assignments ativos.
- [x] Analista RH recebe 403.
- [x] Atlas não acessa recursos da Horizonte.
- [x] `demo:access:revoke` deixa zero assignments demonstrativos ativos.

## Fluxo real

- [x] Readiness retorna HTTP 200, `isReady=true` e zero blockers.
- [x] Close cria estado, versão, manifesto, eventos, AuditLog e idempotência na mesma transação.
- [x] AuditLog utiliza somente metadata aprovada.
- [x] Replay reutiliza a mesma evidência sem duplicar artefatos.
- [x] History expõe a projeção `MINIMAL`.
- [x] Reopen cria sucessor `OPEN` e preserva o histórico.
- [x] Smoke completo termina em 17/17.

## Qualidade

- [x] `pnpm check`.
- [x] `pnpm test`.
- [x] `pnpm build`.
- [x] `pnpm prisma:generate`.
- [x] `pnpm prisma:validate`.
- [x] Suítes PostgreSQL de fechamento, auditoria, idempotência, rollback e isolamento.
- [x] `pnpm demo:verify`.
- [x] `pnpm demo:rehearse`.
- [x] `pnpm presentation:verify`.
- [x] `git diff --check`.

## Invariantes

- [x] 165 handlers: 4 públicos, 5 autenticados, 31 protegidos por capability e 125 `LEGACY_DEFERRED`.
- [x] 19 capabilities e zero novas.
- [x] 27 eventos de auditoria e zero novos.
- [x] 16 migrations e zero novas.
- [x] `schema.prisma` sem diff.
- [x] Company permanece `DEFERRED` e BDP-012 permanece `PENDING`.
- [x] Produção, cloud e deploy permanecem não autorizados.

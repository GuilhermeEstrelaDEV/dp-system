# ETP-015.4 — Rollout e rollback

## Rollout

1. manter lista nominal dos 129 handlers legados, sem declarar proteção;
2. classificar os 36 handlers canônicos já públicos ou protegidos;
3. ativar o guard global para bloquear somente desconhecidos e aplicar metadata canônica;
4. executar reconciliação de 165/165 handlers em CI;
5. migrar famílias futuras uma a uma, removendo entradas do manifesto somente com isolamento e testes;
6. não remover contratos legados antes dos gates DAL-09 a DAL-12.

Não existe feature flag permissiva. O rollout não depende de `NODE_ENV`, `VITE_DEMO_MODE`, papel,
e-mail, empresa ou grant automático.

## Rollback

Rollback desta entrega pode remover o enforcement/classificação global e restaurar os guards opt-in
anteriores apenas se JWT, sessão, empresa ativa e isolamento já presentes forem preservados. Não é
permitido:

- abrir rota classificada ou remover JWT de rota protegida;
- transformar o manifesto legado em wildcard;
- reintroduzir confiança em `companyId` do cliente;
- apagar catálogo, assignment, migration ou histórico;
- conceder capability para contornar falha.

O rollback é de aplicação, sem migration. A causa deve ser registrada e a nova rota permanecer
bloqueada até classificação corrigida.

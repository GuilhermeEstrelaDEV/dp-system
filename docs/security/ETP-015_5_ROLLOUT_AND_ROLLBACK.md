# ETP-015.5 — Rollout e rollback

## Rollout

1. publicar o contrato `EnterpriseScope` sem mudar contrato HTTP;
2. manter o guard como única factory HTTP do scope;
3. usar repositories escopados em dashboard, grants e assignments internos;
4. executar unitários, API E2E e PostgreSQL com duas empresas;
5. manter payroll review/period como já conformes e os 129 handlers no manifesto;
6. só remover uma entrada `LEGACY_DEFERRED` na onda aprovada da família.

Não existe feature flag permissiva, bypass por ambiente, e-mail, papel ou modo demo. Nenhum grant é
criado para facilitar rollout.

## Rollback

O rollback pode restaurar a organização interna anterior somente se preservar:

- empresa do principal como única autoridade;
- predicates `companyId` em list/detail/write/aggregate;
- `404` uniforme;
- validação de relações empresariais;
- JWT, sessão, guard, capability e deny-by-default;
- atomicidade com auditoria existente.

Não é permitido restaurar update somente por ID, `companyId` livre, pós-filtro, consulta global,
wildcard legado ou cache sem empresa. Como não existe migration, Prisma ou seed nesta entrega, o
rollback é exclusivamente de aplicação/documentação. Falha em preservar os controles exige correção
forward e bloqueio da operação, não abertura temporária.

## Riscos residuais

- o verificador cobre somente módulos migrados e patterns estáveis, não prova segurança dos 129
  handlers adiados;
- modelos indiretos das famílias legadas exigem inventário próprio;
- a ETP-015.7 ainda deverá classificar eventos de negação e leitura sensível;
- índices futuros só serão propostos mediante plano de consulta da família e aprovação separada.

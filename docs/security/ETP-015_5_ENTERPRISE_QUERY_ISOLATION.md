# ETP-015.5 — Isolamento empresarial de queries

**Estado:** `IMPLEMENTED — ENTERPRISE QUERY ISOLATION AVAILABLE`

## Escopo

A entrega cria o contrato `EnterpriseScope` e o aplica aos repositories canônicos de dashboard,
substituição e acesso emergencial, além das operações internas de assignment empresarial. O escopo é
produzido pelo `ActiveCompanyGuard` a partir do principal e do `ActiveCompanyContext` resolvido; não
pode ser construído por DTO, header, query ou body.

O [inventário](ETP-015_5_DATA_ACCESS_INVENTORY.md) classifica os modelos e cada operação analisada. Os
módulos payroll review e payroll period já estavam conformes e permanecem inalterados. Os 129
handlers do manifesto continuam `LEGACY_DEFERRED`.

## Contrato canônico

`EnterpriseScope` contém somente:

- `companyId` validado;
- `actorId`, `sessionId` e `traceId` do principal;
- IDs dos assignments usados na resolução.

O construtor é privado, o objeto e sua coleção são congelados, e a factory rejeita contexto não
emitido pelo resolvedor, ator divergente ou empresa divergente. O contrato não depende de Express;
somente o adapter HTTP o anexa à requisição.

## Implementação

- `DashboardRepository` recebe scope em cada consulta e executa detalhe, `count`, `groupBy` e timeline
  com `companyId` no primeiro acesso ao banco;
- `AccessGrantsRepository` recebe scope em listagem, detalhe, criação, relações e mudanças de estado;
- create de substitution exige titular e substituto vinculados à mesma empresa; emergência exige
  beneficiário vinculado;
- revogação e expiração usam `updateMany` com `id + companyId + status`; zero linhas produz o mesmo
  `404` de recurso inexistente;
- `AssignmentGovernanceService` remove `companyId` do input empresarial, deriva-o do scope e preserva
  o predicado na revogação;
- `/auth/me` usa um predicado fechado quando ainda não existe empresa ativa, impedindo role codes de
  outras empresas;
- catálogo `Permission` e assignment global `RolePermission` continuam globais por decisão aprovada,
  sem autorizar domínio empresarial.

## Semântica e limites

- `401`: identidade ou sessão inválida, antes do repository;
- `403`: empresa ativa/vínculo/capability inválida, antes da resolução do recurso;
- `404`: ID inexistente ou pertencente a outra empresa, com o mesmo contrato externo;
- `409`: conflito funcional legítimo, não enumeração empresarial.

Não foi adicionado cache. A troca de empresa do frontend continua limpando o cache existente. Não foi
adicionado SQL raw; o único raw empresarial do recorte canônico permanece o advisory lock
parametrizado do fechamento, já escopado por empresa e competência.

Não há endpoint, métrica, migration, alteração Prisma, seed funcional, grant automático, assignment
automático, masking ou auditoria funcional nova. A ETP-015.6 e a ETP-015.7 continuam não iniciadas.

## Referências

- [patterns de query](ETP-015_5_QUERY_PATTERNS.md);
- [matriz negativa](ETP-015_5_NEGATIVE_TEST_MATRIX.md);
- [rollout e rollback](ETP-015_5_ROLLOUT_AND_ROLLBACK.md);
- [evidências de aceite](ETP-015_5_ACCEPTANCE_EVIDENCE.md).

# ETP-015.6 — Projection Profiles

## Perfil vigente

`MINIMAL` é o único perfil aprovado e implementado. Ele é definido por uma allowlist fechada de
campos por família e operação, conforme
[ETP-015_6_FIELD_CLASSIFICATION_APPROVAL_MATRIX.md](ETP-015_6_FIELD_CLASSIFICATION_APPROVAL_MATRIX.md).

Regras invariantes:

1. campo não listado como `INCLUDE` ou parte autorizada de `MIXED` é omitido;
2. resposta é montada explicitamente, sem spread de entidade persistida;
3. `companyId`, `actorId`, `traceId`, `sessionId` e conteúdo livre não são expostos quando a matriz os
   classifica como internos ou bloqueados;
4. `FULL` não existe e não pode ser solicitado por query, header ou capability;
5. futura ampliação exige decisão humana e nova evidência de aceite.

O verificador automatizado em
`apps/api/src/modules/auth/approved-minimal-projection.verifier.ts` falha se a cardinalidade, a ordem,
o perfil ou a política de masking divergirem das decisões homologadas.

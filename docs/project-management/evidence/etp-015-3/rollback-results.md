# ETP-015.3 — Rollback local

Rollback transacional (`psql -v ON_ERROR_STOP=1 -1`) sobre a fixture contendo somente backfill:

- duração 458 ms;
- 19 permissions, 133 pares RolePermission e 20.000 UserCompanyRole preservados;
- coluna UUID da nova PK removida e estrutura anterior restaurada;
- extensão compartilhada não removida.

Em banco separado, um assignment foi revogado e substituído após a 0016. O rollback retornou exit 3
com `Rollback blocked: role_permissions contains historical duplicate pairs`; o novo registro e a
coluna `id` permaneceram presentes. Não houve perda silenciosa.

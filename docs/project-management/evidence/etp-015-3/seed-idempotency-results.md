# ETP-015.3 — Seed e constraints locais

- seed oficial do PR #61 executado duas vezes: 19 capabilities nas duas execuções;
- hash/lista ordenada de IDs idêntica; 0 RolePermission e 0 UserCompanyRole automáticos;
- suíte PostgreSQL real do PR #61: 4/4 testes aprovados, incluindo concorrência e overlap;
- duas janelas adjacentes `[2030-01-01,2030-02-01)` e `[2030-02-01,2030-03-01)` foram aceitas;
- janela sobreposta foi rejeitada pela `role_permissions_no_temporal_overlap`;
- código não homologado bloqueou antes de DDL da 0016.

Comandos executados em banco descartável; nenhum seed, teste ou fixture foi modificado.

# ETP-015.3 — Upgrade local 0015 → 0016

Fixture sintética válida e não versionada: 19 permissions homologadas, 7 roles, 133 pares
RolePermission e 20.000 usuários/vínculos UserCompanyRole. Não representa produção.

| Tabela             | Antes: linhas/bytes | Depois: linhas/bytes |
| ------------------ | ------------------: | -------------------: |
| permissions        |         19 / 81.920 |         19 / 139.264 |
| role_permissions   |        133 / 57.344 |        133 / 212.992 |
| user_company_roles |  20.000 / 7.028.736 |  20.000 / 21.839.872 |

- início `2026-07-29T14:53:18.654-03:00`; fim `14:53:22.041-03:00`; 3.387,06 ms;
- índices nas três tabelas: 7 antes, 19 depois; constraints: 9 antes, 31 depois;
- zero relações criadas/removidas pelo backfill; IDs/códigos preservados;
- `btree_gist=1.7`; sem réplicas; erros/warnings da 0016: nenhum.

O tempo inclui inicialização do job/cliente e não pode ser extrapolado.

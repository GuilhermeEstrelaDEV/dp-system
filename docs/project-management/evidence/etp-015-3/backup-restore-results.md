# ETP-015.3 — Backup e restore local

Antes da 0016, `pg_dump -Fc` gerou arquivo interno descartável de 1.769.533 bytes em 490 ms.
`pg_restore -l` validou o catálogo. Restore em banco separado, com `--exit-on-error`, concluiu em
1.977 ms.

Comparação após restore: 19 permissions, 133 RolePermission e 20.000 UserCompanyRole; MD5 técnico da
concatenação ordenada de IDs/códigos idêntico à origem. Relações foram preservadas.

O dump não foi versionado e o contêiner foi descartado. Backup/restore de destinos reais continuam
`NOT EVIDENCED`; RPO/RTO reais permanecem `PENDING`.

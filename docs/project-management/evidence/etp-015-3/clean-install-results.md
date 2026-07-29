# ETP-015.3 — Instalação limpa local

**Comando:** cada SQL 0001–0016 via `psql -v ON_ERROR_STOP=1 -1`, banco Docker descartável.

- início `2026-07-29T14:50:52.401-03:00`; fim `14:50:57.122-03:00`;
- total das 16 migrations: 4.721,21 ms; 0016: 414,46 ms;
- estado inicial: zero migrations/tabelas de aplicação; 0016 concluiu sem erro;
- após migrations, antes do seed: 0 permissions, 0 RolePermission e 0 UserCompanyRole;
- `btree_gist=1.7`; duas exclusion constraints presentes;
- avisos: truncamento PostgreSQL de dois nomes longos de índices preexistentes;
- seed: primeira execução 3.396 ms, segunda 1.179 ms; 19 permissions, IDs preservados e zero
  assignments automáticos.

O código sintético `future.unapproved` fez a 0016 falhar com exit 3; a transação preservou 20 códigos,
zero `btree_gist` e zero tipos da 0016. Evidência local apenas.

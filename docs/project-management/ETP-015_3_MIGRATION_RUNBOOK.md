# ETP-015.3 — Runbook da migration 0016

> **IMPLEMENTED IN PR #61 — NOT MERGED.** Não executar em ambiente externo sem o release gate.

## Pré-deploy

- [ ] identificar ambiente, provedor e PostgreSQL (`SHOW server_version`);
- [ ] validar autorização e disponibilidade de `btree_gist` em `pg_available_extensions`;
- [ ] coletar `count(*)`, `pg_total_relation_size` e índices de `permissions`, `role_permissions` e
      `user_company_roles`;
- [ ] inventariar locks (`pg_locks`/`pg_stat_activity`), transações antigas e replica lag;
- [ ] registrar `statement_timeout` e `lock_timeout` aprovados, sem inventar valores;
- [ ] produzir backup íntegro e evidência de restore dentro do RPO/RTO;
- [ ] aprovar janela, comunicação e suspensão de jobs/writers conflitantes;
- [ ] drenar tráfego/instâncias conforme o rollout e encerrar transações persistentes;
- [ ] comprovar a combinação de aplicação/schema a ser usada.

Consultas somente leitura candidatas:

```sql
SHOW server_version;
SELECT name, default_version, installed_version
FROM pg_available_extensions WHERE name = 'btree_gist';
SELECT relname, n_live_tup FROM pg_stat_user_tables
WHERE relname IN ('permissions', 'role_permissions', 'user_company_roles');
SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
FROM pg_catalog.pg_statio_user_tables
WHERE relname IN ('permissions', 'role_permissions', 'user_company_roles');
SELECT pid, state, wait_event_type, wait_event, xact_start, query_start
FROM pg_stat_activity WHERE datname = current_database();
```

## Execução coordenada

O comando canônico do repositório é:

```powershell
pnpm prisma:migrate:deploy
```

Prisma controla a migration transacional. Para ensaio manual aprovado do SQL, usar cliente com
`ON_ERROR_STOP=1` e transação explícita; nunca concatenar credenciais ao histórico:

```text
psql --set ON_ERROR_STOP=1 --single-transaction --file <migration-aprovada.sql>
```

Registrar início/fim, migration anterior/final, contagens e operador. Em conexão independente,
observar `pg_stat_activity`, `pg_locks`, sessões bloqueadas e replica lag. Interromper conforme o
procedimento do provedor se extensão/constraint falhar, lock exceder limite aprovado, lag ultrapassar
o gate, ocorrer timeout/erro ou as contagens divergirem. Não repetir cegamente: diagnosticar rollback
transacional e obter novo go/no-go.

## DDL, PK, FKs e locks

A candidata cria a extensão, enums/colunas/checks, três índices de catálogo, UUID e nova PK em
`role_permissions`, remove/recria duas FKs legadas como `RESTRICT`, adiciona quatro FKs de
proveniência/substituição, cinco índices de lookup e uma exclusion constraint GiST. Em
`user_company_roles`, substitui o índice único parcial, adiciona quatro FKs, três índices e uma
exclusion constraint.

`ALTER TABLE`, remoção/criação de PK, FKs e exclusion constraints podem solicitar `ACCESS EXCLUSIVE`;
criação de índice não concorrente lê a tabela e afeta escrita. Transações antigas podem prolongar a
espera. Leituras e escritas podem ficar bloqueadas, especialmente em tabelas grandes. Timeout,
cancelamento, retry e janela dependem de medição e aprovação DBA — não há duração estimada.

| Evidência do ensaio                      | Valor           |
| ---------------------------------------- | --------------- |
| Registros e tamanho por tabela           | `NOT EVIDENCED` |
| Tempo total / maior lock / espera máxima | `NOT EVIDENCED` |
| Queries bloqueadas / impacto em réplicas | `NOT EVIDENCED` |
| Responsável / data / resultado           | `PENDING`       |

## `btree_gist`

`CREATE EXTENSION IF NOT EXISTS "btree_gist"` fornece classes GiST usadas por
`role_permissions_no_temporal_overlap` e `user_company_roles_no_temporal_overlap`. O comando é
idempotente quanto à presença, mas requer privilégio autorizado e suporte do provedor. Indisponibilidade,
instalação não ensaiada ou ausência de privilégio bloqueia o deploy. Não remover as constraints para
contornar o gate.

## Compatibilidade entre versões

| Combinação                           | Estado                                            | Evidência requerida                           |
| ------------------------------------ | ------------------------------------------------- | --------------------------------------------- |
| Aplicação anterior + schema anterior | `SUPPORTED`                                       | estado atual mesclado                         |
| Aplicação anterior + schema novo     | `NOT TESTED`                                      | regressão representativa com binário anterior |
| Aplicação nova + schema anterior     | `UNSUPPORTED`                                     | cliente novo requer colunas/modelos da 0016   |
| Aplicação nova + schema novo         | `VALIDATED IN PR #61`, operacionalmente `PENDING` | ensaio no destino                             |

Até provar aplicação anterior + schema novo, a ordem segura candidata é manutenção coordenada:
pausar tráfego e jobs, drenar instâncias, aplicar migration, publicar aplicação candidata, executar
smoke tests e retomar gradualmente. Abortar antes da migration se drenagem falhar; após DDL, seguir o
runbook de recuperação.

## Pós-deploy

- [ ] `prisma migrate status` confirma 0016;
- [ ] exatamente 19 capabilities e classificações PC-01..PC-19;
- [ ] zero assignments automáticos e mesmos IDs/relações legados;
- [ ] checks, FKs, índices e duas exclusion constraints presentes;
- [ ] seed executado conforme procedimento e idempotente;
- [ ] aplicação, logs, latência, erros e pools saudáveis;
- [ ] réplicas sincronizadas e performance aprovada;
- [ ] contagens antes/depois e horários anexados ao template;
- [ ] janela encerrada somente após aprovação do responsável.

## Resultado do ensaio local

Instalação limpa: 4.721,21 ms para 16 migrations e 414,46 ms para a 0016. Upgrade sintético com
20.000 vínculos: 3.387,06 ms. Foram observados `AccessExclusiveLock` e outros modos; leitura e escrita
concorrentes aguardaram 1.636 ms e 1.508 ms. Consulte
[clean install](evidence/etp-015-3/clean-install-results.md),
[upgrade](evidence/etp-015-3/upgrade-results.md) e
[locks](evidence/etp-015-3/migration-lock-observation.md). Não extrapolar para destinos reais.

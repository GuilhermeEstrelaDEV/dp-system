# ETP-015.3 — Runbook de rollback e recuperação

## Gate de backup e restore

| Campo                               | Evidência                   |
| ----------------------------------- | --------------------------- |
| Tipo/escopo/data e hora do backup   | `NOT EVIDENCED`             |
| Retenção/criptografia/armazenamento | `NOT EVIDENCED`             |
| Responsável/integridade             | `PENDING` / `NOT EVIDENCED` |
| RPO/RTO aprovados                   | `PENDING` / `PENDING`       |
| Ambiente e procedimento de restore  | `NOT EVIDENCED`             |
| Duração/resultado do teste          | `NOT EVIDENCED`             |
| Decisão go/no-go                    | `PENDING`                   |

Sem backup recuperável, restore testado, RPO/RTO compatíveis, responsável e janela suficiente, o
deploy está bloqueado.

## A — Rollback da aplicação sem rollback do banco

É o caminho preferencial somente se a aplicação anterior + schema novo tiver sido comprovada. Pausar
o rollout, drenar instâncias novas, publicar a versão anterior e validar leituras/grants sem remover
identidade, empresa ativa ou isolamento. Preserva catálogo, histórico, AuditLog, PK/FKs e
`btree_gist`. Se essa combinação estiver `NOT TESTED`, exige decisão humana e manutenção coordenada.

## B — Rollback da aplicação e da migration

Executar somente o `rollback.sql` revisado do PR #61, em janela aprovada, com `ON_ERROR_STOP` e
transação explícita. Suas precondições devem bloquear quando houver pares históricos duplicados,
assignments revogados/expirados ou qualquer assignment/histórico posterior que perderia proveniência.
AuditLog não substitui os registros históricos. A extensão compartilhada não é removida.

```text
psql --set ON_ERROR_STOP=1 --single-transaction --file <rollback-0016-aprovado.sql>
```

Antes: parar writers, capturar contagens/IDs/pares, confirmar backup/restore e verificar dependências.
Depois: restaurar PK composta/FKs/índices anteriores, validar registros, consumidores e acesso efetivo.
Se a precondição bloquear ou surgir risco de perda, não forçar: manter schema, aplicar rollback somente
da aplicação se comprovado ou decidir forward fix/restore com DBA.

## Recuperação e decisão

- erro transacional sem commit: comprovar rollback do banco, coletar logs e replanejar;
- commit com aplicação incompatível: manter tráfego pausado e escolher A, B ou forward fix;
- corrupção/divergência: restaurar somente com aprovação, reconciliar mudanças após o backup e medir
  perda potencial contra RPO;
- réplicas atrasadas: não promover nem retomar tráfego até consistência e lag aprovados;
- toda ação registra executor, horários, evidência, impacto e decisão humana.

Não há autorização para perda silenciosa ou remoção de `btree_gist` compartilhada.

## Evidência local

Backup/restore local preservou contagens e hash de IDs/códigos. Rollback somente com backfill concluiu
em 458 ms e preservou 19/133/20.000 registros; cenário com histórico posterior foi bloqueado com exit
3 e manteve a estrutura/dados. Evidências:
[backup e restore](evidence/etp-015-3/backup-restore-results.md) e
[rollback](evidence/etp-015-3/rollback-results.md). Destinos, RPO e RTO seguem pendentes.

## Declaração operacional recebida

- backup: `pg_dump` local, recuperável apenas no ensaio local;
- restore: testado durante o ensaio local da ETP-015.3;
- rollback da aplicação: permitido conforme este runbook;
- rollback da migration: permitido somente sem histórico posterior incompatível;
- RPO, RTO, responsável pelo restore e autorizador do rollback: `PENDING` para destinos.

A declaração não constitui aprovação formal e não evidencia recuperação em ambiente de destino.

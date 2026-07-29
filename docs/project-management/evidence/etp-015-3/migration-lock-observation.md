# ETP-015.3 — Observação local de locks

Amostragem por conexão independente durante o upgrade sintético, com polling solicitado a cada 20 ms
mais overhead do Docker. Foram observados em `permissions`, `role_permissions` e
`user_company_roles`: `AccessExclusiveLock`, `AccessShareLock`, `RowExclusiveLock`, `ShareLock` e
`ShareRowExclusiveLock`; tabelas referenciadas também tiveram locks de compartilhamento e, em
`roles`, `AccessExclusiveLock`.

Em repetição sobre restore da fixture, uma leitura concorrente de `role_permissions` concluiu em
1.636 ms e uma escrita no catálogo em 1.508 ms, após aguardar a migration. Ambas terminaram sem erro
com `statement_timeout=10s` na sessão de prova.

Não foram capturados PID/query privados nem foi possível determinar o maior wait diretamente: a
curta duração e o overhead do polling limitam a amostragem. O resultado comprova que locks fortes
ocorrem; não estima impacto de produção.

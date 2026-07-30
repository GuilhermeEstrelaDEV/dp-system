# MVP-001 — Verificação operacional

Execute, com o ambiente iniciado:

```bash
pnpm demo:verify
```

O comando é não destrutivo e termina com código `0` e `DEMO STATUS: GO` somente quando todos os
bloqueios passam. Ele valida ferramentas, alvo local, containers, rede, volume, health, migrations,
dataset, duas identidades, três vínculos, zero grants, API, frontend, login, Horizonte, Atlas,
dashboard restrito, empresa não vinculada (`403`), logout, sessão revogada (`401`) e Analista RH.

O smoke cria duas sessões técnicas — uma por identidade — e encerra apenas essas sessões. Tokens e
credenciais permanecem em memória e nunca são impressos.

Opções:

- `pnpm demo:verify -- --report`: grava JSON sanitizado em `.demo-reports/`;
- `pnpm demo:rehearse`: executa somente readiness HTTP e o roteiro técnico;
- `pnpm demo:ready`: inicia/constrói sem reset, aguarda readiness e executa a verificação completa.

Em `NO-GO`, execute a correção indicada. Use `pnpm demo:reset -- --confirm-reset` somente quando o
baseline estiver inválido; o verificador jamais chama reset, seed ou migration de escrita.

## Matriz de verificações

| Item                     | Dependência/comando                | Esperado                                   | Severidade      | Falha e correção              |
| ------------------------ | ---------------------------------- | ------------------------------------------ | --------------- | ----------------------------- |
| Docker/daemon/Compose    | `docker info`, Compose v2          | disponíveis                                | `BLOCKING`      | iniciar Docker Desktop        |
| Ambiente                 | `.env.demo.local`                  | alvo `local-demo` completo                 | `BLOCKING`      | comparar com o exemplo        |
| Rede/volume/containers   | Docker inspect                     | nomes previstos e health                   | `BLOCKING`      | `pnpm demo:start`             |
| Portas                   | HTTP/health nos ports configurados | serviços esperados respondem               | `BLOCKING`      | liberar portas ou ajustar env |
| PostgreSQL/Redis/API/web | health/readiness                   | saudável/HTTP 200                          | `BLOCKING`      | diagnosticar serviço          |
| Migrations/dataset       | verificador especializado          | 16 migrations e contagens exatas           | `BLOCKING`      | reset confirmado              |
| Autenticação/contexto    | smoke HTTP                         | login, duas empresas, dashboards restritos | `BLOCKING`      | reset/diagnóstico da API      |
| Segurança                | smoke + dataset                    | `403`, `401`, zero grants                  | `BLOCKING`      | não apresentar até corrigir   |
| Working tree             | Git                                | limpa                                      | `WARNING`       | revisar alterações locais     |
| Navegador/resolução      | inspeção humana                    | Edge/Chrome, ≥1366×768                     | `WARNING`       | ajustar antes da apresentação |
| Offline                  | inspeção/build                     | assets locais após preparação              | `INFORMATIONAL` | aquecer build com internet    |

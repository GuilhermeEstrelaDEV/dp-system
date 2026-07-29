# Diagnóstico da demonstração local

| Sintoma                      | Diagnóstico                              | Ação corretiva                                                            |
| ---------------------------- | ---------------------------------------- | ------------------------------------------------------------------------- |
| Docker indisponível          | `docker info` falha                      | iniciar Docker Desktop e repetir `pnpm demo:setup`                        |
| pnpm recusado                | versão não é 9.x                         | habilitar Corepack e instalar pnpm 9                                      |
| porta ocupada                | container não inicia/bind falha          | ajustar a porta correspondente em `.env.demo.local`                       |
| PostgreSQL não fica saudável | `demo:setup` expira em 60s               | executar `pnpm demo:status` e `docker logs dp-system-demo-postgres`       |
| migration/seed falha         | comando encerra com etapa identificada   | corrigir a causa; migrations são transacionais e setup pode ser repetido  |
| API não fica saudável        | `dp-system-demo-api` unhealthy           | verificar logs, URL do banco e se `demo:setup` concluiu                   |
| frontend não acessa API      | erro CORS/rede                           | alinhar `WEB_PORT`, `API_PORT`, `CORS_ORIGIN` e `VITE_API_URL`            |
| login falha após setup       | comportamento esperado na MVP-001.1      | aguardar a massa/identidade fictícia da MVP-001.3; não criar usuário real |
| reset recusado               | flag ausente ou ambiente não reconhecido | revisar `.env.demo.local` e usar `pnpm demo:reset -- --confirm-reset`     |

Comandos úteis:

```powershell
pnpm demo:status
docker logs dp-system-demo-postgres
docker logs dp-system-demo-api
docker logs dp-system-demo-web
```

Não edite migrations mescladas, não reutilize as credenciais locais fora da demo e não use
`docker volume prune` como procedimento de correção.

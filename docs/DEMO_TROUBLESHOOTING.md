# Diagnóstico da demonstração local

| Sintoma                      | Diagnóstico                              | Ação corretiva                                                                                  |
| ---------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Docker indisponível          | `docker info` falha                      | iniciar Docker Desktop e repetir `pnpm demo:setup`                                              |
| pnpm recusado                | versão não é 9.x                         | habilitar Corepack e instalar pnpm 9                                                            |
| porta ocupada                | container não inicia/bind falha          | ajustar a porta correspondente em `.env.demo.local`                                             |
| PostgreSQL não fica saudável | `demo:setup` expira em 60s               | executar `pnpm demo:status` e `docker logs dp-system-demo-postgres`                             |
| migration/seed falha         | comando encerra com etapa identificada   | corrigir a causa; migrations são transacionais e setup pode ser repetido                        |
| API não fica saudável        | `dp-system-demo-api` unhealthy           | verificar logs, URL do banco e se `demo:setup` concluiu                                         |
| frontend não acessa API      | erro CORS/rede                           | alinhar `WEB_PORT`, `API_PORT`, `CORS_ORIGIN` e `VITE_API_URL`                                  |
| login falha após setup       | seed demo ausente ou API indisponível    | executar `pnpm demo:setup`, conferir `pnpm demo:status` e usar as contas fictícias documentadas |
| dataset incompleto           | contagem, vínculo ou timeline divergente | executar `pnpm demo:data:verify`; se persistir, realizar o reset confirmado                     |
| seed demo recusado           | gate local não confirmado                | validar `DEMO_ENV`, `DEMO_MODE`, banco local e `NODE_ENV` não produtivo                         |
| reset recusado               | flag ausente ou ambiente não reconhecido | revisar `.env.demo.local` e usar `pnpm demo:reset -- --confirm-reset`                           |
| gate retorna `NO-GO`         | uma dependência bloqueante falhou        | seguir a ação corretiva e o [plano de contingência](demo/MVP-001_DEMO_CONTINGENCY_PLAN.md)      |

Comandos úteis:

```powershell
pnpm demo:status
pnpm demo:verify
docker logs dp-system-demo-postgres
docker logs dp-system-demo-api
docker logs dp-system-demo-web
```

Não edite migrations mescladas, não reutilize as credenciais locais fora da demo e não use
`docker volume prune` como procedimento de correção.

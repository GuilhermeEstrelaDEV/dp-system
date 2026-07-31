# MVP-001 — Plano de contingência

| Sintoma                  | Diagnóstico/comando            | Recuperação estimada                             | Limite e alternativa                                        |
| ------------------------ | ------------------------------ | ------------------------------------------------ | ----------------------------------------------------------- |
| Docker parado            | `docker info`                  | 2–5 min: iniciar Desktop                         | desistir ao exceder 5 min; explicar arquitetura verbalmente |
| Porta ocupada            | `pnpm demo:status`             | 2 min: encerrar processo legítimo ou ajustar env | não matar processo desconhecido                             |
| API/web/banco não pronto | `pnpm demo:verify`             | 2–5 min: `pnpm demo:start`                       | se persistir, não demonstrar fluxo ao vivo                  |
| Dataset inválido         | verificação em `NO-GO`         | 4–6 min: reset confirmado                        | não editar banco; usar screenshots previamente aprovados    |
| Login falha              | confirmar GO e conta local     | 2 min: reset/verify                              | não criar senha universal                                   |
| Sessão expirada          | retorno ao login               | <1 min: autenticar novamente                     | não restaurar sessão artificialmente                        |
| Troca falha/cache antigo | refresh e nova seleção         | 1–2 min                                          | não alterar `companyId` manualmente                         |
| Computador reiniciado    | `pnpm demo:ready`              | 3–6 min                                          | primeiro build pode exceder a janela                        |
| Internet indisponível    | verificar imagens/dependências | runtime imediato se aquecido                     | sem cache prévio, usar alternativa verbal/visual            |
| `DEMO STATUS: NO-GO`     | ler falhas exibidas            | conforme correção                                | nunca ignorar bloqueio de segurança                         |

Para a reunião gerencial, os Planos A/B/C e o pacote offline estão consolidados em
[MVP-001_PRESENTATION_CONTINGENCY](../presentation/MVP-001_PRESENTATION_CONTINGENCY.md).

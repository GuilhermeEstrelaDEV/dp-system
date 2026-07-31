# MVP-001 — Roteiro final da demonstração

**Janela:** 13 minutos de apresentação, seguida de perguntas.

**Pré-condição:** `pnpm demo:ready -- --report` termina com `DEMO STATUS: GO`.

| Tempo       | Ação              | Mensagem e resultado esperado                          | Contingência           |
| ----------- | ----------------- | ------------------------------------------------------ | ---------------------- |
| 0:00–3:05   | slides 1–4        | problema, dataset fictício, objetivo e recorte local   | deck/PDF offline       |
| 3:05–4:00   | slide 5           | capacidades existentes e limites                       | mapa de evidências     |
| 4:00–4:55   | slide 6           | apresentar a jornada antes da tela ao vivo             | screenshots            |
| 4:55–5:50   | login e Horizonte | entrar, selecionar Horizonte, confirmar empresa ativa  | captura 01–03          |
| 5:50–6:45   | ajuda e restrição | mostrar dados fictícios e bloqueio pré-fetch           | captura 04–05          |
| 6:45–7:40   | troca para Atlas  | confirmar mudança integral do contexto, sem grants     | captura 02 e 06        |
| 7:40–8:35   | logout/perfil RH  | encerrar sessão; explicar vínculo restrito à Horizonte | roteiro verbal         |
| 8:35–10:20  | slides 9–11       | segurança, limites e evidências de estabilidade        | apêndice técnico       |
| 10:20–11:10 | slide 12          | operação local reproduzível e planos A/B/C             | guia operacional       |
| 11:10–12:10 | slide 13          | riscos e limitações sem minimizá-los                   | registro de riscos     |
| 12:10–13:00 | slides 14–15      | próximos caminhos e decisão esperada                   | formulário de feedback |

## Regras de execução

- não abrir `.env`, logs com headers, banco ou ferramentas administrativas durante a projeção;
- não atribuir grant, editar banco ou contornar restrições;
- não acessar CRUDs legados;
- se o gate for `NO-GO`, abandonar o fluxo ao vivo e ativar o
  [Plano B](MVP-001_PRESENTATION_CONTINGENCY.md);
- se uma pergunta exigir dado ausente, registrá-la para apuração, sem estimar.

# MVP-001 — Contingência da apresentação

## Planos

| Plano          | Quando usar                             | Material                                     | Mensagem ao público                                                 |
| -------------- | --------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------- |
| A — ao vivo    | gate GO e serviços saudáveis            | PPTX + sistema local                         | fluxo real em ambiente local com dados fictícios                    |
| B — evidências | falha de runtime, login, porta ou tempo | PPTX/PDF + seis screenshots                  | capturas reais previamente validadas; ambiente ao vivo indisponível |
| C — conversa   | falha de projeção/arquivo               | resumo, mapa e perguntas impressos ou locais | discussão de problema, limites e decisão sem simular o produto      |

## Limites de recuperação

- Docker parado: até 5 minutos; depois, Plano B.
- Porta ou serviço indisponível: uma tentativa de `pnpm demo:start`; persistiu, Plano B.
- Dataset ou segurança em `NO-GO`: não corrigir em palco; Plano B imediato.
- Sessão expirada: uma nova autenticação; nova falha, usar capturas.
- Falha do PowerPoint: abrir PDF; se falhar, abrir a fonte Markdown e as imagens.

O Plano B foi projetado para funcionar sem API, web, banco ou internet. Nenhuma contingência permite
bypass, grant emergencial, edição de banco ou exposição de credenciais.

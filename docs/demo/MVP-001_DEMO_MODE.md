# MVP-001 — Modo de demonstração

O modo demonstrativo é exclusivamente local e identificado por `VITE_DEMO_MODE=true`. Ele adiciona
badge textual, data-base fictícia e ajuda opcional ao apresentador. A variável controla apenas
apresentação: não autentica, não concede acesso, não altera respostas HTTP e não libera endpoints.

O painel de ajuda informa usuário, empresa ativa, propósito da tela e próxima ação. Abre somente por
ação humana, fecha por botão, plano de fundo ou `Escape` e devolve o foco ao acionador. Nenhuma senha,
token, ID interno ou capability completa é exibida.

Roteiro contextual: login → Horizonte → dashboard restrito → limite das APIs legadas → Atlas →
logout → Analista RH/Horizonte. Não há tour automático, mudança automática de rota ou login
automático.

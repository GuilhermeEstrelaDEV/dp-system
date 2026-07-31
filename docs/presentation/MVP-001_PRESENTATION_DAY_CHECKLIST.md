# MVP-001 — Checklist do dia da apresentação

## Até 24 horas antes

- [ ] notebook, fonte, adaptadores e tela externa testados;
- [ ] branch/commit aprovados e pacote copiado localmente;
- [ ] `pnpm demo:setup` e `pnpm demo:ready -- --report` aprovados;
- [ ] PPTX, PDF, screenshots, resumo e evidências abrem offline;
- [ ] resolução 1366×768 ou superior, zoom 100%;
- [ ] notificações, mensageria e sincronizações suspensas;
- [ ] credenciais fictícias consultáveis sem projeção;
- [ ] apresentador e pessoa responsável pelo feedback definidos.

## Quinze minutos antes

- [ ] energia e rede local estáveis;
- [ ] Docker, banco, API e web `healthy` em `pnpm demo:status`;
- [ ] `pnpm demo:verify -- --report` retorna `DEMO STATUS: GO`;
- [ ] navegador limpo em `/login`, sem DevTools;
- [ ] PPTX aberto em modo apresentação e PDF disponível;
- [ ] formulário e registro de feedback preparados;
- [ ] relógio/timer iniciado somente ao começar.

## Durante e depois

- [ ] avisar que todos os dados são fictícios;
- [ ] evitar terminal, segredos, promessas e claims sem evidência;
- [ ] ativar contingência ao primeiro bloqueio material;
- [ ] registrar decisão, responsável e prazo de retorno, se explicitamente definidos;
- [ ] executar `pnpm demo:stop` após a sessão;
- [ ] guardar feedback sem dados pessoais reais.

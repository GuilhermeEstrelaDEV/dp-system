# MVP-001 — Critérios de aceite da demonstração

O protótipo somente poderá ser declarado demonstrável quando houver evidência para todos os itens.

- [ ] instalação e inicialização documentadas em uma máquina local suportada;
- [ ] ambiente sobe sem edição manual de código;
- [ ] migrations novas e existentes são aplicadas sem alterar migrations mescladas;
- [ ] seed/bootstrap cria apenas dados fictícios e identificados como demonstrativos;
- [ ] login demonstrativo funciona com orientação segura de credencial local;
- [ ] seleção/troca de empresa respeita vínculos e isolamento no backend;
- [ ] dashboard apresenta dados coerentes e rotulados como demonstrativos;
- [ ] fluxo estrutura → colaborador → contrato funciona do início ao fim;
- [ ] logout local e seu limite de revogação estão claros;
- [ ] nenhuma tela aparenta executar capacidade inexistente;
- [ ] nenhum erro crítico aparece no console do navegador ou da API;
- [ ] nenhuma resposta 5xx ocorre durante o roteiro aprovado;
- [ ] apresentação de 15 minutos conclui sem reinício do ambiente;
- [ ] reset demonstrativo restaura o baseline e falha de forma segura fora do local;
- [ ] lint, typecheck, testes e build estão aprovados;
- [ ] smoke tests confirmam dados, capabilities e zero vazamento entre empresas.

# MVP-001 — Critérios de aceite da demonstração

O protótipo somente poderá ser declarado demonstrável quando houver evidência para todos os itens.

A MVP-001.3 fornece autenticação e contexto empresarial demonstrativos com identidades fictícias,
hash real, sessão revogável e zero grants automáticos. Isso não conclui o protótipo completo.

- [ ] instalação e inicialização documentadas em uma máquina local suportada;
- [ ] ambiente sobe sem edição manual de código;
- [x] migrations existentes são aplicadas sem alterar migrations mescladas;
- [x] seed/bootstrap cria apenas dados fictícios e identificados como demonstrativos;
- [x] login demonstrativo funciona com orientação segura de credencial local;
- [x] seleção/troca de empresa respeita vínculos e isolamento no backend;
- [x] dashboard apresenta dados persistidos, coerentes, autorizados e rotulados como demonstrativos;
- [ ] fluxo estrutura → colaborador → contrato funciona do início ao fim;
- [x] logout local e revogação lógica da sessão estão claros;
- [x] superfícies sem grant apresentam estado restrito antes de carregar dados;
- [ ] nenhum erro crítico aparece no console do navegador ou da API;
- [ ] nenhuma resposta 5xx ocorre durante o roteiro aprovado;
- [ ] apresentação de 15 minutos conclui sem reinício do ambiente;
- [x] reset demonstrativo restaura o baseline e falha de forma segura fora do local;
- [x] lint, typecheck, testes e build da MVP-001.6 estão aprovados;
- [ ] smoke tests confirmam dados, capabilities e zero vazamento entre empresas.

A MVP-001.7 disponibiliza um gate operacional reproduzível que cobre readiness, dados, autenticação,
isolamento, dashboard, logout e ausência de grants, com relatório sanitizado. Esses controles apoiam
os itens ainda abertos, mas não substituem o ensaio humano e o aceite final da MVP-001.8.

O fluxo estrutura → colaborador → contrato permanece pendente: suas APIs legadas ainda dependem da
ETP-015.4 e não podem ser apresentadas como isoladas/autorizadas. A MVP-001.6 entrega o roteiro
seguro possível sem grants; o gate final continua aberto.

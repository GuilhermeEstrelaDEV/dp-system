# MVP-001 — Critérios de aceite da demonstração

O protótipo somente poderá ser declarado demonstrável quando houver evidência para todos os itens.

A MVP-001.3 fornece autenticação e contexto empresarial demonstrativos com identidades fictícias,
hash real, sessão revogável e zero grants automáticos. Isso não conclui o protótipo completo.

- [x] instalação e inicialização documentadas e ensaiadas em uma máquina local suportada;
- [x] ambiente sobe sem edição manual de código e aguarda readiness do host;
- [x] migrations existentes são aplicadas sem alterar migrations mescladas;
- [x] seed/bootstrap cria apenas dados fictícios e identificados como demonstrativos;
- [x] login demonstrativo funciona com orientação segura de credencial local;
- [x] seleção/troca de empresa respeita vínculos e isolamento no backend;
- [x] dashboard apresenta dados persistidos, coerentes, autorizados e rotulados como demonstrativos;
- [x] fluxo estrutura → colaborador → contrato está classificado `PASS WITH LIMITATION`: bloqueado antes do fetch até ETP-015.4, sem simulação de funcionamento;
- [x] logout local e revogação lógica da sessão estão claros;
- [x] superfícies sem grant apresentam estado restrito antes de carregar dados;
- [x] nenhum erro crítico aparece no console do navegador ou da API no roteiro aprovado;
- [x] nenhuma resposta 5xx ocorre durante o roteiro aprovado;
- [x] ensaio de 30 minutos conclui sem reinício do ambiente;
- [x] reset demonstrativo restaura o baseline e falha de forma segura fora do local;
- [x] lint, typecheck, testes e build da MVP-001.6 estão aprovados;
- [x] smoke tests confirmam dados, zero grants e zero vazamento entre empresas.

A MVP-001.7 disponibiliza um gate operacional reproduzível que cobre readiness, dados, autenticação,
isolamento, dashboard, logout e ausência de grants, com relatório sanitizado. Esses controles apoiam
os itens ainda abertos, mas não substituem o ensaio humano e o aceite final da MVP-001.8.

O fluxo estrutura → colaborador → contrato permanece uma limitação aceita: suas APIs legadas ainda
dependem da ETP-015.4 e não podem ser apresentadas como isoladas/autorizadas. O aceite da MVP-001.8
reconhece o bloqueio seguro como comportamento correto; não declara o CRUD como funcional. Evidências
estão em [MVP-001_FINAL_ACCEPTANCE_EVIDENCE](../quality/MVP-001_FINAL_ACCEPTANCE_EVIDENCE.md).

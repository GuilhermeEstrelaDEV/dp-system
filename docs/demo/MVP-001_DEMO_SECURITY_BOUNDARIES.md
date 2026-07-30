# MVP-001 — Limites de segurança do modo demo

- `VITE_DEMO_MODE` controla somente badge e ajuda visual;
- JWT, sessão lógica, empresa ativa e respostas `401`/`403` permanecem reais;
- não existe login automático, senha universal, endpoint demo ou sessão criada no frontend;
- o seed continua com zero grants e zero capabilities automáticas;
- o verificador não altera dados, migrations, grants, capabilities, volumes ou arquivos de ambiente;
- sessões técnicas são criadas por login real e revogadas individualmente;
- relatórios omitem credenciais, tokens, cookies, hashes e connection strings;
- superfícies legadas continuam bloqueadas antes de fetch no frontend e não são descritas como
  canonicamente protegidas no backend;
- a migração das APIs legadas e a ETP-015.4 permanecem não iniciadas.

Sanitização reduz exposição acidental, mas não substitui revisão humana dos logs. Para diagnóstico,
prefira `docker logs --tail 100 dp-system-demo-api` sem compartilhar a saída integral.

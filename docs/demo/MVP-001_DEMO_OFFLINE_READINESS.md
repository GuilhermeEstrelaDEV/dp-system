# MVP-001 — Prontidão offline

Após dependências instaladas e imagens Docker construídas, o runtime usa somente API, web,
PostgreSQL e Redis locais. Não foram identificadas fontes remotas, CDN, analytics, imagens externas
ou integrações de runtime. Favicon, estilos e bibliotecas são locais.

Internet pode ser necessária na preparação para instalar pacotes ou baixar/construir imagens pela
primeira vez. O projeto não implementa service worker/PWA e não promete instalação offline em uma
máquina sem cache. Antes de desconectar, execute `pnpm demo:ready` e confirme `GO`.

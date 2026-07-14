# ADR-002 — Fundação técnica da ETP-002

**Status:** Aceita

## Contexto

A ETP-002 prepara uma base de desenvolvimento sem funcionalidades de Departamento Pessoal. A solução deve suportar arquitetura modular, Docker, validação automatizada, PostgreSQL, documentação de API e evolução incremental.

## Decisão

- Usar monorepo com workspaces pnpm e Turborepo, conforme ADR-003.
- Usar React, Vite e TypeScript no frontend.
- Usar NestJS e TypeScript no backend.
- Usar Prisma com PostgreSQL para persistência.
- Usar JWT como mecanismo de autenticação da plataforma, sem implementar fluxo de negócio nesta etapa.
- Usar Swagger/OpenAPI para documentação técnica da API.
- Usar Docker e Docker Compose para desenvolvimento reproduzível.
- Usar ESLint, Prettier, Husky, lint-staged, EditorConfig, GitHub Actions e configurações VSCode para qualidade contínua.

## Consequências

- A arquitetura documentada passa a adotar Vite no lugar da proposta inicial de Next.js.
- A ETP-002 pode criar identidade e saúde técnica de plataforma, mas não cadastros nem regras de DP.
- Módulos de domínio serão adicionados somente em entregas futuras, após documentação e critérios de aceite próprios.
- O conjunto inicial de dependências será instalado apenas após aprovação explícita do plano da ETP-002.
- As fronteiras de pacotes, tipos compartilhados e preparação para mobile/integrações seguem a ADR-003.

## Alternativas rejeitadas

- Next.js: substituído por Vite para atender ao escopo aprovado.
- Microserviços: adiados; o monólito modular continua adequado ao estágio inicial.
- Banco em contêiner sem migrations/seeds: rejeitado por não oferecer ambiente reproduzível.

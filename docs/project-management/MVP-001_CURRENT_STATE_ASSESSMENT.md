# MVP-001 — Diagnóstico do estado atual

## Método e limite

Diagnóstico realizado em `origin/develop@9420edc` por inspeção de implementação, wiring, seed,
testes e documentação. A existência de arquivo, rota ou modelo isolado não foi tratada como prova de
fluxo utilizável. Esta etapa não executa implementação funcional.

## Base técnica reutilizável

- monorepo pnpm/Turborepo, React/Vite, NestJS, Prisma e PostgreSQL 16;
- Docker Compose para PostgreSQL, Redis, API e web;
- 16 migrations, schema amplo e seed idempotente do catálogo;
- application shell responsivo, cliente HTTP tipado, React Query e tratamento comum de erros;
- JWT, sessão lógica, empresa ativa, capabilities, isolamento nas rotas canônicas e AuditLog;
- módulos de estrutura, colaboradores, contratos, admissão, jornada, benefícios, férias e folha;
- 52 arquivos de teste da API e 20 do frontend.

## Matriz funcional

| Capacidade                | Estado                       | Evidência e limite atual                                                                |
| ------------------------- | ---------------------------- | --------------------------------------------------------------------------------------- |
| Login                     | `IMPLEMENTED BUT INCOMPLETE` | API e tela reais; seed não cria usuário, senha ou vínculo demonstrativo                 |
| Logout                    | `FRONTEND ONLY`              | limpa `sessionStorage`; não existe endpoint de logout/revogação da sessão atual         |
| Recuperação de sessão     | `IMPLEMENTED BUT INCOMPLETE` | restaura estado local e encerra em 401; não revalida proativamente ao recarregar        |
| Seleção de empresa        | `IMPLEMENTED BUT INCOMPLETE` | API e tela validam vínculo; seed não cria vínculos                                      |
| Dashboard                 | `FRONTEND ONLY`              | layout utilizável com números estáticos explicitamente demonstrativos                   |
| Empresas                  | `IMPLEMENTED BUT INCOMPLETE` | CRUD API/frontend; proteção das APIs legadas ainda não está concluída                   |
| Usuários                  | `BACKEND ONLY`               | persistência e autenticação existem; sem gestão HTTP/UI e sem usuário de demo           |
| Colaboradores             | `IMPLEMENTED BUT INCOMPLETE` | CRUD API/frontend e contratos; sem massa demonstrativa integrada                        |
| Departamentos             | `IMPLEMENTED BUT INCOMPLETE` | CRUD API/frontend; depende de contexto/dados preparados                                 |
| Cargos                    | `IMPLEMENTED BUT INCOMPLETE` | CRUD API/frontend; depende de contexto/dados preparados                                 |
| Férias e afastamentos     | `IMPLEMENTED BUT INCOMPLETE` | API e página agregada; sem roteiro/massa validada de demo                               |
| Admissões                 | `IMPLEMENTED BUT INCOMPLETE` | fluxo, checklist e documentos em API/frontend; sem fixture ponta a ponta                |
| Desligamentos             | `NOT IMPLEMENTED`            | rota do frontend é placeholder; nenhum módulo dedicado na API                           |
| Permissões                | `BACKEND ONLY`               | catálogo e assignments internos; zero grants automáticos e sem gestão UI                |
| Auditoria                 | `BACKEND ONLY`               | AuditLog e writers transacionais; sem consulta administrativa no frontend               |
| Navegação                 | `IMPLEMENTED AND USABLE`     | shell desktop/mobile e rotas protegidas por sessão                                      |
| Mensagens de sucesso/erro | `IMPLEMENTED BUT INCOMPLETE` | cliente e páginas tratam erros; padrão de feedback não é uniforme em todo módulo        |
| Dados demonstrativos      | `IMPLEMENTED BUT INCOMPLETE` | seed cria empresa e filial fictícias e catálogo; não cria identidade nem fluxo completo |
| Reset do ambiente         | `NOT IMPLEMENTED`            | não há comando seguro e documentado de restauração da massa demo                        |
| Inicialização local       | `IMPLEMENTED BUT INCOMPLETE` | Compose, migrations e seed existem; não há comando único nem smoke test do roteiro      |

## Fluxos atuais

| Fluxo                   | Resultado observado                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------- |
| 1. Inicializar ambiente | `docker compose up` possui topologia completa; exige `.env` e ferramentas locais      |
| 2. Aplicar migrations   | `pnpm prisma:migrate:deploy` aplica as 16 migrations                                  |
| 3. Executar seed        | cria 7 papéis, 19 capabilities, empresa e filial fictícias; cria zero assignments     |
| 4. Acessar frontend     | web disponível em `http://localhost:5173` após inicialização                          |
| 5. Realizar login       | código funciona, mas falha após seed padrão por inexistência de usuário demonstrativo |
| 6. Selecionar empresa   | funciona apenas para usuário com UserCompanyRole ativo, ausente no seed               |
| 7. Navegar              | funciona após autenticação/contexto; algumas rotas são placeholders                   |
| 8. Consultar dados      | APIs e páginas existem, mas a massa padrão é insuficiente para a maioria dos módulos  |
| 9. Criar/editar         | vários CRUDs existem; não há roteiro end-to-end reproduzível após seed padrão         |
| 10. Encerrar sessão     | logout local funciona; sessão do backend permanece válida até expirar/revogar         |

## Conclusão

A arquitetura é suficiente para um protótipo local, mas o repositório ainda não oferece uma
demonstração reproduzível após `seed`. O bloqueio principal não é criar novo domínio: é preparar
identidade e massa fictícias, escolher e validar um fluxo existente, simplificar start/reset e criar
um roteiro honesto. O gate operacional de ambiente de destino da ETP-015.3 não bloqueia esse uso
exclusivamente local.

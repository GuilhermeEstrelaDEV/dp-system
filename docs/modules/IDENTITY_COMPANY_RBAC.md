# Identidade autenticada e RBAC empresarial

## Estado

Fundação funcional da ETP-013 implementada de forma incremental. Esta entrega autentica usuários, valida a empresa ativa e resolve capabilities; não implementa o workflow de conferência de folha nem migra as APIs legadas para proteção obrigatória.

## Persistência

`UserCompanyRole` registra assignments históricos entre usuário, empresa e papel, com status, início e fim de vigência. As FKs usam `RESTRICT`, e um índice parcial impede dois assignments ativos idênticos sem impedir uma atribuição futura após a inativação.

`UserRole` continua reservado às funções globais da plataforma. Somente capabilities com prefixo `platform.` são aproveitadas globalmente. Capabilities operacionais são derivadas dos papéis vigentes na empresa ativa.

`AuditLog.companyId` permite registrar o contexto empresarial. A seleção válida de empresa gera `AUTH_COMPANY_SELECTED` com ator, empresa e trace.

## Autenticação e contexto

- senhas usam `scrypt`, salt aleatório e comparação em tempo constante;
- JWT de acesso usa `JWT_SECRET` e `JWT_EXPIRES_IN`, com `sub`, `sid` e empresa ativa opcional;
- o token inicial permite apenas o bootstrap de identidade e seleção de empresa;
- `POST /auth/context` valida o assignment no banco e emite novo token para a empresa selecionada;
- cada requisição protegida revalida usuário, empresa, vigência e capabilities, permitindo revogação sem confiar em claims de permissão;
- o principal tipado contém `actorId`, `activeCompanyId`, `permissions`, `traceId` e `sessionId`.

Não há refresh token nesta fase. O schema legado de refresh foi preservado, mas nenhum contrato incompleto foi exposto.

## APIs

- `POST /api/v1/auth/login` — autentica e emite o token de bootstrap;
- `GET /api/v1/auth/me` — retorna o principal resolvido;
- `GET /api/v1/auth/companies` — lista empresas com assignment ativo e vigente;
- `POST /api/v1/auth/context` — valida a empresa e reemite o token no mesmo `sessionId`.

## Autorização e isolamento

`JwtAuthGuard`, `RequireCapabilities`, `CapabilitiesGuard` e `AuthorizationService` são componentes opt-in. Novas rotas empresariais devem aplicar autenticação e capability na borda e repetir a decisão no caso de uso. A ausência de empresa ou capability falha fechada.

Serviços devem filtrar consultas por `activeCompanyId`. `companyId` de rota, query ou DTO nunca é autoridade. `assertCompanyScope` devolve `404` quando o recurso pertence a outra empresa, sem revelar sua existência.

As APIs existentes permanecem inalteradas até inventário e migração coberta por testes. Não existe guard global nesta entrega.

## Limites e próxima etapa

- nenhum papel é codificado em regras;
- nenhum seed de atribuição ou credencial foi criado;
- não há refresh/logout, delegação, substituição ou acesso emergencial;
- a auditoria transversal ainda precisa incluir IP, user-agent, metadata allowlisted e atomicidade com cada caso de uso;
- a próxima etapa é endurecer autorização/auditoria transversal antes de persistir o workflow da ETP-013.

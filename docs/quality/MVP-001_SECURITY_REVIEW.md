# MVP-001 — Revisão de segurança

## Resultado

`PASS` para as fronteiras do protótipo local.

- autenticação JWT e sessão lógica permanecem reais; não há login automático;
- empresa ativa é emitida pelo backend após vínculo válido;
- dashboard usa empresa do principal, nunca `companyId` fornecido pelo cliente;
- duas empresas e usuário restrito foram verificados; empresa externa retorna 403;
- logout revoga a sessão e o token revogado retorna 401;
- `RolePermission = 0`; nenhum seed concede capability ou papel privilegiado;
- superfícies legadas permanecem bloqueadas antes do fetch e não são declaradas seguras no backend;
- relatórios sanitizam Bearer, senha, token, segredo, cookie, authorization e URL PostgreSQL;
- `401/403/404` controlados são logs `warn`; falha inesperada `5xx` continua `error` com correlação;
- dados e credenciais são fictícios e restritos ao Compose local.
- Vitest foi atualizado de 3.2.4 para 3.2.6; `pnpm audit --audit-level critical` aprovou;
- oito advisories moderados/altos permanecem em cadeias transitivas de ferramentas de desenvolvimento
  e Prisma; não há evidência de exposição no runtime demo e upgrades amplos exigem iniciativa própria.

ETP-015.4, MFA, refresh, revogação global, produção, cloud e consulta administrativa de auditoria são
limitações explícitas, não controles simulados.

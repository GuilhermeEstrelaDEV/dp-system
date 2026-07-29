# MVP-001 — Fluxo de autenticação demonstrativa

1. O frontend envia e-mail normalizado e senha para `POST /auth/login`.
2. A API valida o hash real, cria sessão lógica e emite JWT HS256 de curta duração.
3. A sessão é revalidada em `/auth/me`; expiração, revogação e usuário inativo falham fechados.
4. O token permanece em `sessionStorage` e a senha é limpa após cada tentativa.
5. `POST /auth/logout` revoga a sessão, audita a ação e limpa o estado local.

Login e logout bem-sucedidos e seleção de empresa usam o `AuditLog` existente. Refresh, MFA,
recuperação de senha e logout global continuam fora desta etapa.

# MVP-001 — Registro de defeitos da estabilização

**Baseline:** `origin/develop@ac225cf8ffd6946f3518f9eaea8e8cc6cf258c1a`

**Data:** 31/07/2026
**Escopo:** somente o protótipo local aprovado; ETP-015.4 permanece não iniciada.

| ID          | Severidade | Evidência                                                                                     | Decisão  | Resultado                                                                      |
| ----------- | ---------- | --------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------ |
| MVP-DEF-001 | P1         | `demo:reset` iniciou o verificador enquanto a porta PostgreSQL do host ainda recusava conexão | corrigir | `demo:start` aguarda porta do banco e HTTP 200 de API/web antes de concluir    |
| MVP-DEF-002 | P1         | `401`, `403` e `404` esperados eram emitidos como `Unhandled request error` com stack         | corrigir | rejeições controladas são `warn`; somente `5xx` preserva nível `error` e stack |
| MVP-DEF-003 | P2         | gate HTTP/processo podia aguardar indefinidamente em dependência congelada                    | corrigir | timeout de 10 s por request e 120 s por processo externo                       |
| MVP-DEF-004 | P2         | badge e título da conta demo encostavam em 1024 px                                            | corrigir | cabeçalho flexível, com quebra e espaçamento explícitos                        |
| MVP-DEF-005 | P2         | bundle web minificado possui 529,69 kB e gera aviso Vite                                      | aceitar  | code splitting pertence ao hardening futuro; runtime e tempo local aprovados   |
| MVP-DEF-006 | P2         | CRUDs legados não compõem fluxo funcional autorizado                                          | aceitar  | limitação de governança; bloqueio pré-fetch permanece até ETP-015.4            |
| MVP-DEF-007 | P3         | warnings futuros do React Router aparecem em testes históricos                                | aceitar  | não afetam runtime; atualização ampla de roteamento ficou fora do recorte      |
| MVP-DEF-008 | P1         | Vitest 3.2.4 possui advisory crítico no servidor UI opcional                                  | corrigir | Vitest e coverage atualizados para 3.2.6; zero advisory crítico restante       |

Não foram identificados defeitos P0. Todos os P1 foram corrigidos. Nenhuma correção criou endpoint,
capability, grant, migration, bypass ou regra de negócio.

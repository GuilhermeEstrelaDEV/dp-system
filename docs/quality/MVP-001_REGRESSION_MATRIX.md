# MVP-001 — Matriz de regressão

| Área           | Cenário                                        | Resultado            | Evidência/limite                                                           |
| -------------- | ---------------------------------------------- | -------------------- | -------------------------------------------------------------------------- |
| Bootstrap      | setup limpo, 16 migrations e seeds             | PASS                 | reset limpo em PostgreSQL 16; 2 empresas, 26 colaboradores, zero grants    |
| Bootstrap      | segunda execução/start                         | PASS                 | Compose reutiliza recursos nomeados e aguarda readiness do host            |
| Operação       | status, stop e novo start                      | PASS                 | quatro containers previsíveis; volume preservado                           |
| Reset          | ausência de confirmação                        | PASS                 | falha antes de remover dados                                               |
| Reset          | confirmação explícita                          | PASS                 | somente volume/rede/containers `dp-system-demo`                            |
| Autenticação   | login válido dos dois perfis                   | PASS                 | sessão real, senha com hash e token não impresso                           |
| Autenticação   | credencial inválida, logout e token revogado   | PASS                 | rejeições controladas; sessão revogada retorna 401                         |
| Empresa        | Admin em Horizonte/Atlas; RH somente Horizonte | PASS                 | vínculos explícitos e novo token por contexto                              |
| Empresa        | empresa não vinculada                          | PASS                 | 403 esperado, sem troca de contexto                                        |
| Dashboard      | empresa ativa e zero grants                    | PASS                 | `RESTRICTED`, sem métrica residual ou agregação cruzada                    |
| Legado         | estrutura, pessoas e contratos                 | PASS WITH LIMITATION | bloqueio pré-fetch; backend canônico depende da ETP-015.4                  |
| Navegação      | rotas conhecidas, futuras e inexistentes       | PASS                 | restrição segura, `Em breve` não acionável e 404                           |
| Visual         | 1024, 1280, 1366, 1440 e 1920 px               | PASS                 | Edge headless; login sem corte após correção responsiva                    |
| Zoom           | 100%, 125% e 150%                              | PASS                 | conteúdo legível e controles preservados                                   |
| Acessibilidade | teclado, foco, labels e mensagens              | PASS WITH LIMITATION | fundamentos cobertos; sem auditoria WCAG formal                            |
| Erros          | 400/401/403/404/409/5xx                        | PASS                 | contratos e testes existentes; 4xx separado de falha inesperada            |
| Segurança      | deny-by-default e isolamento                   | PASS                 | 0 `RolePermission`; nenhuma atribuição automática                          |
| Segurança      | relatórios e logs                              | PASS                 | sanitização testada; tokens/senhas/connection strings omitidos             |
| Offline        | runtime local aquecido                         | PASS WITH LIMITATION | sem CDN/runtime externo; instalação e primeiro build podem exigir internet |
| Performance    | health/login/contexto/dashboard                | PASS                 | baseline em `MVP-001_PERFORMANCE_BASELINE.md`                              |
| Continuidade   | ensaio prolongado                              | PASS                 | 30 minutos, sete checkpoints, sem 5xx ou reinício                          |

As limitações não são falhas ocultas: são fronteiras aprovadas e têm owner futuro explícito.

# MVP-001 — Roteiro preliminar da demonstração

**Duração estimada:** 10 a 12 minutos. Este roteiro é técnico e será refinado em etapa futura.

Pré-condição obrigatória: executar `pnpm demo:verify -- --report` e prosseguir somente com
`DEMO STATUS: GO`. Consultar também o
[relatório de estabilização](../quality/MVP-001_STABILIZATION_REPORT.md) antes do ensaio executivo.

| Tempo | Ator/usuário       | Empresa/rota                     | Ação e dado                            | Resultado esperado                   | Capability/alternativa                                            |
| ----- | ------------------ | -------------------------------- | -------------------------------------- | ------------------------------------ | ----------------------------------------------------------------- |
| 1 min | apresentador       | terminal                         | confirmar `pnpm demo:verify`           | `DEMO STATUS: GO`                    | se falhar, aplicar contingência e não iniciar                     |
| 2 min | Administrador Demo | `/login`                         | autenticar com conta local documentada | sessão real, duas empresas           | pública mínima; se falhar, reset demo                             |
| 1 min | Administrador Demo | Horizonte, `/selecionar-empresa` | selecionar Horizonte                   | shell identifica Horizonte           | vínculo real                                                      |
| 2 min | Administrador Demo | `/`                              | abrir dashboard                        | contexto Horizonte e estado restrito | zero grants; usar `demo:data:verify` como evidência dos agregados |
| 1 min | Administrador Demo | `/colaboradores`                 | demonstrar limite seguro               | nenhum dado/fetch; `Acesso restrito` | `platform.manage` ausente                                         |
| 2 min | Administrador Demo | Atlas, `/selecionar-empresa`     | trocar empresa e voltar ao dashboard   | cache limpo e contexto Atlas         | vínculo real; repetir seleção se rede falhar                      |
| 1 min | Administrador Demo | menu                             | logout                                 | sessão revogada e retorno ao login   | identidade autenticada                                            |
| 2 min | Analista RH Demo   | login/Horizonte                  | autenticar e selecionar empresa        | somente Horizonte; estado restrito   | zero grants                                                       |

Não editar banco, atribuir capabilities ou abrir ferramentas administrativas durante a
demonstração. Criação, edição, status, auditoria administrativa e consulta dos CRUDs legados são
explicitamente adiados até proteção de backend e grants homologados.

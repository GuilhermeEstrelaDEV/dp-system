# MVP-001 — Inventário de componentes visuais

| Componente                            | Origem                   | Uso nesta etapa                                                |
| ------------------------------------- | ------------------------ | -------------------------------------------------------------- |
| `Brand`                               | novo                     | marca completa e compacta, login, sidebar e seleção de empresa |
| `AppShell`                            | consolidado              | sidebar, topbar, breadcrumb, conteúdo e loading global         |
| `Sidebar` / `MobileNavigation`        | reaproveitado e refinado | navegação agrupada e recolhível                                |
| `Header`                              | reaproveitado e refinado | empresa ativa, ambiente, usuário e logout existente            |
| `PageHeader` / `StatCard`             | reaproveitado            | títulos e dashboard demonstrativo existente                    |
| `Button` / `IconButton` / `Input`     | novo                     | base visual acessível para login e shell                       |
| `Card` / `Badge` / `Alert`            | novo                     | empresa, ambiente e feedback seguro                            |
| `Spinner` / `Skeleton` / `EmptyState` | novo                     | base dos estados carregando e vazio                            |
| `ErrorFallback` / `NotFoundPage`      | reaproveitado            | erro seguro e página 404                                       |

Não foi adicionada uma segunda biblioteca de UI. Select, textarea, checkbox, modal, diálogo de
confirmação, toast e tabela permanecem nas implementações de domínio existentes ou serão
padronizados apenas quando houver uso real, evitando abstrações sem consumidor.

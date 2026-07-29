# MVP-001 — Mapa de navegação

## Superfícies exibidas

| Grupo         | Item          | Rota             | Estado                                     |
| ------------- | ------------- | ---------------- | ------------------------------------------ |
| Visão geral   | Visão geral   | `/`              | funcional e explicitamente demonstrativa   |
| Cadastros     | Estrutura     | `/estrutura`     | funcional                                  |
| Pessoas       | Colaboradores | `/colaboradores` | funcional                                  |
| Pessoas       | Contratos     | `/contratos`     | funcional                                  |
| Pessoas       | Admissões     | `/admissoes`     | funcional                                  |
| Pessoas       | Movimentações | `/movimentacoes` | funcional conforme limites atuais          |
| Pessoas       | Jornada       | `/jornada`       | funcional conforme limites atuais          |
| Pessoas       | Benefícios    | `/beneficios`    | funcional conforme limites atuais          |
| Administração | Folha         | `/folha`         | funcional conforme capabilities existentes |

## Itens não acionáveis

`Desligamentos`, `Documentos` e `Relatórios` aparecem como `Em breve`, sem link, botão ativo ou rota
cenográfica. Rotas desconhecidas usam a página 404. Login e seleção de empresa permanecem fora do
AppShell e conservam exatamente os fluxos funcionais existentes.

As rotas protegidas de conferência e histórico continuam condicionadas às capabilities existentes;
a navegação visual não concede acesso nem altera autorização.

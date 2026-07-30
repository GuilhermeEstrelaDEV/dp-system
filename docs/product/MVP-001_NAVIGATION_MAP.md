# MVP-001 — Mapa de navegação

## Superfícies exibidas

| Grupo         | Item          | Rota             | Estado                                   |
| ------------- | ------------- | ---------------- | ---------------------------------------- |
| Visão geral   | Visão geral   | `/`              | funcional e explicitamente demonstrativa |
| Cadastros     | Estrutura     | `/estrutura`     | restrito sem `platform.manage`           |
| Pessoas       | Colaboradores | `/colaboradores` | restrito sem `platform.manage`           |
| Pessoas       | Contratos     | `/contratos`     | restrito sem `platform.manage`           |
| Pessoas       | Admissões     | `/admissoes`     | restrito sem `platform.manage`           |
| Pessoas       | Movimentações | `/movimentacoes` | restrito sem `platform.manage`           |
| Pessoas       | Jornada       | `/jornada`       | restrito sem `platform.manage`           |
| Pessoas       | Benefícios    | `/beneficios`    | restrito sem `platform.manage`           |
| Administração | Folha         | `/folha`         | restrito ou funcional por capability     |

## Itens não acionáveis

`Desligamentos`, `Documentos` e `Relatórios` aparecem como `Em breve`, sem link, botão ativo ou rota
cenográfica. Rotas desconhecidas usam a página 404. Login e seleção de empresa permanecem fora do
AppShell e conservam exatamente os fluxos funcionais existentes.

As superfícies administrativas legadas são bloqueadas antes de qualquer fetch quando
`platform.manage` está ausente. Isso evita exposição pelo roteiro, mas não substitui a migração de
backend prevista na ETP-015.4. Conferência e histórico continuam condicionados às capabilities
canônicas existentes; a navegação visual não concede acesso nem altera autorização.

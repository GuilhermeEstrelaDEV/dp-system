# Application Shell do Frontend

## Objetivo

A ETP-003 estabelece a estrutura visual inicial do `apps/web`. Ela oferece navegação, rotas demonstrativas e tratamento de páginas inexistentes ou com erro, sem autenticação, API, dados reais, CRUD ou regras de Departamento Pessoal.

## Estrutura

```text
AppShell
├── Sidebar (desktop, recolhível)
├── Header
│   └── MobileNavigation (painel modal)
└── main
    ├── Breadcrumbs
    └── rota atual
        ├── Dashboard demonstrativo
        ├── Placeholder de módulo
        ├── 404
        └── Fallback de erro
```

`components/layout/navigation.ts` é a fonte única para caminhos, rótulos, ícones e descrições dos módulos. Sidebar, menu mobile e breadcrumbs consomem essa configuração; novos módulos devem ser incluídos nela antes de receberem uma rota.

## Rotas

`/` apresenta o dashboard. Os placeholders são: `/administracao`, `/estrutura`, `/colaboradores`, `/admissoes`, `/movimentacoes`, `/jornada`, `/beneficios`, `/folha`, `/desligamentos`, `/documentos` e `/relatorios`. Caminhos desconhecidos exibem a página 404.

## Responsividade e acessibilidade

- A interface suporta telas a partir de 320px sem rolagem horizontal.
- Em desktop, a sidebar pode ser recolhida; os links mantêm rótulo acessível e `title`.
- Em mobile, a mesma navegação abre em painel modal e fecha por botão, backdrop, Escape ou navegação. O foco retorna ao gatilho após o fechamento.
- Links ativos usam `aria-current`; controles usam rótulos acessíveis, `aria-expanded` e `aria-controls`.
- A marcação utiliza `header`, `aside`, `nav`, `main`, títulos e foco visível.

## Dados demonstrativos

O dashboard é somente uma composição visual. Todo indicador, atividade e texto de acompanhamento é identificado como fictício/demonstrativo. A etapa não usa pessoas, empresas, documentos, identificadores, salários ou dados operacionais reais.

## Testes

Os testes Vitest + Testing Library cobrem shell, dashboard, rotas de placeholder, rota ativa, breadcrumbs, sidebar recolhível, menu mobile, 404 e fallback de erro. Eles usam apenas roteamento em memória e não fazem chamadas de API.

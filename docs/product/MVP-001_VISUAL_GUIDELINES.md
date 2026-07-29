# MVP-001 — Diretrizes visuais

## Identidade temporária

A marca temporária é **DP-System**, acompanhada por **Gestão integrada de Departamento Pessoal**.
O símbolo SVG próprio combina uma forma canônica de aplicação com a inicial `D` e um marcador azul.
Não deriva de concorrentes, não usa fonte proprietária e funciona na sidebar, login e favicon.

## Tokens

Os tokens vivem em `apps/web/src/styles/index.css` como CSS variables. Eles cobrem marca, canvas,
superfície, borda, texto secundário, sucesso, alerta, erro, informação, foco, raios, sombras e
camadas. Componentes novos devem consumir esses tokens e evitar novas cores arbitrárias.

## Princípios

- densidade adequada a notebooks e telas administrativas;
- foco visível, contraste legível, landmarks e labels associados;
- mensagens em português do Brasil, sem detalhes técnicos sensíveis;
- estados futuros sempre desabilitados e rotulados como `Em breve`;
- dados demonstrativos sempre identificados como fictícios;
- comportamento mobile completo não integra esta etapa, embora o menu continue adaptativo.

## Substituição futura

Para substituir a marca, alterar `Brand.tsx`, `favicon.svg`, os metadados de `index.html` e os tokens
`--color-brand-*`. A estrutura do AppShell e os contratos funcionais não dependem do desenho atual.

Esta entrega não declara conformidade WCAG formal; apenas aplica fundamentos verificáveis de
acessibilidade.

# MVP-001 — Guia do apresentador

## Antes

1. Conecte o notebook à energia e feche notificações.
2. Use Chrome ou Edge atual, janela maximizada, zoom 100% e 1366×768 ou superior.
3. Execute `pnpm demo:ready -- --report`.
4. Prossiga somente com `DEMO STATUS: GO`.
5. Abra `http://localhost:55173`; não mantenha console ou ferramentas técnicas visíveis.

## Durante (aproximadamente 13 minutos)

1. Entre manualmente como Administrador Demo.
2. Selecione Horizonte e apresente o contexto e o dashboard restrito.
3. Abra a ajuda da demonstração e explique dados fictícios/data-base.
4. Acesse Colaboradores e mostre o bloqueio seguro, sem chamada legada.
5. Troque para Atlas e confirme a atualização integral do contexto.
6. Faça logout; entre como Analista RH e confirme somente Horizonte.
7. Encerre a sessão.

O painel não exibe senhas. Consulte as credenciais localmente antes da reunião, sem projetar o
arquivo. Use o [roteiro executivo final](../presentation/MVP-001_FINAL_DEMO_SCRIPT.md). Se um passo
falhar, use a [contingência da apresentação](../presentation/MVP-001_PRESENTATION_CONTINGENCY.md).

## Depois

Execute `pnpm demo:stop`. Preserve o volume se quiser manter o baseline; para restaurá-lo, execute
posteriormente `pnpm demo:reset -- --confirm-reset` e valide novamente. Registre feedback sem dados
pessoais.

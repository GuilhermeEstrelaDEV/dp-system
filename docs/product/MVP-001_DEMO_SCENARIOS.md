# MVP-001 — Cenários demonstrativos

Estes cenários descrevem o uso do dataset; não criam fluxos ou permissões novas.

## Administrador Demo

1. Entrar com a conta local documentada.
2. Selecionar Horizonte e confirmar nome e contexto no shell.
3. Abrir o dashboard e observar o estado restrito esperado por zero grants.
4. Trocar para Atlas e confirmar que o contexto muda sem resíduos da Horizonte.
5. Abrir uma rota administrativa e confirmar o estado restrito sem carregamento de dados.
6. Encerrar a sessão local.

## Analista RH Demo

1. Entrar com a conta local de RH.
2. Confirmar que somente Horizonte aparece para seleção.
3. Abrir o dashboard e confirmar `RESTRICTED`.
4. Recarregar a página e verificar a restauração local de sessão e empresa.

## Evidência de dashboard

`pnpm demo:data:verify` demonstra, por consultas reais e sem bypass, que Horizonte possui 5 ciclos,
4 achados abertos e 6 competências; Atlas possui 3, 1 e 4. A futura concessão explícita das
capabilities é responsabilidade da governança de autorização, não deste protótipo.

A execução completa de apresentação e o gate GO/NO-GO pertencem à MVP-001.7. Nenhuma ação de
cadastro, edição ou desligamento foi adicionada nesta etapa.

O [roteiro preliminar](../presentation/MVP-001_PRELIMINARY_DEMO_SCRIPT.md) e a
[matriz de capabilities](MVP-001_FLOW_CAPABILITY_MATRIX.md) registram o recorte executável e os
bloqueios. As APIs legadas não são usadas como atalho para contornar a ETP-015.4.

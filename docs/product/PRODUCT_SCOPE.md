# Visão e Escopo do Produto

## Objetivo

Substituir a planilha atual por um ERP de Departamento Pessoal confiável, auditável e multiempresa. O sistema deve reduzir operação manual, preservar memória operacional e permitir fechamento de folha com conferência e rastreabilidade.

## Usuários iniciais

| Perfil         | Responsabilidade                                       |
| -------------- | ------------------------------------------------------ |
| Administrador  | Empresas, acessos, parâmetros e integrações            |
| Analista de DP | Cadastros, rotinas, lançamentos e documentos           |
| Gestor         | Aprovações, consultas e indicadores                    |
| Contabilidade  | Conferência e arquivos de apoio                        |
| Colaborador    | Consulta de documentos e solicitações (fase posterior) |

## Módulos do núcleo

1. Administração, empresas, perfis e auditoria.
2. Estrutura organizacional, cargos, jornadas e centros de custo.
3. Colaboradores, contratos, dependentes, documentos e histórico.
4. Admissão, alterações contratuais e checklists.
5. Férias, afastamentos, experiências e vencimentos.
6. Jornada, ocorrências, banco de horas e importações de ponto.
7. Benefícios, adiantamentos, pensão e descontos.
8. Folha, rubricas, comissões, encargos, conferência e fechamento.
9. Desligamento, rescisão e checklist demissional.
10. Documentos, modelos, geração, assinatura e armazenamento.
11. Relatórios, alertas e integrações, incluindo eSocial.

## Regras de produto transversais

- Todo registro operacional pertence a uma empresa e tem autor, data e histórico.
- Eventos contratuais e financeiros são versionados por vigência; o passado não é sobrescrito.
- Folha fechada só pode ser corrigida por fluxo de reabertura e ajuste auditado.
- Documentos e checklists são instâncias vinculadas ao colaborador, nunca abas isoladas.
- Parâmetros legais e rubricas possuem vigência e fonte de atualização.
- A transmissão de integrações deve ser idempotente, rastreável e reprocessável.

## Fora do primeiro ciclo

- Aplicativo móvel nativo.
- Substituição direta do fornecedor de ponto sem análise de integração.
- Módulos de recrutamento, contabilidade geral e financeiro completo.

Esses itens poderão ser planejados após estabilização do núcleo de DP.

# Fluxos de Usuário

Os fluxos representam comportamento esperado; telas e APIs serão especificadas somente na etapa de implementação correspondente.

## Login

1. Usuário informa credencial e, quando habilitado, segundo fator.
2. Sistema valida sessão, status do usuário e organizações permitidas.
3. Usuário escolhe empresa quando possuir mais de uma; o contexto fica visível em toda operação.
4. Falhas são registradas sem revelar se o usuário existe. Sessões expiram e podem ser revogadas.

## Empresas

1. Administrador cria empresa e seus dados fiscais/operacionais.
2. Cadastra estabelecimentos, departamentos, centros de custo, cargos e jornadas.
3. Nesta etapa, filiais, departamentos, cargos e centros de custo são administrados por empresa e podem ser ativados ou inativados sem exclusão física.
4. O sistema impede inativação de estrutura em uso sem data de fim e substituição definida.
5. Alterações com impacto em contrato ou folha são vigentes e auditadas.

## Funcionários

1. RH/DP pesquisa por identificador externo, matrícula ou nome.
2. Para novo registro, informa dados obrigatórios e documentos disponíveis.
3. Sistema valida duplicidade, permissão e qualidade de dados.
4. Dados sensíveis são exibidos apenas a perfis habilitados; atualização gera auditoria.

### Recorte demonstrativo da ETP-005

1. RH/DP cadastra nome legal e, opcionalmente, nome preferencial do colaborador.
2. Pode adicionar e-mail ou telefone manualmente, apenas com informação fictícia no ambiente demonstrativo.
3. O colaborador é ativado ou inativado sem exclusão física; inativação é bloqueada enquanto houver contrato ativo.
4. CPF, endereço, documentos, banco e outros dados sensíveis não são coletados nesta etapa.

## Contratos

1. DP seleciona colaborador e empresa.
2. Informa admissão, tipo de vínculo, cargo, setor, jornada, remuneração e identificadores.
3. Sistema valida vigência, unicidade de matrícula e conflitos com contrato ativo.
4. Alterações futuras ou retroativas criam histórico; encerramento exige motivo e data.

### Recorte demonstrativo da ETP-005

1. DP seleciona colaborador, empresa, cargo e referências organizacionais permitidas.
2. Informa matrícula manual, admissão, tipo, regime e carga horária, sem salário.
3. O sistema verifica empresa ativa e compatibilidade de filial, departamento, cargo e centro de custo.
4. Apenas um contrato ativo por colaborador e empresa é permitido pela camada de serviço; toda alteração ou inativação adiciona histórico com motivo opcional.

## Admissão

1. RH abre processo admissional a partir de colaborador e contrato proposto.
2. Sistema instancia checklist pela empresa/cargo e calcula prazos de experiência.
3. Responsáveis concluem tarefas, anexam evidências e geram documentos.
4. DP revisa e aprova; pendência crítica bloqueia conclusão e integração.

## Benefícios

1. RH/DP configura catálogo e planos por empresa.
2. Para cada vínculo, registra adesão, valor, vigência, desconto e documento de opção/recusa quando necessário.
3. Sistema valida elegibilidade e publica evento aprovado para a folha.
4. Alteração durante competência fechada segue fluxo de ajuste.

## Jornada

1. Gestor ou DP importa ponto/ocorrências com origem identificada.
2. Sistema valida período, contrato, horários e duplicidade.
3. Gestor aprova exceções de sua equipe; DP resolve pendências de regra.
4. Ocorrências aprovadas alimentam banco de horas e folha.

## Banco de Horas

1. Sistema consolida créditos, débitos, compensações e vencimentos por contrato.
2. DP consulta saldo com memória de cálculo e período de referência.
3. Gestor solicita/valida compensação conforme regra vigente.
4. Saldo a pagar ou descontar gera evento de folha somente após aprovação.

## Folha

1. DP abre competência e verifica pré-requisitos, pendências e tabelas vigentes.
2. Lançamentos são incluídos/importados, validados e aprovados.
3. DP executa cálculo; sistema registra snapshot e divergências.
4. DP corrige e submete conferência; Financeiro confere pagamentos; Diretor aprova fechamento conforme alçada.
5. DP fecha e transmite obrigações. Reabertura exige justificativa, permissão e nova aprovação.

## Férias

1. Sistema alerta aquisição e vencimento; DP cria programação.
2. Gestor aprova conforme política; DP registra gozo, abono e adiantamentos.
3. Sistema valida sobreposição, saldo e prazo; gera documento e evento de folha.
4. Após início do gozo, alteração exige tratamento excepcional e auditoria.

## Rescisão

1. DP abre caso com modalidade, datas e motivo.
2. Sistema cria checklist, identifica férias, banco de horas, benefícios, documentos e pendências.
3. DP calcula/valida verbas; Financeiro aprova pagamento; Diretor aprova quando exigido.
4. DP gera documentos, conclui integração e encerra caso somente com itens críticos resolvidos.

## Documentos

1. Usuário autorizado seleciona template vigente e contexto permitido.
2. Sistema preenche somente campos autorizados, gera versão imutável e registra origem.
3. Documento pode seguir para assinatura; rejeição cria nova versão, sem sobrescrever a anterior.
4. Download, visualização e assinatura são auditados.

## Dashboard

1. Usuário vê apenas indicadores de empresas/equipes autorizadas.
2. Dashboard apresenta pendências, prazos, status de folha, férias, admissões e rescisões.
3. Cada indicador leva a uma lista filtrada; informações sensíveis obedecem permissões adicionais.

## Relatórios

1. Usuário escolhe relatório, empresa, competência e filtros permitidos.
2. Sistema valida escopo e gera consulta/exportação rastreável.
3. Relatórios pesados são assíncronos; arquivo expira conforme política de retenção.
4. Relatórios de folha fechada usam snapshot, não dados atuais alterados posteriormente.

## Configurações

1. Administrador gerencia usuários, papéis, empresas, parâmetros, integrações e templates permitidos.
2. DP autorizado mantém rubricas, vigências e tabelas legais mediante aprovação definida.
3. Sistema exige data de vigência, justificativa e auditoria para parâmetros críticos.
4. Nenhuma configuração exclui histórico; inativação ou nova versão substitui uso futuro.

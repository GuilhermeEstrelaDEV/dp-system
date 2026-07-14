# Perfis e Permissões

## Princípios

- Permissões são concedidas por organização e empresa; nunca por suposição de cargo.
- `Excluir` significa arquivar/inativar quando permitido. Exclusão física não é operação disponível.
- Aprovação própria é bloqueada para folha, rescisão, parâmetros legais e exceções críticas.
- Documentos pessoais, dados bancários, pensão e dados médicos exigem permissão sensível além do acesso ao módulo.

Legenda: **V** visualizar, **E** criar/editar, **X** arquivar/inativar, **A** aprovar/fechar, **-** sem acesso. `V*` indica visão restrita ao escopo de equipe/empresa.

| Módulo/ação                           | Administrador |                RH | Departamento Pessoal |      Financeiro |                     Gestor |        Diretor |          Somente Leitura |
| ------------------------------------- | ------------: | ----------------: | -------------------: | --------------: | -------------------------: | -------------: | -----------------------: |
| Usuários, papéis e integrações        |         V/E/X |                 - |                    - |               - |                          - |              V |                        - |
| Empresas e estrutura                  |         V/E/X |                 V |                  V/E |               V |                         V* |              V |                       V* |
| Colaborador cadastral                 |         V/E/X |               V/E |                  V/E |              V* |                         V* |              V |                       V* |
| Documentos sensíveis e bancários      |           V/E |               V/E |                  V/E |     V* bancário |                          - |             V* |                        - |
| Contratos e histórico                 |         V/E/X |               V/E |                V/E/X |               V |                         V* |              V |                       V* |
| Admissão e checklist                  |         V/E/A |             V/E/A |                V/E/A |               V | V* aprovar itens de equipe |              V |                       V* |
| Benefícios                            |         V/E/X |               V/E |                  V/E |               V |                         V* |              V |                       V* |
| Jornada e ocorrências                 |           V/E |                 V |                V/E/A |               - |              V*/E/A equipe |              V |                       V* |
| Banco de horas                        |           V/E |                 V |                V/E/A |               - |                V*/A equipe |              V |                       V* |
| Férias e afastamentos                 |         V/E/A |               V/E |                V/E/A |               V |                V*/A equipe |   V/A exceções |                       V* |
| Rubricas, tabelas e parâmetros legais |         V/E/A |                 V |                  V/E |               V |                          - |            V/A |                        V |
| Lançamentos e cálculo de folha        |           V/E |                 V |                  V/E |               V |                          - |              V | V* sem valores sensíveis |
| Conferência e fechamento de folha     |             V |                 V |                  V/E | V/E/A pagamento |                          - | V/A fechamento |                V* status |
| Adiantamentos e pagamentos externos   |           V/E |                 - |                  V/E |           V/E/A |                          - |   V/A exceções |                       V* |
| Rescisão                              |         V/E/A |               V/E |                V/E/A | V/E/A pagamento |                         V* |   V/A exceções |                       V* |
| Documentos e templates                |         V/E/X |               V/E |                  V/E |               V |                         V* |              V |                       V* |
| eSocial e integrações legais          |         V/E/A |                 - |                V/E/A |               V |                          - |              V |                V* status |
| Dashboard e relatórios                |             V |                 V |                    V |               V |                         V* |              V |                       V* |
| Auditoria                             |             V | V* próprio módulo |    V* próprio módulo |   V* financeiro |                          - |              V |                        - |

## Definição exata dos perfis

### Administrador

Administra acesso, empresas, estruturas, templates, parâmetros técnicos e integrações. Pode criar, editar e inativar dados administrativos e atuar em dados de DP sob auditoria. Não aprova sozinho uma folha, rescisão ou alteração legal que ele próprio tenha iniciado; ação emergencial exige justificativa e auditoria reforçada.

### RH

Cria e atualiza colaboradores, documentos, admissões, benefícios e férias. Visualiza contratos e folha apenas no nível necessário ao processo. Não altera rubricas, não calcula/fecha folha, não transmite eSocial e não aprova pagamento.

### Departamento Pessoal

Opera contratos, jornada, férias, afastamentos, benefícios, lançamentos, rubricas, folha, rescisão, documentos e eSocial. Pode criar, editar e arquivar conforme o módulo; calcula e submete folha, mas não realiza aprovação final exclusiva da própria execução. Não administra usuários, segredos ou configurações técnicas.

### Financeiro

Visualiza dados necessários a pagamento, guias, adiantamentos, pagamentos externos e rescisões. Edita informações financeiras autorizadas e aprova liberação de pagamento. Não altera cadastro trabalhista, jornada, rubricas legais, cálculo-base ou eSocial.

### Gestor

Visualiza apenas equipe e empresa sob sua responsabilidade. Aprova jornada, banco de horas, férias e itens admissionais da equipe. Não visualiza documentos pessoais, salário individual, dados bancários, pensão, folha completa ou configurações.

### Diretor

Visualiza indicadores e informações empresariais autorizadas, aprova fechamento de folha, exceções de férias/rescisão e parâmetros de sua alçada. Não executa rotinas operacionais nem altera cálculos. Acesso a dados pessoais sensíveis deve ser concedido explicitamente, não pelo perfil padrão.

### Somente Leitura

Consulta informações liberadas no escopo de empresa/equipe sem criar, editar, arquivar, exportar dados sensíveis ou aprovar. Relatórios e valores individuais são limitados por permissão complementar.

## Separação de funções obrigatória

| Processo             | Quem prepara  | Quem aprova                                          |
| -------------------- | ------------- | ---------------------------------------------------- |
| Folha                | DP            | Diretor; Financeiro aprova pagamento                 |
| Rescisão             | DP            | Financeiro aprova pagamento; Diretor aprova exceções |
| Rubrica/tabela legal | DP            | Diretor ou administrador distinto, conforme alçada   |
| Importação de dados  | DP            | DP distinto ou Administrador, conforme criticidade   |
| Acesso emergencial   | Administrador | Diretor/administrador distinto em revisão posterior  |

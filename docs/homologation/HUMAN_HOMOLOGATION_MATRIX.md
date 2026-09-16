# Matriz de homologação humana

## Objetivo e limites

Esta matriz organiza a execução humana dos fluxos previstos para o DP-System. Ela parte do
[roteiro vigente](../release/HOMOLOGATION_SCRIPT.md) e do
[resultado anterior](../release/HUMAN_HOMOLOGATION_RESULT.md), sem converter testes automatizados
em evidência humana.

- ambiente-alvo: demonstração externa com dados exclusivamente fictícios;
- estado inicial de todas as jornadas: `NOT_TESTED`;
- resultados permitidos: `NOT_TESTED`, `PASS`, `FAIL` e `BLOCKED`;
- desktop e mobile devem ser avaliados separadamente;
- `PASS` exige evidência humana vinculada à execução;
- qualquer 5xx inesperado, bypass de autorização ou exposição entre empresas interrompe a sessão;
- esta matriz não autoriza produção, Gate D ou novas funcionalidades.

## Perfis de referência

- **Administrator Demo:** conta fictícia com grants `MANUAL`, temporários e limitados à janela de
  homologação.
- **HR Demo:** conta fictícia sem grants administrativos, usada nos cenários negativos.
- Nenhuma credencial, token ou segredo deve ser registrado como evidência.

## Jornadas

| ID    | Módulo                | Cenário                             | Pré-condição                                  | Passos resumidos                                               | Resultado esperado                                               | Perfil necessário  | Desktop      | Mobile       | Status       | Evidência | Observação | Severidade caso falhe                              |
| ----- | --------------------- | ----------------------------------- | --------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------ | ------------ | ------------ | ------------ | --------- | ---------- | -------------------------------------------------- |
| HH-01 | Autenticação          | Login                               | Serviços saudáveis; conta fictícia ativa      | Informar credenciais e entrar                                  | Sessão criada sem exposição de token ou segredo                  | Administrator Demo | `NOT_TESTED` | `NOT_TESTED` | `NOT_TESTED` | —         | —          | P0 se impedir acesso; P1 nos demais casos          |
| HH-02 | Contexto empresarial  | Selecionar empresa                  | Autenticado sem empresa ativa                 | Selecionar Horizonte Demo                                      | Horizonte aparece como contexto ativo                            | Administrator Demo | `NOT_TESTED` | `NOT_TESTED` | `NOT_TESTED` | —         | —          | P0 se houver vazamento; P1 se bloquear o fluxo     |
| HH-03 | Dashboard             | Resumo da Horizonte                 | Horizonte ativa                               | Abrir dashboard e conferir cards                               | Dados autorizados carregam sem conteúdo da Atlas                 | Administrator Demo | `NOT_TESTED` | `NOT_TESTED` | `NOT_TESTED` | —         | —          | P0 se houver vazamento; P1 se indisponível         |
| HH-04 | Empresas              | Consultar e editar empresa fictícia | Grants de leitura e gestão ativos             | Listar, abrir Horizonte, editar campo permitido e salvar       | Projeção mínima e atualização visível                            | Administrator Demo | `NOT_TESTED` | `NOT_TESTED` | `NOT_TESTED` | —         | —          | P1                                                 |
| HH-05 | Colaboradores         | Criar e editar colaborador fictício | Horizonte ativa                               | Criar, abrir detalhe, editar e salvar                          | Validações claras; lista e detalhe atualizados; sem dados Atlas  | Administrator Demo | `NOT_TESTED` | `NOT_TESTED` | `NOT_TESTED` | —         | —          | P0 se houver vazamento; P1 se bloquear CRUD        |
| HH-06 | Contratos             | Criar ou editar vínculo             | Colaborador e estrutura fictícios disponíveis | Abrir contrato, alterar dados permitidos e consultar histórico | Relações pertencem à Horizonte e histórico é preservado          | Administrator Demo | `NOT_TESTED` | `NOT_TESTED` | `NOT_TESTED` | —         | —          | P1                                                 |
| HH-07 | Organização           | Navegar estrutura                   | Horizonte ativa                               | Consultar filial, departamento, cargo e centro de custo        | Tabelas legíveis e ações condicionadas à capability              | Administrator Demo | `NOT_TESTED` | `NOT_TESTED` | `NOT_TESTED` | —         | —          | P1 funcional; P2 visual                            |
| HH-08 | Admissões             | Executar fluxo administrativo       | Contrato fictício elegível                    | Criar/editar admissão, checklist e ação documental lógica      | Estados compreensíveis e transições inválidas rejeitadas         | Administrator Demo | `NOT_TESTED` | `NOT_TESTED` | `NOT_TESTED` | —         | —          | P1                                                 |
| HH-09 | Parâmetros e rubricas | Manter valores demonstrativos       | Horizonte ativa                               | Criar/editar parâmetro e rubrica não legal                     | Conflitos de vigência são recuperáveis e preservam o formulário  | Administrator Demo | `NOT_TESTED` | `NOT_TESTED` | `NOT_TESTED` | —         | —          | P1                                                 |
| HH-10 | Jornada               | Registrar ocorrência demonstrativa  | Contrato fictício disponível                  | Criar jornada/ocorrência e consultar saldo                     | Registros ficam na empresa ativa e duplo envio é evitado         | Administrator Demo | `NOT_TESTED` | `NOT_TESTED` | `NOT_TESTED` | —         | —          | P1                                                 |
| HH-11 | Benefícios            | Manter catálogo e adesão            | Contrato fictício disponível                  | Criar plano/adesão e alterar estado permitido                  | Estado e erros visíveis sem sobre-exposição de dados             | Administrator Demo | `NOT_TESTED` | `NOT_TESTED` | `NOT_TESTED` | —         | —          | P1                                                 |
| HH-12 | Férias                | Executar ação administrativa        | Contrato elegível                             | Criar período/solicitação e executar ação permitida            | Ações seguem capability; estado não depende apenas de cor        | Administrator Demo | `NOT_TESTED` | `NOT_TESTED` | `NOT_TESTED` | —         | —          | P1                                                 |
| HH-13 | Remuneração variável  | Registrar evento fictício           | Horizonte ativa                               | Criar evento e consultar lista                                 | Nenhuma fórmula legal é inferida e a projeção permanece restrita | Administrator Demo | `NOT_TESTED` | `NOT_TESTED` | `NOT_TESTED` | —         | —          | P1                                                 |
| HH-14 | Lançamentos de folha  | Criar e editar lançamento           | Competência fictícia aberta                   | Criar lançamento e alterar campo permitido                     | IDs relacionados são validados dentro da Horizonte               | Administrator Demo | `NOT_TESTED` | `NOT_TESTED` | `NOT_TESTED` | —         | —          | P0 se afetar outra empresa; P1 nos demais casos    |
| HH-15 | Execução de folha     | Iniciar execução                    | Competência e lançamentos válidos             | Iniciar execução e consultar mensagens                         | Uma execução coerente e estado técnico compreensível             | Administrator Demo | `NOT_TESTED` | `NOT_TESTED` | `NOT_TESTED` | —         | —          | P1                                                 |
| HH-16 | Conferência de folha  | Conferir e submeter                 | Execução concluída                            | Iniciar review, tratar achado e submeter                       | Bloqueios e transições inválidas são explicados                  | Administrator Demo | `NOT_TESTED` | `NOT_TESTED` | `NOT_TESTED` | —         | —          | P1                                                 |
| HH-17 | Readiness             | Avaliar prontidão                   | Review aprovado disponível                    | Abrir readiness e conferir blockers                            | `isReady` e remediações são legíveis e coerentes                 | Administrator Demo | `NOT_TESTED` | `NOT_TESTED` | `NOT_TESTED` | —         | —          | P1                                                 |
| HH-18 | Fechamento            | Fechar com replay                   | Readiness verdadeiro                          | Fechar competência e repetir a mesma solicitação               | Uma versão criada; replay retorna a mesma evidência              | Administrator Demo | `NOT_TESTED` | `NOT_TESTED` | `NOT_TESTED` | —         | —          | P0 em perda/inconsistência; P1 nos demais casos    |
| HH-19 | Histórico             | Consultar timeline e manifesto      | Competência fechada                           | Abrir histórico, versão, eventos e manifesto                   | Evidência append-only, versões e horários coerentes              | Administrator Demo | `NOT_TESTED` | `NOT_TESTED` | `NOT_TESTED` | —         | —          | P1                                                 |
| HH-20 | Reabertura            | Reabrir com replay                  | Competência fechada                           | Informar motivo fictício, reabrir e repetir                    | Sucessora `OPEN` criada uma vez; histórico anterior preservado   | Administrator Demo | `NOT_TESTED` | `NOT_TESTED` | `NOT_TESTED` | —         | —          | P0 em perda/inconsistência; P1 nos demais casos    |
| HH-21 | Troca de empresa      | Alternar Horizonte/Atlas            | Rota de detalhe/lista aberta                  | Trocar para Atlas e revisitar a rota anterior                  | Cache limpo; recurso estrangeiro indisponível; lista só da Atlas | Administrator Demo | `NOT_TESTED` | `NOT_TESTED` | `NOT_TESTED` | —         | —          | P0                                                 |
| HH-22 | Autorização negativa  | Negar acesso administrativo         | HR Demo sem grants administrativos            | Entrar como HR, navegar e chamar ação protegida                | UI oculta ações e API responde `403` sem ampliar acesso          | HR Demo            | `NOT_TESTED` | `NOT_TESTED` | `NOT_TESTED` | —         | —          | P0 se houver bypass; P1 se a negação for incorreta |

## Registro de evidência

Cada evidência deve informar data, ambiente, viewport, executor e referência sanitizada para
captura, gravação, correlação ou chamado. Não anexar senha, token, CPF completo, payload sensível ou
dado real. A severidade sugerida na matriz só se torna um achado após triagem conforme
[FEEDBACK_TRIAGE.md](FEEDBACK_TRIAGE.md).

## Critério de saída

A homologação funcional só pode ser declarada concluída quando as 22 jornadas tiverem resultado
humano explícito, evidência revisável, zero falha P0 aberta e decisão formal do responsável. O
preenchimento desta matriz não autoriza produção.

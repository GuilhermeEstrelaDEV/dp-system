# HR Platform Completion — Wave 1

## Estado

`READY FOR HUMAN RETEST`

Recorte executado sobre `develop@ff656c6` em 10/09/2026. A wave trata exclusivamente de
consistência de UX e de descoberta dos CRUDs existentes. Não cria domínio, regra legal, rota,
capability, evento de auditoria ou migration.

## Entrega

- primitives compartilhados para seleção, textarea, filtros, seções e rodapé de formulário,
  erro de campo, loading, erro recuperável e confirmação;
- CTA primário no cabeçalho, busca, filtro, paginação, detalhe, edição, feedback e confirmação no
  `ResourcePage` usado pela estrutura organizacional;
- criação, consulta, edição e alteração de status descobríveis para colaborador;
- criação, edição e alteração de status de contatos dentro do detalhe do colaborador;
- criação, consulta, edição, alteração de status e histórico descobríveis para contratos;
- formulários responsivos, com agrupamento, campos obrigatórios visíveis, mensagens junto ao campo
  e ações `Cancelar`/`Salvar`;
- manutenção do padrão único de tabela consolidado: overflow horizontal, padding, wrap, colunas
  compactas, badges e ações com espaçamento;
- loading, erro com retry, estado vazio orientado e feedback de sucesso reutilizáveis;
- confirmação segura antes de inativar/ativar, com foco inicial em `Cancelar` e suporte a `Escape`.

## Correção de revisão humana — UX/NAV-01

**Classificação:** `UX/NAV-01 — MAJOR`
**Estado:** `RESOLVED`

Sidebar sections Cadastros/Pessoas were rendered without accessible feature entries during human
review.

A correção eliminou o grupo genérico `Cadastros`, impede a renderização de qualquer grupo sem item
visível e conecta somente rotas reais, protegidas pelas capabilities canônicas existentes:

- Pessoas: Colaboradores, Contratos, Admissões, Afastamentos, Férias e Benefícios;
- Organização: Empresas, Filiais, Departamentos, Cargos e Centros de custo;
- Jornada: Jornada / Ponto;
- Folha: Períodos, Lançamentos, Processamentos, Revisão, Parâmetros, Rubricas, Histórico e
  Remuneração variável;
- Administração: Modelos de checklist;
- Futuro: Desligamentos, Documentos e Relatórios permanecem desabilitados como `Em breve`.

O active state cobre detalhes de colaborador, contratos, revisão e histórico. O sidebar desktop e o
drawer móvel agora possuem rolagem vertical, e o subtítulo da marca pode quebrar linha sem ser
cortado. O inventário completo está em
[HR_PLATFORM_NAVIGATION_ROUTE_INVENTORY.md](HR_PLATFORM_NAVIGATION_ROUTE_INVENTORY.md).

## Correção global de legibilidade de formulários e tabelas

**Estado:** `RESOLVED`

Foram auditados os 27 formulários renderizados pelo frontend, distribuídos entre autenticação e as
20 superfícies funcionais da Wave 1. A correção foi concentrada na camada compartilhada:

- `FormField` consolida label em linha própria, indicador de obrigatoriedade/opcionalidade, controle,
  help text e erro na ordem de leitura;
- os formulários baseados em HTML legado recebem o mesmo ritmo visual por seletores restritos ao
  conteúdo da aplicação, sem mudar nome, tipo, obrigatoriedade ou payload de campo;
- o espaçamento entre label e controle, entre campos, entre seções e antes das ações passa a usar
  tokens únicos;
- inputs, selects e textareas preservam altura, largura e quebra de texto adequadas;
- em telas estreitas, grids e ações passam para uma coluna sem esmagar controles;
- tabelas mantêm overflow horizontal e recebem padding de célula, line-height, badges e ações com
  separação consistente.

`EmployeeForm`, `ContractForm` e o `ResourcePage` passaram a reutilizar o `FormField`. Os demais
formulários existentes recebem o padrão compartilhado sem alteração funcional. A expansão de dados
de `Employee` não integra este PR e continua condicionada ao merge humano da Wave 1 e a uma branch
separada baseada em `develop`.

## Revisão sistemática dos CRUDs

| Recurso               | Create                    | Read                    | Update/action           | Resultado da revisão                           |
| --------------------- | ------------------------- | ----------------------- | ----------------------- | ---------------------------------------------- |
| Company               | disponível                | lista/detalhe           | edição e status         | UX padronizada pelo `ResourcePage`             |
| Employee              | disponível                | lista/detalhe           | edição e status         | fluxos tornados explícitos                     |
| Contact               | disponível                | no detalhe              | edição e status         | fluxo completado no detalhe                    |
| Contract              | disponível                | lista/detalhe/histórico | edição e status         | fluxos tornados explícitos                     |
| Branch                | disponível                | lista/detalhe           | edição e status         | UX padronizada pelo `ResourcePage`             |
| Department            | disponível                | lista/detalhe           | edição e status         | UX padronizada pelo `ResourcePage`             |
| Position              | disponível                | lista/detalhe           | edição e status         | UX padronizada pelo `ResourcePage`             |
| Cost Center           | disponível                | lista/detalhe           | edição e status         | UX padronizada pelo `ResourcePage`             |
| Admission             | disponível                | lista/detalhe           | edição/checklist/status | funcional; sem mudança nesta wave              |
| Leave                 | disponível                | lista                   | retorno/status          | funcional; regras legais permanecem pendentes  |
| Benefits              | catálogo/planos/adesões   | painéis                 | ações já expostas       | funcional no recorte administrativo            |
| Vacation              | solicitação               | períodos/listas         | aprovação/cancelamento  | funcional no recorte aprovado                  |
| Time                  | jornadas/ocorrências      | painéis                 | fechamento técnico      | funcional no recorte aprovado                  |
| Variable Compensation | registros administrativos | painéis                 | conciliação/status      | funcional sem fórmulas legais                  |
| Payroll Parameters    | disponível                | lista/detalhe           | edição versionada       | funcional; UX técnica segue no backlog         |
| Payroll Rubrics       | disponível                | lista/detalhe           | edição versionada       | funcional; nenhuma regra legal inferida        |
| Payroll Input         | disponível                | lista                   | inativação              | funcional; seletor contextual segue no backlog |
| Payroll Run           | execução                  | lista/detalhe           | workflow aprovado       | funcional na fundação existente                |
| Payroll Review        | ciclo/achados             | lista/detalhe/timeline  | workflow completo       | funcional e preservado                         |
| Payroll Period        | período                   | readiness/histórico     | close/reopen/replay     | funcional e preservado                         |

Não foi criado `DELETE`: os recursos que exigem preservação histórica continuam usando as ações
canônicas de ativação, inativação, cancelamento ou transição de workflow.

## Segurança e contratos preservados

- visibilidade de ações continua condicionada às capabilities existentes;
- backend deny-by-default e isolamento pela empresa ativa não foram alterados;
- nenhuma associação automática foi criada;
- payloads e endpoints públicos existentes foram preservados;
- nenhuma regra de domínio foi movida para o frontend;
- todos os exemplos e textos continuam identificando o uso de dados fictícios.

## Evidência automatizada

- frontend: 24 arquivos de teste, 118 testes aprovados na validação atual;
- cobertura API preservada em 75,09% de linhas e 71,03% de branches;
- cobertura frontend em 80,50% de linhas e 73,59% de branches;
- cobertura adicional: edição de colaborador, edição de contrato, confirmação explícita e teclado;
- as sete ações de criação são evidência dos testes de CRUD já incorporados na Wave 1 e
  reexecutados nesta correção; nenhum CTA funcional foi criado ou ampliado por `UX/NAV-01`;
- as cinco suítes de smoke são parte do gate global desta wave;
- a ausência de navegador controlável impede declarar nova homologação visual humana.

## Métricas da wave

| Métrica                                  | Resultado |
| ---------------------------------------- | --------: |
| módulos/recursos revisados               |        20 |
| recursos com UX alterada                 |         8 |
| gaps de CRUD/discovery resolvidos        |         4 |
| categorias de inconsistência UX tratadas |        10 |
| rotas adicionadas                        |         0 |
| capabilities adicionadas                 |         0 |
| eventos de auditoria adicionados         |         0 |
| migrations adicionadas                   |         0 |
| grupos de navegação                      |         7 |
| itens de navegação                       |        25 |
| rotas de entrada órfãs                   |         0 |
| ações de criação verificadas             |         7 |
| formulários auditados                    |        27 |
| formulários cobertos pelo ritmo global   |        27 |

## Limites e próximos passos

Busca avançada, filtros contextuais, contador uniforme e seletores que substituam UUIDs manuais
permanecem na Wave 2. Documentos, histórico consolidado e relatórios pertencem à Wave 3. Itens
dependentes de BDP continuam registrados em
[BUSINESS_LEGAL_DECISIONS_REQUIRED.md](BUSINESS_LEGAL_DECISIONS_REQUIRED.md) e não foram antecipados.

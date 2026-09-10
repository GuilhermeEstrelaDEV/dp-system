# HR Platform Completion — Wave 1

## Estado

`READY FOR HUMAN REVIEW`

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

- frontend: 23 arquivos de teste, 102 testes aprovados na validação atual;
- cobertura API preservada em 75,09% de linhas e 71,03% de branches;
- cobertura frontend em 80,50% de linhas e 73,59% de branches;
- cobertura adicional: edição de colaborador, edição de contrato, confirmação explícita e teclado;
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

## Limites e próximos passos

Busca avançada, filtros contextuais, contador uniforme e seletores que substituam UUIDs manuais
permanecem na Wave 2. Documentos, histórico consolidado e relatórios pertencem à Wave 3. Itens
dependentes de BDP continuam registrados em
[BUSINESS_LEGAL_DECISIONS_REQUIRED.md](BUSINESS_LEGAL_DECISIONS_REQUIRED.md) e não foram antecipados.

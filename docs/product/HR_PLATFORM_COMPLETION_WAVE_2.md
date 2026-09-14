# HR Platform Completion — Wave 2

## Status e baseline

- Status: `IMPLEMENTED — AWAITING HUMAN REVIEW`.
- Baseline: `develop@8c10b66a5ae25e961b445938c8e9758e720133bf`.
- Escopo: navegação operacional, dashboard, busca, filtros e ações rápidas.
- Banco: nenhuma alteração de schema e nenhuma migration.

Esta wave reutiliza os contratos, componentes e capacidades já aprovados. Não inicia a Wave 3,
não adiciona regra legal e não autoriza produção, cloud ou deploy.

## Auditoria da experiência anterior

Foram revisados sidebar, header, breadcrumbs, dashboard e as 19 superfícies operacionais solicitadas:
colaboradores, empresas, filiais, departamentos, cargos, centros de custo, contratos, admissões,
afastamentos, férias, benefícios, jornada, remuneração variável, períodos, lançamentos,
processamentos, revisão, parâmetros e rubricas.

Antes desta entrega:

- a sidebar e o menu móvel já filtravam itens por capability e ocultavam grupos vazios;
- o estado ativo de subrotas já possuía aliases explícitos;
- breadcrumbs exibiam somente início e página atual, sem hierarquia operacional consistente;
- o dashboard expunha até três cards ligados a conferência e período de folha;
- busca, filtro, paginação, limpeza e estados vazios variavam entre módulos;
- os CRUDs organizacionais compartilhavam `ResourcePage`, mas os filtros eram apenas locais;
- não havia navegação rápida no header.

## Entrega funcional

### Navegação

- Breadcrumbs apresentam grupo, listagem e subrota real, sem criar destino inexistente.
- O retorno do detalhe de colaborador preserva os filtros recebidos da listagem.
- O header oferece navegação rápida somente para rotas existentes e autorizadas pela sessão.
- Sidebar, drawer móvel, aliases de subrotas e ocultação de grupos vazios foram preservados.

A navegação rápida pesquisa apenas o catálogo estático de módulos. Ela não consulta registros, não
expõe dados pessoais e não substitui autorização no backend.

### Dashboard operacional

O endpoint existente `GET /dashboard/summary` foi estendido, sem nova rota, com contagens reais e
isoladas por empresa:

| Indicador                   | Capability            | Fonte agregada                   |
| --------------------------- | --------------------- | -------------------------------- |
| Colaboradores ativos        | `employee.read`       | `Employee` + vínculo empresarial |
| Contratos ativos            | `contract.read`       | `EmploymentContract`             |
| Admissões pendentes         | `admission.read`      | `AdmissionProcess`               |
| Afastamentos ativos         | `leave.read`          | `LeaveCase`                      |
| Férias próximas (90 dias)   | `vacation.read`       | `VacationRequest`                |
| Benefícios ativos           | `benefit.read`        | `Benefit`                        |
| Processamentos em andamento | `payroll.run.read`    | `PayrollRun`                     |
| Revisões pendentes          | `payroll.review.view` | `PayrollReviewCycle`             |

Os três indicadores anteriormente disponíveis para conferência e competência permanecem
compatíveis. Uma sessão pode receber no máximo 11 cards, sempre condicionados às capabilities
correspondentes. As consultas retornam somente contagens; nenhum registro pessoal é projetado para
o dashboard. Cards autorizados direcionam às listagens canônicas e as ações rápidas de colaborador,
admissão e contrato só aparecem com a capability de gestão correspondente.

### Busca e filtros

Foram adicionados componentes compartilhados `SearchInput`, `FilterSelect` e
`ClearFiltersButton`, integrados ao `FilterBar`. O padrão oferece labels, teclado, foco, quebra
responsiva e restauração explícita da listagem.

- `ResourcePage` mantém busca, status e página na URL para empresas, filiais, departamentos,
  cargos e centros de custo.
- Colaboradores mantêm busca e status na URL. A busca server-side inclui nome legal, nome preferido
  e matrícula, sem CPF.
- Contratos mantêm busca, status e abertura por ação rápida na URL.
- Admissões mantêm busca, status e período previsto na URL; o backend combina os filtros dentro da
  empresa ativa e pesquisa nome/matrícula.
- Afastamentos, férias, benefícios e jornada receberam busca/filtros ou limpeza coerentes com os
  contratos já existentes.
- As superfícies de folha, remuneração variável, parâmetros e rubricas preservam os filtros reais
  já existentes; nenhum enum ou estado novo foi criado.

Estados sem registros e sem resultados foram diferenciados nas superfícies compartilhadas e nas
novas listagens. Paginação server-side existente foi preservada. Onde o contrato atual ainda retorna
coleções limitadas sem metadata de paginação, esta wave não inventa um protocolo incompatível.

## Backend e contratos

- Rotas novas: `0`.
- Endpoints alterados: `3` — dashboard, listagem de colaboradores e listagem de admissões.
- `GET /dashboard/summary`: adiciona agregados opcionais, sem alterar campos existentes.
- `GET /employees`: amplia `search` para matrícula mantendo os predicados empresariais existentes.
- `GET /admission-processes`: adiciona `search`, `plannedFrom` e `plannedTo` opcionais e compatíveis.
- Capabilities novas: `0`.
- Eventos de auditoria novos: `0`; as operações acrescentadas são somente leitura.
- Migrations novas: `0`; total esperado permanece em 17.

## Segurança e privacidade

- `deny-by-default`, empresa ativa, isolamento multiempresa e `404` entre empresas permanecem nos
  guards e serviços existentes.
- Cada métrica é consultada somente quando a capability correspondente está presente.
- `platform.manage` não recebe semântica de super-capability.
- Busca de colaboradores não aceita CPF e nenhuma nova projeção pessoal foi adicionada.
- Termos de busca não são enviados a logs pela aplicação.
- O dashboard usa somente agregados e textos estáticos, sem payloads pessoais.
- Grants automáticos permanecem em zero.

## Busca global

`DEFERRED`. Uma busca global de registros exigiria um contrato próprio de projeção mínima,
classificação de dados, paginação por fonte e testes de isolamento. Implementá-la nesta wave
ampliaria a superfície de exposição de PII sem decisão específica. A navegação rápida por módulos é
o recorte seguro adotado.

## Testes e aceite

Os testes automatizados cobrem:

- agregados empresariais e seleção por capability;
- ausência de consultas para métricas não autorizadas;
- busca por nome preferido/matrícula e isolamento na listagem de colaboradores;
- combinação de busca, status e período em admissões;
- filtros compartilhados, limpeza, estado da URL e estados vazios;
- breadcrumbs hierárquicos e retorno com filtros;
- navegação rápida restrita por capability;
- cards clicáveis e ações rápidas restritas por capability.

O aceite final exige `pnpm check`, geração e validação Prisma, 17 migrations, as cinco suítes de
smoke sem regressão e revogação dos grants temporários de demonstração.

### Evidências executadas

- `pnpm check`: aprovado (lint, typecheck, testes, build e Prisma validate).
- API: 90 suítes aprovadas e 433 testes aprovados; 6 suítes e 28 testes condicionais ignorados.
- Frontend: 24 arquivos de teste e 123 testes aprovados.
- Prisma Client gerado e schema validado; total preservado em 17 migrations.
- Essential: 17/17; P1: 33/33; P2: 56/56; P3: 21/21; P0 residual: 15/15.
- Jornada HTTP real: login, seleção de empresa, dashboard, busca/filtro e detalhe de colaborador,
  busca de empresa, filtro de contratos e destino de folha responderam com sucesso.
- Segurança operacional: HR recebeu 403, recurso cross-company recebeu 404, zero resposta 5xx
  inesperada e zero grant automático.

A homologação visual responsiva nas quatro resoluções-alvo permanece humana; a execução
automatizada não substitui esse aceite.

## Pendências deliberadas

- busca global de dados: depende de contrato de segurança e privacidade específico;
- paginação uniforme para endpoints que ainda retornam arrays simples: requer evolução contratual
  separada e compatível;
- filtros organizacionais compostos para colaboradores: dependem de um endpoint de opções mínimo e
  paginado; UUIDs manuais não foram expostos como falsa melhoria;
- histórico consolidado, relatórios e exportação: pertencem à Wave 3 e não foram iniciados;
- homologação visual nas quatro resoluções-alvo permanece humana.

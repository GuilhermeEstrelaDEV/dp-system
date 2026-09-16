# External Demo — Release Notes

## Escopo do registro

Este documento consolida o estado verificável da baseline `develop@8c10b66` e distingue entregas
integradas de trabalhos ainda em Pull Request. Ele não substitui a homologação humana, não aprova
produção e não promove itens pendentes a escopo entregue.

## ENTREGUE

### Base funcional demonstrativa

- autenticação, seleção de empresa ativa e sessão demonstrativa com identidades fictícias;
- dashboard empresarial e navegação por capability;
- empresas, colaboradores, contatos, contratos e estrutura organizacional;
- admissão, afastamentos, jornada, benefícios, férias e remuneração variável administrativa;
- parâmetros, rubricas, lançamentos, execuções, conferência e ciclos de folha;
- readiness, fechamento, replay idempotente, histórico e reabertura controlada;
- 165 handlers classificados na aceitação funcional: 4 públicos, 5 autenticados e 156 protegidos
  por capability, sem handler não classificado;
- 48 capabilities e 81 eventos de auditoria na
  [aceitação pós-merge](../full-delivery/FULL_FUNCTIONAL_POST_MERGE_ACCEPTANCE.md), sem grants
  automáticos.

### HR Platform — Wave 1

- fluxos de CRUD e descoberta revisados em 20 módulos/recursos;
- navegação de Pessoas e Organização corrigida com visibilidade condicionada à capability;
- formulários e tabelas alinhados aos componentes compartilhados;
- edição/status de colaboradores, contatos e contratos tornados explícitos;
- loading, erro, vazio, confirmação e feedback convergidos sem criar novas regras de negócio;
- detalhes e métricas permanecem em
  [HR Platform Completion — Wave 1](../product/HR_PLATFORM_COMPLETION_WAVE_1.md).

### Employee Profile

- perfil pessoal aditivo com CPF normalizado, data de nascimento, estado civil e campos pessoais
  opcionais;
- contatos reutilizam `EmployeeContact`; endereço e contato de emergência usam relações próprias;
- campos contratuais continuam em `EmploymentContract`/`Admission`, sem duplicação;
- listagem mantém projeção mínima; CPF é omitido da lista e mascarado no detalhe;
- isolamento empresarial, `403`, `404`, auditoria sem PII e capabilities existentes foram
  preservados;
- migration aditiva `0017_employee_profile_expansion`, sem `DROP` ou backfill compulsório;
- decisões e campos deliberadamente não coletados estão em
  [Employee Profile Expansion](../product/EMPLOYEE_PROFILE_EXPANSION.md).

### Segurança, isolamento e auditoria

- deny-by-default, principal autenticado e empresa ativa no backend;
- autorização por capability, sem autorização por nome fixo de papel;
- recursos de outra empresa retornam `404` nos contratos protegidos;
- escritas críticas e eventos canônicos usam trilha de auditoria transacional/fail-closed;
- metadados de auditoria seguem allowlist e não recebem payload sensível bruto;
- seed canônico não cria grants automáticos; acesso demonstrativo é manual, temporário e
  revogável.

### Ambiente demonstrativo local

- bootstrap, reset confirmado, start/stop/status e verificação de dataset;
- PostgreSQL 16, dados fictícios Horizonte/Atlas e smokes Essential/P1/P2/P3/P0 Residual;
- o ambiente é demonstrativo e não constitui topologia de produção.

## DEFERRED

- documentos pessoais, anexos e política documental final;
- histórico consolidado do colaborador;
- relatórios e exportações com campos aprovados;
- busca global e filtros organizacionais compostos;
- paginação uniforme para contratos de lista ainda baseados em arrays;
- portais de colaborador e gestor;
- desligamento funcional e cálculos rescisórios;
- integrações com eSocial, ponto, bancos, contabilidade e assinatura;
- regras legais/fiscais não homologadas, observabilidade de produção e code splitting.

Os bloqueios funcionais e legais permanecem detalhados em
[Business Decisions Pending](../project-management/BUSINESS_DECISIONS_PENDING.md) e
[Decisões legais e de negócio](../product/BUSINESS_LEGAL_DECISIONS_REQUIRED.md).

## PENDENTE DE HOMOLOGAÇÃO

- as 22 jornadas da [matriz humana](../homologation/HUMAN_HOMOLOGATION_MATRIX.md) permanecem
  `NOT_TESTED`; smokes não substituem evidência humana;
- a **Wave 2** está no PR #104 aberto contra `develop`; seu conteúdo não integra esta baseline e não
  é declarado entregue;
- a **demo externa** está no PR #105 Draft contra `develop`; sua configuração, publicação e
  assinatura visual não integram esta baseline e aguardam avaliação humana;
- feedbacks devem seguir a [triagem](../homologation/FEEDBACK_TRIAGE.md) antes de qualquer correção
  ou ampliação de escopo.

## NÃO AUTORIZADO PARA PRODUÇÃO

- produção, cloud produtiva, dados reais e operação trabalhista real;
- Gate D e ETP-015.10;
- grants permanentes ou automáticos;
- remoção dos limites de demonstração;
- novas capabilities, projeções sensíveis ou eventos sem aprovação;
- políticas legais, fiscais, trabalhistas ou LGPD não homologadas;
- deploy produtivo, DNS produtivo, SLA, backup/restore ou suporte operacional ainda não
  evidenciados.

As lacunas para uma futura avaliação estão inventariadas em
[Production Readiness Gaps](../production/PRODUCTION_READINESS_GAPS.md). Nenhuma seção deste
documento representa declaração de `Production Ready`.

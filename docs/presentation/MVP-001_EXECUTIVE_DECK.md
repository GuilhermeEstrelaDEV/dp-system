# MVP-001 — Deck executivo

Fonte textual canônica da apresentação. Todos os números são rastreados no
[mapa de evidências](MVP-001_EVIDENCE_MAP.md). O conteúdo descreve um protótipo local com dados
fictícios; não representa prontidão produtiva.

---

## Slide 1 — DP-System

**Tempo:** 0:40

### Conteúdo visível

- Protótipo local de gestão integrada de Departamento Pessoal
- Evidências, limites e decisão de continuidade
- Dados fictícios · 31/07/2026

### Nota do apresentador

Apresente o encontro como validação gerencial de um protótipo local. O objetivo não é homologar
produção, mas verificar se o problema e a direção do produto fazem sentido para os gestores.

### Evidência de origem

`MVP-001_PROTOTYPE_SCOPE.md`; `MVP-001_FINAL_ACCEPTANCE_EVIDENCE.md`.

### Transição

Comecemos pelo problema operacional que motivou a iniciativa.

---

## Slide 2 — Por que este projeto existe

**Tempo:** 0:50

### Conteúdo visível

- Informações distribuídas dificultam uma visão única
- Dependência de controles manuais aumenta retrabalho e fragilidade
- Regras implícitas reduzem rastreabilidade e previsibilidade
- Centralização precisa ocorrer sem presumir regras legais

### Nota do apresentador

Explique a oportunidade qualitativamente. Não cite quantidade de abas, fórmulas ou economia: essas
afirmações não possuem evidência atual suficiente para uso executivo.

### Evidência de origem

`README.md`; `MVP-001_CURRENT_STATE_ASSESSMENT.md`; documentação de descoberta existente.

### Transição

O primeiro passo foi transformar essa oportunidade em um recorte verificável.

---

## Slide 3 — Um cenário pequeno, porém representativo

**Tempo:** 0:50

### Conteúdo visível

- 2 empresas fictícias com contextos separados
- 26 colaboradores e 26 contratos demonstrativos
- 10 competências e 8 ciclos de conferência
- 16 migrations aplicadas em PostgreSQL 16
- Data-base fixa: 01/07/2026

### Nota do apresentador

Reforce que os números caracterizam somente o dataset local, não o volume real da organização. Os
dados foram construídos para demonstrar isolamento e previsibilidade.

### Evidência de origem

`MVP-001_DEMO_DATASET.md`; `pnpm demo:data:verify` em 31/07/2026.

### Transição

Sobre esse cenário controlado, definimos o objetivo do DP-System.

---

## Slide 4 — Objetivo do DP-System

**Tempo:** 0:45

### Conteúdo visível

- Centralizar informações e rotinas de DP
- Tornar estados, vínculos e histórico explícitos
- Apoiar conferência e decisão com rastreabilidade
- Evoluir em incrementos pequenos e auditáveis
- Reduzir dependência de regras implícitas, sem inventá-las

### Nota do apresentador

Separe visão de produto e entrega atual. O objetivo é amplo; o que será mostrado hoje é um protótipo
local limitado e honesto.

### Evidência de origem

`README.md`; `MVP-001_PROTOTYPE_SCOPE.md`; `ROADMAP.md`.

### Transição

Agora, o que efetivamente cabe no protótipo disponível.

---

## Slide 5 — O que o protótipo entrega hoje

**Tempo:** 0:55

### Conteúdo visível

- Inicialização e reset local reproduzíveis
- Login, sessão revogável e seleção de empresa reais
- Dashboard com contexto empresarial e estado seguro
- Dataset fictício e determinístico
- Gate GO/NO-GO e ensaio automatizado
- Módulos sem autorização permanecem restritos

### Nota do apresentador

Explique que “real” significa fluxo executado pela API e banco locais, não ambiente produtivo. O
estado restrito é uma decisão de segurança, não uma tela cenográfica.

### Evidência de origem

`MVP-001_IMPLEMENTATION_BACKLOG.md`; `MVP-001_CORE_FLOWS.md`.

### Transição

O roteiro demonstra essas capacidades em uma sequência curta.

---

## Slide 6 — Jornada demonstrativa

**Tempo:** 0:55

### Conteúdo visível

- Entrar como Administrador Demo
- Selecionar Horizonte e validar o contexto
- Mostrar dashboard, ajuda e limite seguro
- Trocar para Atlas sem resíduos do contexto anterior
- Encerrar a sessão e validar o perfil de RH

### Nota do apresentador

Antecipe que a demonstração não fará cadastros. Ela comprova identidade, contexto, isolamento,
restrição e operação previsível.

### Evidência de origem

`MVP-001_FINAL_DEMO_SCRIPT.md`; `pnpm demo:rehearse`.

### Transição

Primeiro, a experiência na Horizonte.

---

## Slide 7 — Horizonte: contexto identificado e seguro

**Tempo:** 0:55

### Conteúdo visível

- Empresa ativa exibida no shell
- Dashboard responde no contexto da Horizonte
- 5 ciclos, 4 achados abertos e 6 competências no dataset
- Conta demo sem grant recebe “Indicadores restritos”
- Nenhuma métrica é liberada por atalho

### Nota do apresentador

Mostre o screenshot real. Os agregados são evidência do verificador, não números visíveis para a
conta sem capability. Essa diferença comprova o deny-by-default.

### Evidência de origem

`03-dashboard-horizonte.png`; `MVP-001_DEMO_DATASET.md`; `pnpm demo:data:verify`.

### Transição

A mesma sessão pode mudar de empresa sem misturar os contextos.

---

## Slide 8 — Atlas: troca sem vazamento empresarial

**Tempo:** 0:55

### Conteúdo visível

- Vínculo empresarial validado pelo backend
- Novo contexto emitido para Atlas
- Cache anterior descartado antes da renderização
- 3 ciclos, 1 achado aberto e 4 competências no dataset
- Estado restrito permanece coerente

### Nota do apresentador

Compare as duas capturas. Não diga que a interface mostra os agregados: o verificador comprova que
os conjuntos são diferentes e isolados, enquanto o frontend preserva a restrição.

### Evidência de origem

`06-dashboard-atlas.png`; `MVP-001_COMPANY_CONTEXT_FLOW.md`; `pnpm demo:verify`.

### Transição

Essa troca é parte de uma postura de segurança mais ampla.

---

## Slide 9 — Segurança por padrão

**Tempo:** 0:55

### Conteúdo visível

- Autenticação JWT e sessão lógica reais
- Empresa ativa vem do principal autenticado
- 401 para sessão inválida; 403 para vínculo ausente
- Deny-by-default para capacidades não concedidas
- Zero grants e zero capabilities automáticas
- Relatórios operacionais sanitizados

### Nota do apresentador

Explique deny-by-default em linguagem simples: na dúvida, o sistema não libera. Segurança completa
ou prontidão produtiva não são alegadas.

### Evidência de origem

`MVP-001_SECURITY_REVIEW.md`; `MVP-001_DEMO_SECURITY_BOUNDARIES.md`.

### Transição

Essa escolha explica por que algumas superfícies aparecem restritas.

---

## Slide 10 — Limites seguros, não atalhos

**Tempo:** 0:55

### Conteúdo visível

- APIs legadas ainda não possuem proteção canônica uniforme
- O frontend bloqueia o acesso antes de buscar dados
- Não há CRUD demonstrativo autorizado
- Não foram criados bypasses ou grants para “fazer parecer”
- Migração e proteção pertencem à futura ETP-015.4

### Nota do apresentador

Não diga “pronto, mas desativado”. Existem telas e APIs históricas, porém o fluxo não integra o
roteiro enquanto a autorização de backend não for migrada e validada.

### Evidência de origem

`05-acesso-restrito.png`; `MVP-001_CORE_FLOWS.md`; `MVP-001_KNOWN_LIMITATIONS.md`.

### Transição

Mesmo com esse limite, a base demonstrativa foi submetida a regressão e estabilidade.

---

## Slide 11 — Evidências de estabilidade

**Tempo:** 0:55

### Conteúdo visível

- 376 testes executados no aceite da estabilização
- Cobertura: API 70,34%; frontend 77,50% em linhas
- Soak de 30,3 minutos com 7/7 checkpoints GO
- Zero 5xx e zero reinício no roteiro aprovado
- Stop/start, reset e recuperação de indisponibilidade aprovados
- Nenhum defeito P0 ou P1 aberto

### Nota do apresentador

Os números são evidências locais e não SLOs de produção. Cobertura ajuda a medir confiança, mas não
elimina riscos nem substitui validação gerencial.

### Evidência de origem

`MVP-001_STABILIZATION_REPORT.md`; `MVP-001_FINAL_ACCEPTANCE_EVIDENCE.md`.

### Transição

Além de estável, a demonstração possui um procedimento operacional simples.

---

## Slide 12 — Operação previsível da demonstração

**Tempo:** 0:50

### Conteúdo visível

- demo:setup prepara banco, migrations e massa fictícia
- demo:ready inicia e executa o gate completo
- demo:verify confirma ambiente, dados e segurança
- demo:rehearse ensaia o fluxo sem reset
- Runtime aquecido opera com assets locais
- Planos A, B e C evitam improvisos

### Nota do apresentador

Primeira instalação e build podem exigir internet. Depois da preparação, os quatro serviços rodam
localmente. Não projete terminal com credenciais ou arquivos de ambiente.

### Evidência de origem

`DEMO_LOCAL_SETUP.md`; `MVP-001_DEMO_OPERATOR_GUIDE.md`; `MVP-001_PRESENTATION_CONTINGENCY.md`.

### Transição

Transparência operacional também exige explicitar o que ainda falta.

---

## Slide 13 — Limitações e riscos conhecidos

**Tempo:** 1:00

### Conteúdo visível

- Execução exclusivamente local, dependente de Docker
- Sem produção, cloud, MFA, refresh ou recuperação de senha
- APIs legadas e CRUD demonstrativo permanecem fora do roteiro
- Primeiro build pode exigir internet
- Bundle web de 529,69 kB gera warning
- 8 advisories transitivos documentados; nenhum crítico

### Nota do apresentador

Acrescente que não existem cronograma produtivo, orçamento ou suporte aprovados. Essas limitações
não são detalhes a esconder: são insumos para a decisão de continuidade.

### Evidência de origem

`MVP-001_KNOWN_LIMITATIONS.md`; `MVP-001_SECURITY_REVIEW.md`.

### Transição

Com a base e os limites claros, há caminhos possíveis — nenhum ainda aprovado.

---

## Slide 14 — Próximos passos possíveis

**Tempo:** 0:50

### Conteúdo visível

- Validar problema, linguagem e indicadores com gestores
- Consolidar feedback e prioridades de domínio
- Decidir se a descoberta da ETP-015.4 deve avançar
- Planejar expansão funcional somente após autorização
- Tratar produção em iniciativa futura específica

### Nota do apresentador

Não prometa prazo, custo ou equipe. Cada caminho exige nova especificação, decisão e validação.

### Evidência de origem

`MVP-001_MANAGEMENT_DECISION_MATRIX.md`; `ROADMAP.md`.

### Transição

Encerramos com as perguntas que esta reunião precisa responder.

---

## Slide 15 — Decisão esperada dos gestores

**Tempo:** 1:00

### Conteúdo visível

- O problema está corretamente representado?
- O dashboard proposto responde às necessidades de gestão?
- Quais fluxos devem ser priorizados?
- Quais riscos precisam ser tratados primeiro?
- A iniciativa deve avançar, ser ajustada, mantida ou encerrada?
- Quem será responsável pelas próximas decisões de negócio?

### Nota do apresentador

Registre a decisão como feedback, não como aprovação automática. Reforce que o protótipo permanece
local e que qualquer evolução será objeto de novo planejamento.

### Evidência de origem

`MVP-001_MANAGER_FEEDBACK_FORM.md`; `MVP-001_MANAGEMENT_DECISION_MATRIX.md`.

### Transição

Abra para perguntas e registre próximos responsáveis sem assumir compromissos não aprovados.

# Pacote de decisão — BDP-009

## 1. Finalidade e status

**Status:** preparado para homologação; nenhuma alternativa foi aprovada e BDP-009 permanece `Pendente`.

Este pacote organiza decisões humanas necessárias para identidade empresarial, autorização, segregação e auditoria da ETP-013. As recomendações são técnicas, não vinculantes. Elas não atribuem cargos, não criam alçadas e não autorizam código, migration ou workflow funcional.

Referências: [Especificação de identidade e autorização](../architecture/IDENTITY_AUTHORIZATION_SPECIFICATION.md), [ADR-007 proposta](../architecture/decisions/ADR-007-identity-authorization-context.md), [Especificação da ETP-013](ETP-013_PAYROLL_REVIEW_APPROVAL_SPECIFICATION.md) e [Fundação neutra](../modules/PAYROLL_REVIEW_FOUNDATION.md).

## 2. Como homologar

Para cada tema, registrar na matriz da seção 13 a alternativa escolhida, ressalvas, evidência, responsáveis e data. Uma recomendação técnica só se torna decisão após aceite dos responsáveis de negócio e técnicos indicados. Divergências devem permanecer abertas; não se deve combinar alternativas implicitamente.

## 3. Vínculo usuário–empresa

| Alternativa          | Descrição                                                                    | Benefícios                                                       | Riscos                                                                         | Banco                                                            | API                                                | Frontend                                     | Testes                                          | Auditoria                             | Decisão humana necessária                               | Recomendação técnica não vinculante                                                   |
| -------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------- | -------------------------------------------------- | -------------------------------------------- | ----------------------------------------------- | ------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Associação direta    | Membership liga usuário e empresa; capacidades são atribuídas separadamente. | Simples para validar acesso básico; revogação empresarial clara. | Membership sozinho não explica função; exige outro nível para autorização.     | Nova relação `user_company`, status e vigência.                  | Resolve empresas acessíveis antes das capacidades. | Lista empresas autorizadas.                  | Vigência, revogação e isolamento.               | Criar/revogar membership.             | Quem administra e quais status/vigências existem.       | Proposta: usar membership explícito como fronteira mínima, combinado com assignments. |
| Papel empresarial    | Relação ternária usuário–empresa–papel.                                      | RBAC direto e poucas tabelas.                                    | Duplica dados ao atribuir vários papéis; difícil representar acesso sem papel. | Assignment composto com unicidades e vigência.                   | Resolve membership e papel juntos.                 | Exibe empresas derivadas dos assignments.    | Múltiplos papéis, revogação parcial e conflito. | Criar/revogar cada assignment.        | Se todo acesso exige papel e como acumular papéis.      | Proposta: aceitável para recorte simples, após definir acumulação e vigência.         |
| Grupo organizacional | Usuário recebe acesso em organização/grupo e herda empresas.                 | Administração em massa e expansão controlada.                    | `Organization` ainda não está materializada; herança amplia impacto de erro.   | Organização, membership, vínculo empresa–organização e exceções. | Expande escopo e precisa resolver herança.         | Mostra empresas herdadas e origem do acesso. | Herança, remoção, exceções e mudança de grupo.  | Origem herdada e alterações do grupo. | Estrutura oficial do grupo e regras de herança/exceção. | Proposta: adiar até `Organization` e BDP-012 estarem homologadas.                     |

## 4. Escopo das permissões

| Alternativa | Descrição                                                | Benefícios                                 | Riscos                                                      | Banco                                                       | API                                                | Frontend                               | Testes                             | Auditoria                         | Decisão humana necessária                            | Recomendação técnica não vinculante                                         |
| ----------- | -------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------- | -------------------------------------- | ---------------------------------- | --------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------- |
| Global      | Papel/capacidade vale para todas as empresas acessíveis. | Administração simples e cache reduzido.    | Privilégio excessivo; não atende diferenças entre empresas. | Reutiliza `UserRole`; membership separado ainda necessário. | Capacidade global + empresa acessível.             | Mesmas ações em todas as empresas.     | Não vazamento e revogação global.  | Origem global da capacidade.      | Quais capacidades podem ser globais.                 | Proposta: limitar a capacidades estritamente técnicas de plataforma.        |
| Por empresa | Assignment de papel/capacidade é empresarial.            | Menor privilégio e aderência multiempresa. | Mais registros e administração.                             | Assignment inclui `companyId`, status e vigência.           | Resolve capacidades por empresa ativa.             | Ações mudam ao trocar empresa.         | Matriz negativa por empresa.       | Empresa e assignment usados.      | Quem administra assignments e seus limites.          | Proposta: padrão para operações de DP/folha.                                |
| Híbrido     | Capacidades de plataforma globais e domínio por empresa. | Equilibra administração e isolamento.      | Precedência e conflito precisam ser explícitos.             | Catálogo global + assignments globais/empresariais tipados. | Resolver e combinar escopos sem elevar privilégio. | Distingue contexto global/empresarial. | Precedência, conflito e revogação. | Escopo que concedeu a capacidade. | Lista de capacidades globais e regra de precedência. | Proposta: alvo preferencial, com allowlist global mínima e deny-by-default. |

## 5. Workflow de conferência

| Fase candidata | Descrição | Benefícios | Riscos | Banco | API | Frontend | Testes | Auditoria | Decisão humana necessária | Recomendação técnica não vinculante |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Preparação | Abrir ciclo e registrar achados/checklist. | Separa análise de decisão. | Estado inicial e responsável podem ser ambíguos. | Ciclo, snapshot e ator de abertura. | Abrir/listar detalhe. | Área de preparação. | Execução elegível, concorrência e empresa. | Abertura e snapshot. | Quem pode abrir e quando. | Proposta: manter não decisória e append-only. |
| Conferência | Resolver/reabrir achados e consolidar evidências. | Evidência rastreável. | Autoridade sobre achado bloqueante indefinida. | Achados/eventos/atores. | Criar, resolver e reabrir. | Lista, detalhe e histórico. | Transições, justificativa e concorrência. | Cada evento com motivo. | Quem cria/resolve/reabre e visibilidade. | Proposta: reutilizar a fundação neutra após policy aprovada. |
| Submissão | Congelar versão candidata e encaminhar para decisão. | Delimita o objeto decidido. | Edição após submissão pode invalidar evidência. | Evento/snapshot/idempotência. | Comando de submissão. | Confirmação e estado aguardando decisão. | Idempotência e bloqueios. | Ator, versão e motivo. | Pré-condições e destino. | Proposta: snapshot imutável e falha fechada sem policy. |
| Aprovação | Registrar decisão positiva em etapa homologada. | Evidência explícita. | Não define suficiência, alçada ou fechamento. | Decisão append-only e policy/version. | Comando decisório. | Ação somente por capacidade efetiva. | Autoaprovação, alçada e repetição. | Ator, estado anterior/posterior e policy. | Quem, quantos, ordem e efeitos. | Proposta: não implementar antes da BDP-009. |
| Rejeição | Registrar decisão negativa e retorno. | Motivo e responsabilização claros. | Destino e possibilidade de correção indefinidos. | Decisão e transição append-only. | Comando com justificativa. | Motivo obrigatório e timeline. | Destinos válidos e concorrência. | Motivo e estado resultante. | Para qual fase retorna e quem corrige. | Proposta: modelar como evento, nunca sobrescrever aprovação. |
| Reabertura | Reabrir ciclo/competência após decisão. | Corrige fatos posteriores. | Pode invalidar pagamento/fechamento. | Evento e vínculo à decisão invalidada. | Comando específico. | Aviso de impacto. | Imutabilidade e nova rodada. | Ator, motivo e decisões afetadas. | Quem pode reabrir e efeitos. | Proposta: exigir decisão humana explícita antes do código. |
| Invalidação | Marcar aprovação anterior como não vigente sem apagá-la. | Preserva cadeia de custódia. | Critérios automáticos podem ser perigosos. | Relação entre evento invalidante e decisão. | Derivada por caso de uso homologado. | Exibe decisão histórica/inválida. | Recalculo, reabertura e concorrência. | Causa e versão invalidada. | Quais mudanças invalidam e se exigem nova rodada. | Proposta: append-only; nunca exclusão ou update destrutivo. |

## 6. Segregação de funções

| Alternativa/regra | Descrição | Benefícios | Riscos | Banco | API | Frontend | Testes | Auditoria | Decisão humana necessária | Recomendação técnica não vinculante |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Impedir autoaprovação | Autor de submissão/decisão anterior não registra a própria aprovação final. | Reduz conflito direto. | Conceito de “autor” e alcance ainda precisam definição. | Atores por evento e policy versionada. | Policy compara contexto e histórico. | Ação indisponível com motivo seguro. | Identidade igual/diferente e revogação. | Negativas e tentativas relevantes. | Quais ações tornam alguém autor impedido. | Proposta: requisito mínimo, após delimitar ações. |
| Preparador não aprova | Quem abriu/preparou não participa da decisão. | Separação mais forte. | Pode inviabilizar empresas pequenas. | Papel no ciclo ou eventos de participação. | Policy consulta participação. | Indica impedimento, sem revelar dados indevidos. | Múltiplos preparadores e reatribuição. | Participantes e policy. | Se vale sempre e quais exceções. | Proposta: opção preferível para folha, sujeita à viabilidade operacional. |
| Autor resolve achado | Autor do achado pode resolvê-lo. | Fluxo ágil. | Autovalidação da evidência. | Criador e resolvedor preservados. | Policy permite ou condiciona. | Mostra ação conforme capacidade. | Mesmo ator e achado bloqueante. | Ambos os atores. | Se severidade muda a regra. | Proposta: permitir apenas se outro controle homologado validar bloqueantes. |
| Autor não resolve | Outro ator deve resolver. | Revisão independente. | Custo operacional maior. | Criador/resolvedor distintos. | Policy bloqueia igualdade. | Encaminhamento a outro usuário, se aprovado. | Ausência de segundo ator. | Tentativa negada e resolução. | Aplicação por severidade/empresa. | Proposta: candidata para achados bloqueantes. |
| Exceção administrativa | Bypass formal, temporário e revisável. | Continuidade em contingência. | Alto risco de abuso e “atalho” permanente. | Grant emergencial, expiração e revisão. | Endpoint/policy separados. | Fluxo destacado e justificativa reforçada. | Expiração, revogação e impossibilidade de auto-revisão. | Auditoria reforçada e alerta. | Se existe, quem concede/revisa e prazo. | Proposta: não existir até homologação específica. |

## 7. Níveis de aprovação

| Alternativa | Descrição | Benefícios | Riscos | Banco | API | Frontend | Testes | Auditoria | Decisão humana necessária | Recomendação técnica não vinculante |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Única | Uma decisão suficiente por ciclo. | Modelo simples e menor latência. | Pode não separar conferência/pagamento/fechamento. | Uma etapa configurada e decisão. | Um comando e policy. | Uma fila de decisão. | Concorrência e autoaprovação. | Decisão e policy. | Em quais cenários é suficiente. | Proposta: somente se negócio confirmar segregação adequada. |
| Sequencial | Etapas ordenadas; próxima abre após anterior. | Ordem e responsabilidade claras. | Gargalo e reprocessamento complexo. | Definição/versionamento de etapas e posição. | Próxima etapa derivada no backend. | Timeline e fila por etapa. | Ordem, rejeição e reabertura. | Cada transição. | Quantidade, ordem e retorno. | Proposta: adequada se as responsabilidades forem dependentes. |
| Paralela | Várias decisões abertas simultaneamente; regra consolida. | Menor tempo e independência. | Quórum, conflito e suficiência complexos. | Grupo, quorum/regra e decisões individuais. | Comandos concorrentes e consolidação. | Painel de decisões pendentes. | Corrida, duplicidade, empate e revogação. | Cada decisão e consolidação. | Participantes, quórum e conflitos. | Proposta: adiar salvo necessidade operacional comprovada. |

## 8. Alçadas

| Alternativa | Descrição | Benefícios | Riscos | Banco | API | Frontend | Testes | Auditoria | Decisão humana necessária | Recomendação técnica não vinculante |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Sem alçada financeira | Capacidade/etapa não depende de valor. | Evita cálculo de base de alçada. | Pode ser insuficiente para risco financeiro. | Sem tabela de faixas. | Policy por etapa/empresa. | Não mostra limites. | Permissões e segregação. | Policy sem valor. | Se é aceitável para o recorte inicial. | Proposta: menor recorte possível, se formalmente homologado. |
| Por valor | Faixas determinam participantes/níveis. | Ajusta controle ao risco. | Qual valor-base, moeda e mudanças ainda indefinidos. | Faixas versionadas, moeda e vigência. | Calcula base homologada e seleciona policy. | Exibe faixa sem ampliar dados sensíveis. | Limites, bordas, arredondamento e versão. | Base, faixa e policy. | Valor-base, faixas, moeda e responsáveis. | Proposta: não implementar sem exemplos homologados. |
| Por tipo de folha | Policy varia por tipo de competência/processamento. | Reflete riscos distintos. | Taxonomia de tipos pode ser incompleta. | Regra versionada por tipo. | Resolve tipo da execução, não do payload. | Contextualiza fluxo. | Cada tipo e fallback deny. | Tipo e regra aplicada. | Tipos oficiais e respectivas policies. | Proposta: candidata após estabilizar tipos de folha. |
| Por empresa | Cada empresa possui policy própria. | Respeita governança local. | Configuração divergente e difícil manutenção. | Configuração/versionamento empresarial. | Resolve por empresa ativa. | Mostra fluxo efetivo da empresa. | Empresas com/sem configuração. | Empresa e policy. | Quem governa e se há padrão corporativo. | Proposta: suportar tecnicamente, com default sempre negado. |

## 9. Substituições e acesso emergencial

| Alternativa | Descrição | Benefícios | Riscos | Banco | API | Frontend | Testes | Auditoria | Decisão humana necessária | Recomendação técnica não vinculante |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Substituição temporária | Assignment alternativo com início/fim. | Continuidade previsível. | Sobreposição e herança excessiva. | Substituição, vigência, concedente e escopo. | Resolve apenas no período. | Indica atuação como substituto. | Fuso, expiração e revogação. | Concessão, uso e término. | Quem concede, duração e capacidades transferidas. | Proposta: preferível a compartilhar credenciais. |
| Delegação | Titular delega capacidade/etapa específica. | Flexível e granular. | Delegação em cadeia e conflito de interesse. | Delegação, escopo, profundidade e revogação. | Policy valida delegação atual. | Criar/revogar delegação se autorizado. | Cadeia, ciclo e auto-delegação. | Delegante/delegado e uso. | Se é permitida, limites e cadeia. | Proposta: adiar até regra e administração maduras. |
| Emergencial auditado | Grant excepcional com motivo e revisão posterior. | Recuperação em incidentes. | Maior vetor de abuso. | Grant curto, expiração, aprovador/revisor. | Caminho separado, nunca fallback automático. | Avisos fortes e confirmação. | Expiração, dupla revisão e alertas. | Registro reforçado, inclusive tentativa. | Quem concede/revisa e duração máxima. | Proposta: deny até decisão específica e controles operacionais. |

Expiração e revogação devem ser verificadas em cada request crítico; cache não pode prolongar acesso revogado além do limite aprovado.

## 10. Recurso fora do escopo empresarial

| Alternativa | Descrição | Benefícios | Riscos | Banco | API | Frontend | Testes | Auditoria | Decisão humana necessária | Recomendação técnica não vinculante |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `403 Forbidden` | Confirma que o recurso/rota existe, mas acesso foi negado. | Diagnóstico e observabilidade claros. | Facilita enumeração de identificadores. | Nenhum impacto direto. | Distingue inexistente de proibido. | Mensagem de acesso negado. | IDs válidos/inválidos e vazamento. | Negação explícita. | Se a existência é sensível por recurso. | Proposta: adequado para capability negada em recurso já conhecido. |
| `404 Not Found` | Não revela existência fora do escopo. | Reduz enumeração. | Diagnóstico e suporte menos diretos. | Nenhum impacto direto. | Consulta sempre filtrada por empresa. | Mensagem de indisponibilidade. | Mesmo resultado para ausente/externo. | Internamente registra motivo real. | Quais recursos exigem ocultação. | Proposta: padrão para lookup por ID empresarial fora do escopo. |

## 11. Auditoria

### Eventos mínimos candidatos

- autenticação, falha relevante, logout e revogação de sessão;
- seleção/troca de empresa ativa;
- concessão, alteração, revogação e uso de assignment/delegação/emergência;
- abertura de ciclo, criação/resolução/reabertura de achado;
- submissão, decisão, rejeição, reabertura e invalidação;
- tentativa decisória negada por segregação/alçada, conforme política de segurança;
- alteração/versionamento de policy.

| Campo/tema                | Alternativas                                           | Benefícios/riscos e impactos                                                                                  | Decisão humana necessária                             | Recomendação técnica não vinculante                                             |
| ------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------- |
| `actorId`                 | Obrigatório autenticado; ator técnico para job futuro. | Banco/API exigem identidade; frontend não envia; testes impedem spoofing. Auditoria sem ator invalida cadeia. | Como representar jobs/integrações.                    | Obrigatório em ação humana; identidade técnica distinta para automação.         |
| `companyId`               | Coluna dedicada ou metadata.                           | Coluna melhora filtro/índice; metadata evita migration imediata, mas é frágil.                                | Volume, consultas e retenção.                         | Coluna dedicada quando o modelo empresarial for migrado.                        |
| `traceId`                 | Correlation ID atual.                                  | Une logs e ação; deve ser validado e propagado.                                                               | Retenção e acesso operacional.                        | Obrigatório em toda ação crítica.                                               |
| Motivo                    | Texto livre, código + texto, somente código.           | Código facilita análise; texto explica exceção e pode conter dado sensível.                                   | Catálogo e obrigatoriedade por ação.                  | Código obrigatório e texto sanitizado quando necessário.                        |
| Estado anterior/posterior | Snapshot integral ou campos allowlisted.               | Integral aumenta risco e volume; allowlist exige desenho.                                                     | Campos necessários para evidência.                    | Allowlist versionada, sem payload integral.                                     |
| Retenção                  | Prazo único ou por categoria.                          | Prazo único é simples; por categoria atende riscos distintos, mas exige governança.                           | Jurídico/DPO define prazo, bloqueio legal e descarte. | Não fixar prazo antes de BDP-011/Jurídico; impedir exclusão operacional ad hoc. |

## 12. Visibilidade de dados sensíveis

| Alternativa | Descrição | Benefícios | Riscos | Banco | API | Frontend | Testes | Auditoria | Decisão humana necessária | Recomendação técnica não vinculante |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Integral | Resposta contém valores individuais completos. | Conferência detalhada. | Exposição ampla e impacto LGPD. | Sem cópia adicional; consultas sensíveis. | Exige capacidade específica. | Proteção contra cache/exportação indevida. | Matriz positiva/negativa e logs. | Acesso e exportação. | Quem necessita e finalidade. | Proposta: não ser padrão. |
| Mascaramento | Valores/identificadores são ocultados parcialmente. | Menor exposição. | Pode inviabilizar conferência ou dar falsa segurança. | Regras de projeção, não duplicação. | DTO conforme capacidade. | Componente acessível de mascaramento. | Campos e formatos mascarados. | Registrar tipo de visão, não valor. | Quais campos e níveis de máscara. | Proposta: padrão para leitura de status sem conferência financeira. |
| Condicionado por capacidade | API projeta detalhe conforme capacidade sensível. | Menor privilégio e flexibilidade. | Complexidade de cache e DTOs. | Assignment/capacidade empresarial. | Projeção server-side e cache `Vary`/isolado. | Nunca “desmascara” localmente. | Cache, troca de empresa e privilege escalation. | Capacidade efetiva usada. | Matriz de capacidades sensíveis. | Proposta: combinar com mascaramento e deny-by-default. |

## 13. Matriz de decisão preenchível

| Tema                              | Alternativa escolhida | Ressalvas/escopo | Evidência/anexo | DP  | Jurídico/DPO | Segurança | Arquitetura/Engenharia | Data | Status   |
| --------------------------------- | --------------------- | ---------------- | --------------- | --- | ------------ | --------- | ---------------------- | ---- | -------- |
| Vínculo usuário–empresa           |                       |                  |                 |     |              |           |                        |      | Pendente |
| Escopo das permissões             |                       |                  |                 |     |              |           |                        |      | Pendente |
| Fases/transições do workflow      |                       |                  |                 |     |              |           |                        |      | Pendente |
| Segregação de funções             |                       |                  |                 |     |              |           |                        |      | Pendente |
| Níveis de aprovação               |                       |                  |                 |     |              |           |                        |      | Pendente |
| Alçadas                           |                       |                  |                 |     |              |           |                        |      | Pendente |
| Substituição/delegação/emergência |                       |                  |                 |     |              |           |                        |      | Pendente |
| `403` versus `404`                |                       |                  |                 |     |              |           |                        |      | Pendente |
| Auditoria e retenção              |                       |                  |                 |     |              |           |                        |      | Pendente |
| Visibilidade sensível             |                       |                  |                 |     |              |           |                        |      | Pendente |

## 14. Checklist de homologação

- [ ] Cada tema da matriz possui alternativa e escopo inequívocos.
- [ ] DP validou workflow, atores, exceções e exemplos reais.
- [ ] Diretoria/Financeiro validaram níveis e alçadas, quando aplicáveis.
- [ ] Jurídico/DPO validou dados sensíveis, auditoria, retenção e emergência.
- [ ] Segurança validou deny-by-default, segregação, revogação e resposta fora do escopo.
- [ ] Arquitetura aprovou ADR-007 e o modelo usuário–empresa.
- [ ] Engenharia revisou impacto de migration, rollout e compatibilidade.
- [ ] Critérios de `403`/`404` foram definidos por categoria de recurso.
- [ ] Casos de rejeição, reabertura e invalidação possuem estado resultante.
- [ ] Ausência de configuração continua negando operações decisórias.
- [ ] Amostras e critérios de aceite foram anexados sem dados pessoais reais.
- [ ] Responsáveis, data e evidências estão registrados.

## 15. Perguntas objetivas por responsável

### DP, Financeiro e Diretoria

1. Quem prepara, confere, submete e decide em cada tipo de folha?
2. O preparador pode resolver achado próprio? A resposta muda para achado bloqueante?
3. Quantas decisões são necessárias e em qual ordem?
4. Rejeição retorna para qual fase e invalida quais evidências?
5. Quais mudanças após aprovação exigem nova rodada?
6. Existe alçada? Qual é a base homologada e quais exemplos de borda?
7. Empresas podem possuir workflows diferentes?
8. Substituição, delegação ou emergência são permitidas? Quem autoriza e revisa?

### Jurídico/DPO

1. Quais valores e identificadores cada participante pode visualizar?
2. Quais eventos precisam ser retidos e por quanto tempo?
3. Texto livre de justificativa pode conter quais dados e quais devem ser proibidos?
4. Há bloqueio legal de descarte ou obrigação de exportação?
5. Quem pode consultar auditoria e com qual nível de detalhe?

### Segurança

1. Quais operações podem ter capacidade global?
2. Quando retornar `404` em vez de `403`?
3. Qual duração e revogação são aceitáveis para sessão, assignment e substituição?
4. Acesso emergencial será permitido? Quais controles mínimos e alertas?
5. Quais tentativas negadas precisam de auditoria/alerta?
6. Qual política de cache evita retenção de capacidades ou dados de outra empresa?

### Arquitetura e Engenharia

1. Membership e assignment serão separados ou compostos?
2. O contrato de empresa ativa será header, rota ou sessão?
3. Como versionar policies e preservar a versão aplicada?
4. `AuditLog.companyId` será coluna dedicada?
5. Qual estratégia migra rotas públicas para deny-by-default sem quebra não planejada?
6. Como garantir atomicidade entre estado, evento e auditoria?
7. Quais chaves de idempotência e restrições únicas são necessárias?

## 16. Critérios mínimos para resolver BDP-009

BDP-009 só pode mudar de `Pendente` quando:

1. todos os temas da matriz tiverem decisão explícita, responsáveis, data e evidência;
2. atores, fases, ordem, segregações, exceções e efeitos estiverem inequívocos;
3. alçadas estiverem definidas ou formalmente declaradas inexistentes no recorte;
4. substituição/delegação/emergência estiverem definidas ou formalmente proibidas;
5. modelo usuário–empresa, escopo de permissões e empresa ativa estiverem aprovados;
6. regras de auditoria, retenção e visibilidade sensível estiverem homologadas;
7. ADR-007 for aceita ou substituída por ADR aceita;
8. exemplos de aceite cobrirem sucesso, negação, rejeição, reabertura e multiempresa;
9. não houver campo crítico marcado como “a definir” para o recorte inicial;
10. DP, responsáveis financeiros/diretivos, Jurídico/DPO, Segurança e Arquitetura tiverem registrado aceite aplicável.

## 17. Plano após aprovação

Sequência sugerida, sujeita à decisão homologada:

1. aceitar/ajustar ADR-007 e congelar contratos de identidade/policy;
2. migration de membership/assignments, vigência e eventual `AuditLog.companyId`;
3. autenticação funcional, principal e revogação;
4. contexto de empresa ativa e resolução de capacidades;
5. guards/decorators opt-in, policies e `AuditWriter` transacional;
6. migration da ETP-013 para ciclo, achados/eventos e decisões versionadas;
7. casos de uso não decisórios e consultas com isolamento empresarial;
8. submissão/decisão/rejeição/reabertura conforme policy aprovada;
9. frontend de sessão, empresa ativa, conferência, timeline e ações efetivas;
10. deny-by-default global após migração e inventário de rotas;
11. testes unitários, integração, frontend, segurança, concorrência e migração;
12. homologação assistida antes de qualquer uso operacional.

Cada migration deve ser isolada, reversível quando viável e acompanhada por validação de dados. Backend deve preceder a habilitação do frontend; o frontend não pode conter alçada ou autorização decisória.

## 18. Critérios de aceite da futura ETP-013 funcional

- autenticação e empresa ativa são obrigatórias em todas as rotas da ETP-013;
- acesso cruzado por empresa é negado em lista, detalhe e escrita;
- capabilities e policies homologadas são aplicadas no guard e no caso de uso;
- autoaprovação/segregação seguem exatamente a decisão versionada;
- ausência de policy ou assignment nega a operação;
- submissão, decisão, rejeição, reabertura e invalidação são idempotentes e append-only;
- alteração relevante após decisão produz invalidação conforme regra homologada;
- estado, evento e auditoria são atômicos;
- auditoria registra ator, empresa, trace, motivo, policy e estados permitidos;
- dados sensíveis são projetados conforme capacidade e não vazam em logs/cache;
- frontend exibe capacidades efetivas, mas a API continua sendo autoridade;
- testes cobrem matriz positiva e negativa, concorrência, revogação e multiempresa;
- nenhuma fórmula, tolerância, prazo ou regra legal não homologada é incorporada;
- documentação e status deixam claro o recorte efetivamente homologado.

## 19. Resultado deste pacote

O pacote reduz ambiguidades e prepara a homologação, mas não escolhe alternativas. BDP-009 permanece pendente e a ETP-013 continua em fundação parcial, sem implementação funcional autorizada.

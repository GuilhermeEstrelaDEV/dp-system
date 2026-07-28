# BDP-AUTH-LEGACY — Resolução de autorização e transição das APIs legadas

**Identificador:** provisório; não reserva numeração definitiva
**Versão:** 1
**Data de homologação:** 28/07/2026
**Estado atual:** `APPROVED`

## Objetivo

Preservar as decisões homologadas da BDP-AUTH-LEGACY em um registro único, versionável e auditável.
Esta resolução conclui a governança documental, mas não concede acesso nem inicia trabalho técnico.

## Escopo

Esta resolução contém as decisões homologadas de DAL-01 a DAL-14. Alternativas, recomendações e
evidências preparatórias permanecem nas fontes relacionadas. Nenhuma mudança funcional integra este
registro.

## Documentos relacionados

- [ADR-007 — Contexto de identidade e autorização empresarial](../architecture/decisions/ADR-007-identity-authorization-context.md);
- [BDP-009 — Resolução v1](BDP-009_RESOLUTION_V1.md);
- [BDP-014 — Resolução v1](BDP-014_RESOLUTION_V1.md);
- [Matriz de decisões](LEGACY_API_AUTHORIZATION_DECISION_MATRIX.md);
- [Plano incremental](LEGACY_API_AUTHORIZATION_IMPLEMENTATION_PLAN.md);
- [Gate de liberação técnica](BDP-AUTH-LEGACY_TECHNICAL_RELEASE_GATE.md);
- [Matriz de aprovação e dependências](BDP-AUTH-LEGACY_APPROVAL_MATRIX.md);
- [Questionário de homologação](BDP-AUTH-LEGACY_HOMOLOGATION_QUESTIONNAIRE.md).

## Histórico

- PR #48: inventário, prontidão, pacote de decisão e preparação de homologação incorporados à
  `develop`;
- PR #50: aprovadores do questionário reconciliados com os papéis `A` da matriz RACI;
- estado de origem: DAL-01 a DAL-14 aguardavam resposta humana;
- em 28/07/2026, o responsável pela arquitetura e governança homologou as 14 recomendações técnicas
  consolidadas, preservando os aprovadores da RACI como referência documental.

## Dependências

- ADR-007, BDP-009 v1 e BDP-014 v1 permanecem vinculantes;
- BDP-001 a BDP-008 e BDP-010 a BDP-013 limitam decisões materiais das famílias relacionadas;
- a matriz RACI define os aprovadores e é a fonte autoritativa para a homologação;
- os gates documentais foram satisfeitos; a abertura de trabalho técnico continua condicionada ao
  merge desta resolução e à verificação do repositório atualizado.

## Estado atual

`APPROVED`

As 14 decisões foram homologadas e os gates documentais foram satisfeitos. O trabalho técnico
permanece não iniciado nesta entrega.

## Decisões

## DAL-01 — Classificação das superfícies

**Aprovadores:** Segurança

**Contexto:** classificar cada superfície como pública explícita, autenticação pública, autenticada,
administrativa global, empresarial ou interna, preservando allowlist pública mínima.

**Decisão homologada:** adotar allowlist pública mínima e classificação explícita das demais
superfícies.

**Justificativa:** ausência de proteção não constitui autorização. Health e login permanecem públicos
por necessidade explícita; OpenAPI depende de habilitação ambiental; as demais superfícies exigem
classificação verificável.

**Exceções:** OpenAPI pode ser exposto somente quando explicitamente habilitado e protegido conforme o
ambiente.

**Impactos:** reduz superfície anônima, exige classificação das 163 rotas e cria a base para
deny-by-default sem converter automaticamente superfícies públicas em empresariais.

**Homologação:** responsável pela arquitetura e governança do projeto.

**Data:** 28/07/2026

**Status:** `APPROVED`

## DAL-02 — Granularidade das capabilities

**Aprovadores:** DP, Segurança

**Contexto:** definir a granularidade por módulo, recurso, leitura/escrita, caso de uso ou ação
sensível, respeitando menor privilégio.

**Decisão homologada:** organizar capabilities por recurso e leitura/escrita, com ações críticas
separadas.

**Justificativa:** o modelo equilibra administrabilidade e menor privilégio, distinguindo aprovar,
fechar, reabrir, exportar e acessar dados integrais.

**Exceções:** famílias podem exigir capability por caso de uso quando leitura/escrita não representar
adequadamente o risco.

**Impactos:** amplia precisão das concessões, testes e segregação, com aumento controlado do catálogo.

**Homologação:** responsável pela arquitetura e governança do projeto.

**Data:** 28/07/2026

**Status:** `APPROVED`

## DAL-03 — Matriz de concessão

**Aprovadores:** Segurança, Diretoria/Operação

**Contexto:** definir como capabilities serão concedidas, revisadas, revogadas e auditadas, sem
associação implícita por nome de papel.

**Decisão homologada:** usar assignments explícitos e auditáveis, sem grants automáticos por seed.

**Justificativa:** toda concessão precisa representar decisão rastreável, com empresa, vigência e
possibilidade de revogação.

**Exceções:** templates podem existir apenas como propostas revisáveis e nunca criar concessão sem
confirmação explícita.

**Impactos:** elimina privilégios implícitos e exige processo operacional de solicitação, revisão e
revogação.

**Homologação:** responsável pela arquitetura e governança do projeto.

**Data:** 28/07/2026

**Status:** `APPROVED`

## DAL-04 — Administração global e empresarial

**Aprovadores:** Segurança

**Contexto:** delimitar operações administrativas globais e operações de domínio que sempre exigem
empresa ativa validada.

**Decisão homologada:** adotar RBAC híbrido, com operações de domínio sempre empresariais.

**Justificativa:** administração técnica da plataforma pode ser global, mas permissões globais não
autorizam operações de domínio ou folha fora da empresa ativa.

**Exceções:** somente funções administrativas da plataforma classificadas explicitamente podem operar
sem contexto empresarial.

**Impactos:** preserva administração central e isolamento multiempresa, exigindo contexto validado nas
operações de domínio.

**Homologação:** responsável pela arquitetura e governança do projeto.

**Data:** 28/07/2026

**Status:** `APPROVED`

## DAL-05 — Semântica de negação

**Aprovadores:** Segurança

**Contexto:** homologar a aplicação de `401`, `403` e `404`, incluindo eventuais exceções contratuais
explicitamente documentadas.

**Decisão homologada:** retornar `401` sem identidade válida, `403` sem capability e `404` para
recurso inexistente ou pertencente a outra empresa.

**Justificativa:** a semântica uniforme evita enumeração entre empresas e torna os contratos de
negação testáveis.

**Exceções:** incompatibilidades temporárias de consumidores legados exigem adapter ou versionamento
documentado, sem revelar recursos fora do escopo.

**Impactos:** padroniza clientes e testes, podendo exigir migração de consumidores que dependam de
códigos históricos.

**Homologação:** responsável pela arquitetura e governança do projeto.

**Data:** 28/07/2026

**Status:** `APPROVED`

## DAL-06 — Visibilidade de dados sensíveis

**Aprovadores:** Segurança, Jurídico/DPO

**Contexto:** definir mascaramento, projeções permitidas e acesso integral a dados pessoais,
trabalhistas, financeiros ou médicos.

**Decisão homologada:** aplicar mascaramento e projeção allowlist por padrão, com capability adicional
para acesso integral.

**Justificativa:** o backend deve minimizar dados e entregar somente a projeção necessária à finalidade
autorizada.

**Exceções:** acesso integral é permitido somente com capability específica, empresa ativa e finalidade
compatível.

**Impactos:** reduz exposição de PII e dados trabalhistas, exigindo classificação de campos e projeções
por família.

**Homologação:** responsável pela arquitetura e governança do projeto.

**Data:** 28/07/2026

**Status:** `APPROVED`

## DAL-07 — Cobertura de auditoria

**Aprovadores:** Segurança, Jurídico/DPO

**Contexto:** delimitar auditoria de escritas críticas, leituras sensíveis e demais consultas por
família.

**Decisão homologada:** auditar escritas críticas e leituras sensíveis.

**Justificativa:** a cobertura fornece rastreabilidade relevante sem registrar indiscriminadamente
todas as consultas de baixo risco.

**Exceções:** outras leituras podem ser incluídas quando a classificação de risco ou obrigação de
controle justificar.

**Impactos:** exige taxonomia de eventos e classificação de leituras sensíveis, com controle do volume
de auditoria.

**Homologação:** responsável pela arquitetura e governança do projeto.

**Data:** 28/07/2026

**Status:** `APPROVED`

## DAL-08 — Metadata e retenção de auditoria

**Aprovadores:** Segurança, Jurídico/DPO

**Contexto:** definir metadata permitida por allowlist e os limites de preservação enquanto a
BDP-011 permanecer pendente.

**Decisão homologada:** limitar metadata por allowlist e não executar descarte automático antes da
BDP-011.

**Justificativa:** auditoria não pode se tornar repositório paralelo de PII, e evidências não devem ser
eliminadas sem política homologada.

**Exceções:** campos adicionais dependem de finalidade documentada e aprovação compatível com a
sensibilidade.

**Impactos:** padroniza metadata, proíbe segredos e payload integral e mantém preservação até decisão de
retenção.

**Homologação:** responsável pela arquitetura e governança do projeto.

**Data:** 28/07/2026

**Status:** `APPROVED`

## DAL-09 — Compatibilidade do legado

**Aprovadores:** Produto

**Contexto:** decidir entre corte, alias, adapter ou delegação canônica para cada contrato legado e
seus consumidores.

**Decisão homologada:** usar adapters temporários que deleguem exclusivamente à regra canônica.

**Justificativa:** compatibilidade de URI ou envelope não pode manter regras de domínio paralelas.

**Exceções:** corte direto somente quando todos os consumidores estiverem comprovadamente migrados e o
rollback estiver aprovado.

**Impactos:** permite migração gradual, adiciona coexistência temporária e exige equivalência contratual
e telemetria segura.

**Homologação:** responsável pela arquitetura e governança do projeto.

**Data:** 28/07/2026

**Status:** `APPROVED`

## DAL-10 — Estratégia de rollout

**Aprovadores:** Produto, Segurança

**Contexto:** definir sequência, observação, enforcement e gates da transição das famílias legadas.

**Decisão homologada:** executar rollout família por família, com telemetria segura e gates
individuais.

**Justificativa:** a migração incremental reduz o raio de impacto sobre 163 handlers e consumidores não
totalmente conhecidos.

**Exceções:** observe-only ou feature flag podem anteceder enforcement, mas nunca representam proteção
efetiva nem criam bypass.

**Impactos:** exige owner, métricas, testes, janela e aceite por família, prolongando de forma controlada
a coexistência.

**Homologação:** responsável pela arquitetura e governança do projeto.

**Data:** 28/07/2026

**Status:** `APPROVED`

## DAL-11 — Política de rollback

**Aprovadores:** Segurança

**Contexto:** definir mecanismos, gatilhos e autoridades de rollback sem restaurar bypass de
autenticação ou isolamento.

**Decisão homologada:** realizar rollback sem remover autenticação, empresa ativa ou isolamento.

**Justificativa:** contingência operacional não pode restaurar a vulnerabilidade tratada pela
transição.

**Exceções:** adapter ou envelope anterior pode ser restaurado somente quando continuar delegando à
regra segura e canônica.

**Impactos:** exige mecanismo e testes prévios de retorno, preservando controles já ativados.

**Homologação:** responsável pela arquitetura e governança do projeto.

**Data:** 28/07/2026

**Status:** `APPROVED`

## DAL-12 — Depreciação e remoção

**Aprovadores:** Produto

**Contexto:** definir comunicação, telemetria, evidências e janela necessárias antes da remoção de
contratos legados.

**Decisão homologada:** remover legado somente após comunicação, telemetria, evidência e janela
aprovada.

**Justificativa:** ausência de referência no monorepo não comprova ausência de consumidor externo.

**Exceções:** nenhuma remoção incidental; toda remoção exige PR próprio e plano de retorno.

**Impactos:** reduz quebra de consumidores, mantém aliases protegidos durante a transição e pode
prolongar dívida até haver evidência suficiente.

**Homologação:** responsável pela arquitetura e governança do projeto.

**Data:** 28/07/2026

**Status:** `APPROVED`

## DAL-13 — Segregação e grants

**Aprovadores:** Segurança, Diretoria/Operação

**Contexto:** definir ações incompatíveis e limites de substituição temporária e acesso emergencial.

**Decisão homologada:** aplicar segregação por ação e grants explícitos, temporários, expiráveis e
auditados.

**Justificativa:** substituição e emergência não podem contornar menor privilégio ou incompatibilidades
operacionais.

**Exceções:** acesso emergencial exige capability própria, motivo, escopo, duração, expiração e
auditoria reforçada.

**Impactos:** exige matriz de incompatibilidades e processo de concessão, revisão, expiração e
revogação.

**Homologação:** responsável pela arquitetura e governança do projeto.

**Data:** 28/07/2026

**Status:** `APPROVED`

## DAL-14 — Primeiro recorte técnico

**Aprovadores:** Produto, DP, Segurança

**Contexto:** escolher a primeira família, seu ownership, consumidores, dependências e critérios de
prontidão.

**Decisão homologada:** adotar o fechamento P0 como primeiro recorte, preservando contratos por
adapters temporários.

**Justificativa:** o fechamento concentra o maior risco de duplicidade e bypass sobre competência
fechada e já possui regra canônica aprovada pela BDP-014.

**Exceções:** nenhum contrato legado será removido antes de inventário, migração, telemetria, janela e
critérios de descontinuação.

**Impactos:** consolida regra canônica, exige migração gradual dos consumidores e mantém compatibilidade
temporária sem duplicar domínio.

**Homologação:** responsável pela arquitetura e governança do projeto.

**Data:** 28/07/2026

**Status:** `APPROVED`

## Condição para homologação

DAL-01 a DAL-14 foram homologadas pelo responsável pela arquitetura e governança em 28/07/2026. Os
gates documentais estão atendidos. O trabalho técnico não integra esta resolução e permanece não
iniciado até o merge do PR correspondente e a verificação da `develop` atualizada.
